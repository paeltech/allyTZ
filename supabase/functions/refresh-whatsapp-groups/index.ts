import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// WaSender API credentials from environment variables
const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
const WASENDER_SESSION_ID = Deno.env.get("WASENDER_SESSION_ID");

// Participant formats to try (API requires participants despite docs saying optional)
const PARTICIPANT_FORMATS = [
    "255716885996",              // Just the number
    "255716885996@c.us",         // With @c.us suffix
    "255716885996@s.whatsapp.net" // With @s.whatsapp.net suffix
];

// Rate limiting configuration for adding members to groups
// Conservative settings to avoid WhatsApp spam detection
const BATCH_SIZE = 5;                      // Add 5 members at a time
const DELAY_BETWEEN_MEMBERS_MIN = 2000;    // Min 2 seconds between members
const DELAY_BETWEEN_MEMBERS_MAX = 5000;    // Max 5 seconds between members
const DELAY_BETWEEN_BATCHES_MIN = 10000;   // Min 10 seconds between batches
const DELAY_BETWEEN_BATCHES_MAX = 20000;   // Max 20 seconds between batches

// Helper function to get random delay in a range
function getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to delay execution
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get current month in YYYY-MM format
function getCurrentMonthYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

// Get previous month in YYYY-MM format
function getPreviousMonthYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
}

// Helper function to log operations
async function logOperation(
    supabaseClient: any,
    operationType: string,
    groupId: string | null,
    groupJid: string | null,
    userId: string | null,
    phoneNumber: string | null,
    success: boolean,
    errorMessage: string | null,
    responseData: any = null
) {
    try {
        await supabaseClient.from("whatsapp_group_operations").insert({
            operation_type: operationType,
            group_id: groupId,
            group_jid: groupJid,
            user_id: userId,
            phone_number: phoneNumber,
            success,
            error_message: errorMessage,
            response_data: responseData,
        });
    } catch (error) {
        console.error("Failed to log operation:", error);
    }
}

// Create a new WhatsApp group via WaSender API
async function createGroup(
    supabaseClient: any,
    groupName: string,
    monthYear: string,
    groupNumber: number
): Promise<any> {
    // Try different participant formats until one works
    let lastError: any = null;
    
    for (const participantFormat of PARTICIPANT_FORMATS) {
        try {
            console.log(`Attempting to create group with participant format: ${participantFormat}`);
            
            const url = `https://www.wasenderapi.com/api/groups`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${WASENDER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: groupName,
                    participants: [participantFormat], // API requires this despite docs saying optional
                }),
            });

            const responseText = await response.text();
            let data: any;
            
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            // WaSender API returns: { success: true, data: { id: "...", subject: "...", ... } }
            if (!response.ok || !data.success || !data.data?.id) {
                const errorMsg = data?.error || data?.message || data?.data?.error || `HTTP ${response.status}`;
                lastError = new Error(`Failed with format ${participantFormat}: ${errorMsg}`);
                console.warn(lastError.message);
                continue; // Try next format
            }

            // Success! Log which format worked
            console.log(`✅ Group created successfully with participant format: ${participantFormat}`);
            
            // Extract group JID and save to database
            return await saveGroupToDatabase(supabaseClient, data, groupName, monthYear, groupNumber);
            
        } catch (error) {
            lastError = error;
            console.warn(`Failed with format ${participantFormat}:`, error);
            continue; // Try next format
        }
    }
    
    // If we get here, all formats failed
    await logOperation(supabaseClient, "create", null, null, null, null, false, 
        `All participant formats failed. Last error: ${lastError?.message}`, null);
    throw new Error(`Failed to create group after trying all participant formats. Last error: ${lastError?.message}`);
}

// Helper function to save group to database
async function saveGroupToDatabase(
    supabaseClient: any,
    apiResponse: any,
    groupName: string,
    monthYear: string,
    groupNumber: number
): Promise<any> {
    try {
        // Extract group JID from response.data.id
        const groupJid = apiResponse.data.id;

        // Insert group into database
        const { data: groupData, error: insertError } = await supabaseClient
            .from("whatsapp_groups")
            .insert({
                group_name: groupName,
                group_jid: groupJid,
                group_number: groupNumber,
                month_year: monthYear,
                member_count: 0, // Session owner is in group but we track only added subscribers
                is_active: true,
            })
            .select()
            .single();

        if (insertError) {
            await logOperation(supabaseClient, "create", null, groupJid, null, null, false, insertError.message, apiResponse);
            throw new Error(`Failed to save group to database: ${insertError.message}`);
        }

        await logOperation(supabaseClient, "create", groupData.id, groupJid, null, null, true, null, apiResponse);

        return groupData;
    } catch (error) {
        console.error("Error saving group to database:", error);
        throw error;
    }
}

