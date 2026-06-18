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

// Helper function to convert phone to JID for adding members
function toUserJidFromPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const cleaned = phone.replace("+", "").replace(/\s/g, "").replace(/[^0-9]/g, "");
    if (cleaned.length < 7) return null;
    return `${cleaned}@s.whatsapp.net`;
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

// Get current month in YYYY-MM format
function getCurrentMonthYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

// Create a new WhatsApp group via WaSender API
async function createGroup(
    supabaseClient: any,
    groupName: string = "AllyTZ Panel - Monthly Subscribers",
    monthYear: string,
    groupNumber: number = 1
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
            const groupJid = data.data.id;
            
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
                await logOperation(supabaseClient, "create", null, groupJid, null, null, false, insertError.message, data);
                throw new Error(`Failed to save group to database: ${insertError.message}`);
            }

            await logOperation(supabaseClient, "create", groupData.id, groupJid, null, null, true, null, data);

            return {
                success: true,
                group: groupData,
                groupJid,
            };
            
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

// Add a member to a WhatsApp group
async function addMemberToGroup(
    supabaseClient: any,
    groupJid: string,
    phoneNumber: string,
    userId: string
): Promise<any> {
    try {
        // Clean phone number to E.164 format (just digits, no + or spaces)
        // According to API docs: "Array of participant JIDs in E.164 format (international phone numbers) e.g., 1234567890"
        const cleanPhoneNumber = phoneNumber.replace(/^\+/, "").replace(/\s/g, "").replace(/[^0-9]/g, "");
        
        console.log(`🔍 Adding member to group`);
        console.log(`  Original phone: ${phoneNumber}`);
        console.log(`  Cleaned (E.164): ${cleanPhoneNumber}`);
        console.log(`  Group JID: ${groupJid}`);
        console.log(`  Endpoint: /api/groups/${groupJid}/participants/add`);
        console.log(`  Payload: ${JSON.stringify({ participants: [cleanPhoneNumber] })}`);
        
        // Correct endpoint according to WaSender API: /api/groups/{groupJid}/participants/add
        const url = `https://www.wasenderapi.com/api/groups/${encodeURIComponent(groupJid)}/participants/add`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WASENDER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                participants: [cleanPhoneNumber], // Just the number in E.164 format
            }),
        });
        
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        let data: any;
        
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { raw_response: responseText };
        }

        console.log(`📥 Full API Response:`, JSON.stringify(data, null, 2));

        // WaSender API returns: { success: true, data: [ { status: 200, jid: "...", message: "added" } ] }
        if (!response.ok || !data.success) {
            const errorMsg = data?.error || data?.message || data?.data?.error || `HTTP ${response.status}`;
            
            console.error(`❌ API Error:`, errorMsg);
            console.error(`❌ Full error response:`, JSON.stringify(data, null, 2));
            
            // Get group ID for logging
            const { data: groupData } = await supabaseClient
                .from("whatsapp_groups")
                .select("id")
                .eq("group_jid", groupJid)
                .single();

            await logOperation(
                supabaseClient,
                "add_member",
                groupData?.id || null,
                groupJid,
                userId,
                phoneNumber,
                false,
                errorMsg,
                data
            );

            throw new Error(`Failed to add member: ${errorMsg}. Response: ${JSON.stringify(data)}`);
        }

        // Check if the participant was actually added (status 200)
        console.log(`🔍 Checking participant result in data array...`);
        const participantResult = data.data?.find((p: any) => p.jid === cleanPhoneNumber || p.jid === `${cleanPhoneNumber}@s.whatsapp.net` || p.jid === `${cleanPhoneNumber}@c.us`);
        
        if (participantResult) {
            console.log(`📊 Participant result:`, JSON.stringify(participantResult, null, 2));
            
            if (participantResult.status !== 200) {
                const errorMsg = `Status ${participantResult.status}: ${participantResult.message}`;
                console.error(`❌ ${errorMsg}`);
                
                // Log as failed operation
                const { data: groupData } = await supabaseClient
                    .from("whatsapp_groups")
                    .select("id")
                    .eq("group_jid", groupJid)
                    .single();

                await logOperation(
                    supabaseClient,
                    "add_member",
                    groupData?.id || null,
                    groupJid,
                    userId,
                    phoneNumber,
                    false,
                    errorMsg,
                    participantResult
                );
                
                throw new Error(`Failed to add member: ${errorMsg}`);
            } else {
                console.log(`✅ Member ${phoneNumber} added successfully!`);
            }
        } else {
            console.warn(`⚠️ Could not find participant result for ${cleanPhoneNumber} in response`);
            console.log(`✅ Assuming member ${phoneNumber} was added (API returned success: true)`);
        }

        // Update member count in database
        const { error: updateError } = await supabaseClient.rpc("increment_group_member_count", {
            group_jid_param: groupJid,
        });

        if (updateError) {
            // Fallback: manual update if RPC doesn't exist
            const { data: groupData } = await supabaseClient
                .from("whatsapp_groups")
                .select("id, member_count")
                .eq("group_jid", groupJid)
                .single();

            if (groupData) {
                await supabaseClient
                    .from("whatsapp_groups")
                    .update({ member_count: (groupData.member_count || 0) + 1 })
                    .eq("id", groupData.id);
            }
        }

        // Get group ID for logging
        const { data: groupData } = await supabaseClient
            .from("whatsapp_groups")
            .select("id")
            .eq("group_jid", groupJid)
            .single();

        await logOperation(
            supabaseClient,
            "add_member",
            groupData?.id || null,
            groupJid,
            userId,
            phoneNumber,
            true,
            null,
            null
        );

        return {
            success: true,
            message: "Member added successfully",
        };
    } catch (error) {
        console.error("Error adding member to group:", error);
        throw error;
    }
}