// Add member to group directly via WaSender API
async function addMemberToGroup(
    supabaseClient: any,
    groupJid: string,
    phoneNumber: string,
    userId: string
): Promise<void> {
    try {
        // Clean phone number to E.164 format (just digits)
        const cleanPhoneNumber = phoneNumber.replace(/^\+/, "").replace(/\s/g, "").replace(/[^0-9]/g, "");
        
        console.log(`📞 Adding member directly via WaSender API`);
        console.log(`  Phone: ${phoneNumber} → ${cleanPhoneNumber}`);
        console.log(`  Group JID: ${groupJid}`);
        
        // Call WaSender API directly
        const url = `https://www.wasenderapi.com/api/groups/${encodeURIComponent(groupJid)}/participants/add`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WASENDER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                participants: [cleanPhoneNumber],
            }),
        });

        console.log(`📡 WaSender API response: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        let data: any;
        
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { raw_response: responseText };
        }

        console.log(`📥 Response:`, JSON.stringify(data, null, 2));

        if (!response.ok || !data.success) {
            const errorMsg = data?.error || data?.message || `HTTP ${response.status}`;
            console.error(`❌ API Error: ${errorMsg}`);
            throw new Error(`Failed to add member: ${errorMsg}`);
        }

        // Check participant result
        const participantResult = data.data?.find((p: any) => 
            p.jid === cleanPhoneNumber || 
            p.jid === `${cleanPhoneNumber}@s.whatsapp.net` || 
            p.jid === `${cleanPhoneNumber}@c.us`
        );
        
        if (participantResult && participantResult.status !== 200) {
            throw new Error(`Status ${participantResult.status}: ${participantResult.message}`);
        }

        console.log(`✅ Successfully added ${phoneNumber} to group`);
    } catch (error) {
        console.error(`❌ Error adding member:`, error);
        throw error;
    }
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Validate WaSender credentials
        if (!WASENDER_API_KEY || !WASENDER_SESSION_ID) {
            throw new Error("WaSender API credentials not configured");
        }

        // Initialize Supabase client with service role
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const currentMonthYear = getCurrentMonthYear();
        const previousMonthYear = getPreviousMonthYear();

        console.log(`Refreshing groups for ${currentMonthYear}`);

        // Check if groups already exist for current month
        const { data: existingGroups, error: checkError } = await supabaseClient
            .from("whatsapp_groups")
            .select("*")
            .eq("is_active", true)
            .eq("month_year", currentMonthYear);

        if (checkError) {
            throw new Error(`Failed to check existing groups: ${checkError.message}`);
        }

        let shouldCreateNewGroup = !existingGroups || existingGroups.length === 0;

        // If groups already exist, we'll add missing members instead of returning early
        if (existingGroups && existingGroups.length > 0) {
            console.log(`Groups already exist for ${currentMonthYear}. Will add any missing members.`);
        }

        // Deactivate old groups from previous month (only if creating new groups)
        if (shouldCreateNewGroup) {
            const { error: deactivateError } = await supabaseClient
                .from("whatsapp_groups")
                .update({ is_active: false })
                .eq("month_year", previousMonthYear)
                .eq("is_active", true);

            if (deactivateError) {
                console.warn(`Failed to deactivate old groups: ${deactivateError.message}`);
            } else {
                console.log(`Deactivated groups from ${previousMonthYear}`);
            }
        }

        // Get all users with verified phone numbers and WhatsApp notifications enabled
        // (Subscription check removed - all users can be added to groups)
        const { data: users, error: usersError } = await supabaseClient
            .from("user_profiles")
            .select("id")
            .eq("phone_verified", true)
            .eq("whatsapp_notifications_enabled", true);

        if (usersError) {
            throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        console.log(`Found ${users?.length || 0} users with verified phone numbers and WhatsApp notifications enabled`);

        if (!users || users.length === 0) {
            // Create empty group for the month anyway
            const emptyGroup = await createGroup(
                supabaseClient,
                "AllyTZ Panel - Monthly Subscribers",
                currentMonthYear,
                1
            );

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `No active subscriptions found. Created empty group for ${currentMonthYear}`,
                    groups: [emptyGroup],
                    subscribersAdded: 0,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get user profiles for all users with verified phone numbers and WhatsApp enabled
        // (Subscription check removed - all users can be added to groups)
        const { data: profiles, error: profilesError } = await supabaseClient
            .from("user_profiles")
            .select("id, phone_number, phone_verified, whatsapp_notifications_enabled")
            .eq("phone_verified", true)
            .eq("whatsapp_notifications_enabled", true)
            .not("phone_number", "is", null);

        if (profilesError) {
            throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
        }

        console.log(`Found ${profiles?.length || 0} users matching all criteria (phone_verified=true, whatsapp_notifications_enabled=true, has phone number)`);

        // Map profiles to the format expected by the rest of the function
        const validSubscriptions = (profiles || []).map(profile => ({
            user_id: profile.id,
            user_profiles: profile,
        }));

        if (!validSubscriptions || validSubscriptions.length === 0) {
            // Create empty group if none exists, otherwise return existing group
            if (shouldCreateNewGroup) {
                const emptyGroup = await createGroup(
                    supabaseClient,
                    "AllyTZ Panel - Monthly Subscribers",
                    currentMonthYear,
                    1
                );

                console.warn(`No valid subscriptions found after filtering. Check that users have phone_verified=true and whatsapp_notifications_enabled=true`);

                const profileDetails = allProfiles?.map(p => ({
                    id: p.id.substring(0, 8),
                    hasPhone: !!p.phone_number,
                    phoneVerified: p.phone_verified,
                    whatsappEnabled: p.whatsapp_notifications_enabled,
                }));

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `No users with valid criteria found. Created empty group for ${currentMonthYear}`,
                        groups: [emptyGroup],
                        subscribersAdded: 0,
                        debug: {
                            totalUsers: users?.length || 0,
                            profilesFound: profiles?.length || 0,
                            issue: "No user profiles found with verified phone numbers and WhatsApp notifications enabled"
                        }
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            } else {
                // Show detailed debug info
                const profileDetails = allProfiles?.map(p => ({
                    id: p.id.substring(0, 8),
                    hasPhone: !!p.phone_number,
                    phoneVerified: p.phone_verified,
                    whatsappEnabled: p.whatsapp_notifications_enabled,
                }));

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `No new users to add. Groups for ${currentMonthYear} already exist.`,
                        groups: existingGroups,
                        subscribersAdded: 0,
                        debug: {
                            totalUsers: users?.length || 0,
                            profilesFound: profiles?.length || 0,
                            issue: "No user profiles found with verified phone numbers and WhatsApp notifications enabled"
                        }
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        console.log(`Found ${validSubscriptions.length} users to add to groups`);

        // Use existing group or create new one
        let currentGroup;
        let currentGroupNumber;
        let groups;
        
        if (shouldCreateNewGroup) {
            // Create first group
            currentGroup = await createGroup(
                supabaseClient,
                "AllyTZ Panel - Monthly Subscribers",
                currentMonthYear,
                1
            );
            currentGroupNumber = 1;
            groups = [currentGroup];
        } else {
            // Use existing groups
            currentGroup = existingGroups![0];
            currentGroupNumber = currentGroup.group_number;
            groups = existingGroups!;
        }

        let membersInCurrentGroup = currentGroup.member_count || 0;
        let subscribersAdded = 0;
        let subscribersFailed = 0;

        // Get current group memberships to avoid duplicates
        const { data: existingMemberships } = await supabaseClient
            .from("signal_subscriptions")
            .select("user_id, whatsapp_group_jid")
            .in("user_id", validSubscriptions.map(s => s.user_id))
            .not("whatsapp_group_jid", "is", null);
        
        const alreadyInGroup = new Set(existingMemberships?.map(m => m.user_id) || []);
        console.log(`${alreadyInGroup.size} subscribers already in groups, ${validSubscriptions.length - alreadyInGroup.size} to add`);

        // Add subscribers to groups with batching and rate limiting
        console.log(`🔄 Starting to add ${validSubscriptions.length} subscribers to groups...`);
        console.log(`⚙️  Rate limiting: ${BATCH_SIZE} members per batch`);
        console.log(`⚙️  Random delays: ${DELAY_BETWEEN_MEMBERS_MIN}-${DELAY_BETWEEN_MEMBERS_MAX}ms between members, ${DELAY_BETWEEN_BATCHES_MIN}-${DELAY_BETWEEN_BATCHES_MAX}ms between batches`);
        
        for (let i = 0; i < validSubscriptions.length; i++) {
            const subscription = validSubscriptions[i];
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const positionInBatch = (i % BATCH_SIZE) + 1;
            
            console.log(`\n📝 [Batch ${batchNumber}, Member ${positionInBatch}/${BATCH_SIZE}] Processing subscriber ${i + 1}/${validSubscriptions.length}: ${subscription.user_id}`);
            
            const profile = subscription.user_profiles;
            if (!profile || !profile.phone_number) {
                console.log(`⏭️  Skipping - no profile or phone number`);
                continue;
            }

            // Skip if already in a group
            if (alreadyInGroup.has(subscription.user_id)) {
                console.log(`⏭️  Skipping - already in group`);
                continue;
            }

            console.log(`👤 Will add phone: ${profile.phone_number}`);

            // If current group is full, create a new one or use next existing group
            if (membersInCurrentGroup >= 1024) {
                console.log(`📦 Current group full, creating/using overflow group...`);
                currentGroupNumber++;
                
                // Check if next group already exists
                const nextGroup = groups.find(g => g.group_number === currentGroupNumber);
                if (nextGroup) {
                    currentGroup = nextGroup;
                    membersInCurrentGroup = currentGroup.member_count || 0;
                    console.log(`✅ Using existing overflow group ${currentGroup.group_name}`);
                } else {
                    currentGroup = await createGroup(
                        supabaseClient,
                        "AllyTZ Panel - Monthly Subscribers",
                        currentMonthYear,
                        currentGroupNumber
                    );
                    groups.push(currentGroup);
                    membersInCurrentGroup = 0;
                    console.log(`✅ Created new overflow group ${currentGroup.group_name}`);
                }
            }

            try {
                console.log(`🔹 Step 1: Adding member to group...`);
                // Add member to current group
                await addMemberToGroup(
                    supabaseClient,
                    currentGroup.group_jid,
                    profile.phone_number,
                    subscription.user_id
                );
                console.log(`✅ Step 1 complete`);

                console.log(`🔹 Step 2: Skipping subscription update (subscriptions removed)...`);
                // Note: Subscription tracking removed - users are added directly to groups
                console.log(`✅ Step 2 complete`);

                console.log(`🔹 Step 3: Updating group member count...`);
                // Update member count
                await supabaseClient
                    .from("whatsapp_groups")
                    .update({ member_count: membersInCurrentGroup + 1 })
                    .eq("id", currentGroup.id);
                console.log(`✅ Step 3 complete`);

                membersInCurrentGroup++;
                subscribersAdded++;
                console.log(`✅ Successfully added user ${subscription.user_id} to group ${currentGroup.group_name} (Total: ${subscribersAdded}/${validSubscriptions.length})`);
                
                // Rate limiting with random delays to appear more natural
                if (positionInBatch === BATCH_SIZE && i < validSubscriptions.length - 1) {
                    // End of batch - longer random delay
                    const batchDelay = getRandomDelay(DELAY_BETWEEN_BATCHES_MIN, DELAY_BETWEEN_BATCHES_MAX);
                    console.log(`⏸️  End of batch ${batchNumber}. Waiting ${(batchDelay / 1000).toFixed(1)}s before next batch...`);
                    await delay(batchDelay);
                } else if (i < validSubscriptions.length - 1) {
                    // Between members in same batch - shorter random delay
                    const memberDelay = getRandomDelay(DELAY_BETWEEN_MEMBERS_MIN, DELAY_BETWEEN_MEMBERS_MAX);
                    console.log(`⏸️  Waiting ${(memberDelay / 1000).toFixed(1)}s before next member...`);
                    await delay(memberDelay);
                }
                
            } catch (error) {
                console.error(`❌ Failed to add subscriber ${subscription.user_id}:`, error);
                console.error(`❌ Error details:`, error instanceof Error ? error.message : String(error));
                subscribersFailed++;
                
                // Still apply random delay even on error to avoid rapid-fire failures triggering spam detection
                if (i < validSubscriptions.length - 1) {
                    const errorDelay = getRandomDelay(DELAY_BETWEEN_MEMBERS_MIN, DELAY_BETWEEN_MEMBERS_MAX);
                    console.log(`⏸️  Error occurred. Waiting ${(errorDelay / 1000).toFixed(1)}s before continuing...`);
                    await delay(errorDelay);
                }
            }
        }
        
        console.log(`\n📊 Final results: ${subscribersAdded} added, ${subscribersFailed} failed`);

        // Log refresh operation
        await logOperation(
            supabaseClient,
            "refresh",
            null,
            null,
            null,
            null,
            true,
            null,
            {
                monthYear: currentMonthYear,
                groupsCreated: groups.length,
                subscribersAdded,
                subscribersFailed,
            }
        );

        return new Response(
            JSON.stringify({
                success: true,
                message: `Refreshed groups for ${currentMonthYear}`,
                groups: groups.map(g => ({
                    id: g.id,
                    group_name: g.group_name,
                    group_jid: g.group_jid,
                    group_number: g.group_number,
                    member_count: g.member_count,
                })),
                subscribersAdded,
                subscribersFailed,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in refresh-whatsapp-groups:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