// Remove a member from a WhatsApp group
async function removeMemberFromGroup(
    supabaseClient: any,
    groupJid: string,
    phoneNumber: string,
    userId: string
): Promise<any> {
    try {
        // Clean phone number to E.164 format (just digits)
        const cleanPhoneNumber = phoneNumber.replace(/^\+/, "").replace(/\s/g, "").replace(/[^0-9]/g, "");
        
        console.log(`Removing member ${phoneNumber} (cleaned: ${cleanPhoneNumber}) from group ${groupJid}`);
        
        // Use the remove endpoint (based on WaSender API pattern)
        const url = `https://www.wasenderapi.com/api/groups/${encodeURIComponent(groupJid)}/participants/remove`;

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

        const responseText = await response.text();
        let data: any;
        
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { raw_response: responseText };
        }

        console.log(`API Response for removing ${cleanPhoneNumber}:`, JSON.stringify(data));

        // WaSender API returns: { success: true, data: [...] }
        if (!response.ok || !data.success) {
            const errorMsg = data?.error || data?.message || data?.data?.error || `HTTP ${response.status}`;
            
            // Get group ID for logging
            const { data: groupData } = await supabaseClient
                .from("whatsapp_groups")
                .select("id")
                .eq("group_jid", groupJid)
                .single();

            await logOperation(
                supabaseClient,
                "remove_member",
                groupData?.id || null,
                groupJid,
                userId,
                phoneNumber,
                false,
                errorMsg,
                data
            );

            throw new Error(`Failed to remove member: ${errorMsg}. Response: ${JSON.stringify(data)}`);
        }

        console.log(`✅ Member ${phoneNumber} removed successfully!`);

        // Decrement member count in database
        const { data: groupData } = await supabaseClient
            .from("whatsapp_groups")
            .select("id, member_count")
            .eq("group_jid", groupJid)
            .single();

        if (groupData && groupData.member_count > 0) {
            await supabaseClient
                .from("whatsapp_groups")
                .update({ member_count: groupData.member_count - 1 })
                .eq("id", groupData.id);
        }

        await logOperation(
            supabaseClient,
            "remove_member",
            groupData?.id || null,
            groupJid,
            userId,
            phoneNumber,
            true,
            null,
            null
        );

        return {
            success: true,
            message: "Member removed successfully",
        };
    } catch (error) {
        console.error("Error removing member from group:", error);
        throw error;
    }
}

// Get or create active group for current month
async function getOrCreateActiveGroup(
    supabaseClient: any,
    monthYear?: string
): Promise<any> {
    const currentMonthYear = monthYear || getCurrentMonthYear();

    // Check for active group with space available
    const { data: activeGroups, error: fetchError } = await supabaseClient
        .from("whatsapp_groups")
        .select("*")
        .eq("is_active", true)
        .eq("month_year", currentMonthYear)
        .lt("member_count", 1024)
        .order("group_number", { ascending: true })
        .limit(1);

    if (fetchError) {
        throw new Error(`Failed to fetch groups: ${fetchError.message}`);
    }

    // If active group with space exists, return it
    if (activeGroups && activeGroups.length > 0) {
        return {
            success: true,
            group: activeGroups[0],
            created: false,
        };
    }

    // Find the highest group number for this month to create overflow group
    const { data: allGroups } = await supabaseClient
        .from("whatsapp_groups")
        .select("group_number")
        .eq("month_year", currentMonthYear)
        .order("group_number", { ascending: false })
        .limit(1);

    const nextGroupNumber = allGroups && allGroups.length > 0
        ? allGroups[0].group_number + 1
        : 1;

    // Create new group
    const result = await createGroup(
        supabaseClient,
        "AllyTZ Panel - Monthly Subscribers",
        currentMonthYear,
        nextGroupNumber
    );

    return {
        success: true,
        group: result.group,
        created: true,
    };
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log(`📨 Received request to manage-whatsapp-groups`);
        console.log(`🔑 Authorization header present: ${!!req.headers.get("authorization")}`);
        console.log(`🔑 Apikey header present: ${!!req.headers.get("apikey")}`);
        
        const { action, groupJid, phoneNumber, userId, groupName, monthYear } = await req.json();
        console.log(`📋 Action: ${action}, Phone: ${phoneNumber}, GroupJid: ${groupJid}`);

        if (!action) {
            throw new Error("action is required");
        }

        // Validate WaSender credentials
        if (!WASENDER_API_KEY || !WASENDER_SESSION_ID) {
            throw new Error("WaSender API credentials not configured");
        }

        // Initialize Supabase client - use the service role key from the request if available
        // This allows the function to be called by other functions with proper auth
        const authHeader = req.headers.get("authorization");
        const supabaseKey = authHeader?.replace("Bearer ", "") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        
        console.log(`🔧 Initializing Supabase client with key from: ${authHeader ? "request header" : "environment"}`);
        
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            supabaseKey
        );

        let result;

        switch (action) {
            case "create_group":
                if (!monthYear) {
                    throw new Error("monthYear is required for create_group action");
                }
                result = await createGroup(
                    supabaseClient,
                    groupName || "AllyTZ Panel - Monthly Subscribers",
                    monthYear,
                    1
                );
                break;

            case "add_member":
                if (!groupJid || !phoneNumber || !userId) {
                    throw new Error("groupJid, phoneNumber, and userId are required for add_member action");
                }
                result = await addMemberToGroup(supabaseClient, groupJid, phoneNumber, userId);
                break;

            case "remove_member":
                if (!groupJid || !phoneNumber || !userId) {
                    throw new Error("groupJid, phoneNumber, and userId are required for remove_member action");
                }
                result = await removeMemberFromGroup(supabaseClient, groupJid, phoneNumber, userId);
                break;

            case "get_or_create_active_group":
                result = await getOrCreateActiveGroup(supabaseClient, monthYear);
                break;

            case "get_active_groups":
                const currentMonthYear = monthYear || getCurrentMonthYear();
                const { data: groups, error: groupsError } = await supabaseClient
                    .from("whatsapp_groups")
                    .select("*")
                    .eq("is_active", true)
                    .eq("month_year", currentMonthYear)
                    .order("group_number", { ascending: true });

                if (groupsError) {
                    throw new Error(`Failed to fetch groups: ${groupsError.message}`);
                }

                result = {
                    success: true,
                    groups: groups || [],
                };
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in manage-whatsapp-groups:", error);
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
