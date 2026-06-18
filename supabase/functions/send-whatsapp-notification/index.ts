import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Facebook WhatsApp Business API credentials from environment variables
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v24.0";

// Individual messaging configuration
const BATCH_SIZE = 10; // Number of messages to send in parallel per batch
const BATCH_DELAY_MS = 500; // Delay between batches to avoid rate limits
const MAX_RETRIES = 2; // Maximum retry attempts for failed messages
const RETRY_DELAYS = [5000, 10000]; // Retry delays (5s, 10s)

interface SignalData {
    id: string;
    trading_pair: string;
    signal_type: string;
    entry_price: number;
    stop_loss: number;
    take_profit_1?: number;
    take_profit_2?: number;
    take_profit_3?: number;
    title: string;
    analysis?: string;
    risk_reward_ratio?: number;
    confidence_level?: string;
}

function formatSignalMessage(signal: SignalData): string {
    const emoji = signal.signal_type === 'buy' ? '📈' : '📉';

    // Use signal title as the main message title
    let message = `🚨 *${signal.title}* 🚨\n\n`;
    
    // Trading pair and signal type
    message += `📊 *Pair*: ${signal.trading_pair}\n`;
    message += `${emoji} *Type*: ${signal.signal_type.toUpperCase()}\n\n`;
    
    // Entry price
    message += `💰 *Entry*: ${signal.entry_price}\n`;
    
    // Take profit levels
    if (signal.take_profit_1) {
        message += `🎯 *TP1*: ${signal.take_profit_1}\n`;
    }
    if (signal.take_profit_2) {
        message += `🎯 *TP2*: ${signal.take_profit_2}\n`;
    }
    if (signal.take_profit_3) {
        message += `🎯 *TP3*: ${signal.take_profit_3}\n`;
    }

    message += `\n`;

    // Risk/Reward and Confidence
    if (signal.risk_reward_ratio) {
        message += `⚖️ *R:R*: 1:${signal.risk_reward_ratio}\n`;
    }
    if (signal.confidence_level) {
        message += `💪 *Confidence*: ${signal.confidence_level.toUpperCase()}\n`;
    }

    // Include full analysis if available (WhatsApp messages can be up to 4096 characters)
    if (signal.analysis && signal.analysis.trim()) {
        message += `\n📝 *Analysis*\n`;
        message += `${signal.analysis}\n`;
    }

    // Footer with link
    message += `\n_Login to the dashboard to view the full signal details with SL and bonus TPs_\n`;
    message += `\n🔗 https://allytz.co/dashboard/signals\n`;
    message += `\n_Trade responsibly. Manage your risk._`;

    return message;
}

// Send individual WhatsApp message via Facebook Graph API
async function sendIndividualMessage(
    phoneNumber: string,
    message: string,
    retryCount: number = 0
): Promise<any> {
    // Clean phone number: remove + and ensure it's in E.164 format
    const cleanPhoneNumber = phoneNumber.replace(/^\+/, "").replace(/\s/g, "").replace(/[^0-9]/g, "");
    
    // Format phone number with + prefix for API
    const formattedPhoneNumber = `+${cleanPhoneNumber}`;
    
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formattedPhoneNumber,
                type: "text",
                text: {
                    preview_url: false,
                    body: message,
                },
            }),
        });

        const data = await response.json();

        // Log response for debugging
        console.log(`Facebook Graph API response for ${formattedPhoneNumber}:`, {
            status: response.status,
            data: JSON.stringify(data).substring(0, 200)
        });

        // Handle rate limiting (429) with retry
        if (response.status === 429 && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            const retryAfter = response.headers.get('Retry-After');
            const actualDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
            
            console.log(`Rate limited (429). Waiting ${actualDelay}ms before retry (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, actualDelay));
            return sendIndividualMessage(phoneNumber, message, retryCount + 1);
        }

        // Handle server errors (5xx) with retry
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.log(`Server error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendIndividualMessage(phoneNumber, message, retryCount + 1);
        }

        // Extract error message from response if present
        const errorMessage = data.error?.message || data.error_message || 
            (data.error?.code ? `Error code: ${data.error.code}` : null) ||
            (response.status === 429 ? 'Rate limit exceeded' : null) ||
            (response.status >= 400 && response.status < 500 ? `Client error: ${response.status}` : null) ||
            (response.status >= 500 ? `Server error: ${response.status}` : null);

        // Return response with HTTP status and error info
        return {
            ...data,
            httpStatus: response.status,
            error: errorMessage,
            error_code: data.error?.code,
            error_message: errorMessage,
            isSuccess: response.status >= 200 && response.status < 300 && !data.error && data.messages && data.messages[0]?.id
        };
    } catch (error) {
        // Network errors - retry if attempts remaining
        if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.log(`Network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendIndividualMessage(phoneNumber, message, retryCount + 1);
        }
        
        // Max retries reached or non-retryable error
        throw error;
    }
}

// Helper function to log notification operations
async function logNotificationOperation(
    supabaseClient: any,
    signalId: string,
    userId: string | null,
    phoneNumber: string | null,
    success: boolean,
    errorMessage: string | null,
    messageId: string | null = null,
    messageContent: string | null = null,
    responseData: any = null
) {
    try {
        await supabaseClient.from("notification_logs").insert({
            signal_id: signalId,
            user_id: userId,
            notification_type: "whatsapp",
            phone_number: phoneNumber,
            message_content: messageContent || "Signal notification",
            success,
            error_message: errorMessage,
            provider_message_id: messageId, // Use provider_message_id for webhook tracking
            status: success ? "sent" : "failed",
            sent_at: success ? new Date().toISOString() : null,
            response_data: responseData,
        });
    } catch (error) {
        console.error("Failed to log notification operation:", error);
    }
}


serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { signalId } = await req.json();

        if (!signalId) {
            throw new Error("signalId is required");
        }

        // Validate Facebook WhatsApp API credentials
        if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
            throw new Error("WhatsApp API credentials not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN");
        }

        // Validate access token format (should not be the same as phone number ID)
        if (WHATSAPP_ACCESS_TOKEN === WHATSAPP_PHONE_NUMBER_ID) {
            throw new Error("WHATSAPP_ACCESS_TOKEN cannot be the same as WHATSAPP_PHONE_NUMBER_ID. Please set a valid Facebook OAuth access token.");
        }

        // Log token info for debugging (without exposing the full token)
        console.log("WhatsApp API Configuration:", {
            phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
            apiVersion: WHATSAPP_API_VERSION,
            accessTokenPrefix: WHATSAPP_ACCESS_TOKEN.substring(0, 10) + "...",
            accessTokenLength: WHATSAPP_ACCESS_TOKEN.length
        });

        // Initialize Supabase client with service role
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log("Fetching signal with ID:", signalId);

        // Fetch signal details
        const { data: signal, error: signalError } = await supabaseClient
            .from("signals")
            .select("*")
            .eq("id", signalId)
            .single();

        console.log("Signal fetch result:", { signal, error: signalError });

        if (signalError || !signal) {
            console.error("Error fetching signal:", signalError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Failed to fetch signal: ${signalError?.message || 'Signal not found'}`
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Format the message
        const message = formatSignalMessage(signal);

        console.log("Fetching users with WhatsApp notifications enabled...");

        // Fetch all users with verified phone numbers and WhatsApp notifications enabled
        // (Subscription check removed - all users can receive notifications)
        const { data: profiles, error: profilesError } = await supabaseClient
            .from("user_profiles")
            .select("id, phone_number, phone_verified, whatsapp_notifications_enabled")
            .eq("phone_verified", true)
            .eq("whatsapp_notifications_enabled", true);

        if (profilesError) {
            throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
        }

        console.log(`Found ${profiles?.length || 0} users with verified phone numbers and WhatsApp notifications enabled.`);

        // Filter users with valid phone numbers
        const validSubscribers = (profiles || [])
            .filter((profile: any) => {
                return profile &&
                    profile.phone_number &&
                    profile.phone_verified === true &&
                    profile.whatsapp_notifications_enabled === true;
            })
            .map((profile: any) => ({
                user_id: profile.id,
                profile: profile,
            }));

        if (validSubscribers.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No users with verified phone numbers and WhatsApp notifications enabled.",
                    totalUsers: 0,
                    validSubscribers: 0,
                    successCount: 0,
                    failureCount: 0,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Sending messages to ${validSubscribers.length} subscribers with valid phone numbers.`);

        const messageResults: any[] = [];
        let successCount = 0;
        let failureCount = 0;

        // Process messages in batches for better performance
        const totalBatches = Math.ceil(validSubscribers.length / BATCH_SIZE);
        console.log(`Processing ${validSubscribers.length} messages in ${totalBatches} batches of ${BATCH_SIZE}`);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const batchStart = batchIndex * BATCH_SIZE;
            const batchEnd = Math.min(batchStart + BATCH_SIZE, validSubscribers.length);
            const batch = validSubscribers.slice(batchStart, batchEnd);

            console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (messages ${batchStart + 1}-${batchEnd})`);

            // Send all messages in the batch in parallel
            const batchPromises = batch.map(async (subscriber: any) => {
                const profile = subscriber.profile;
                const phoneNumber = profile.phone_number;

                try {
                    const sendResult = await sendIndividualMessage(phoneNumber, message);

                    // Determine success
                    const httpSuccess = sendResult.httpStatus >= 200 && sendResult.httpStatus < 300;
                    const hasError = sendResult.error || sendResult.error_code || sendResult.error_message ||
                        (sendResult.httpStatus && (sendResult.httpStatus < 200 || sendResult.httpStatus >= 300));
                    const messageId = sendResult.messages?.[0]?.id || null;
                    const hasSuccessIndicator = sendResult.isSuccess || messageId !== null;

                    const finalSuccess = httpSuccess && !hasError && hasSuccessIndicator;

                    console.log(`Message to ${phoneNumber}: ${finalSuccess ? 'SUCCESS' : 'FAILED'}`, {
                        httpStatus: sendResult.httpStatus,
                        error: sendResult.error || sendResult.error_message,
                        messageId: messageId
                    });

                    // Log notification operation (non-blocking)
                    logNotificationOperation(
                        supabaseClient,
                        signalId,
                        subscriber.user_id,
                        phoneNumber,
                        finalSuccess,
                        sendResult.error || sendResult.error_message || null,
                        messageId,
                        message, // Include message content
                        sendResult
                    ).catch(err => console.error(`Failed to log notification for ${phoneNumber}:`, err));

                    return {
                        userId: subscriber.user_id,
                        phoneNumber: phoneNumber,
                        success: finalSuccess,
                        messageId: messageId,
                        error: sendResult.error || sendResult.error_message || null,
                        httpStatus: sendResult.httpStatus,
                    };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`Error sending to ${phoneNumber}:`, error);

                    // Log failed operation (non-blocking)
                    logNotificationOperation(
                        supabaseClient,
                        signalId,
                        subscriber.user_id,
                        phoneNumber,
                        false,
                        errorMessage,
                        null,
                        message, // Include message content
                        null
                    ).catch(err => console.error(`Failed to log notification for ${phoneNumber}:`, err));

                    return {
                        userId: subscriber.user_id,
                        phoneNumber: phoneNumber,
                        success: false,
                        error: errorMessage,
                    };
                }
            });

            // Wait for all messages in the batch to complete
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Process batch results
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const messageResult = result.value;
                    messageResults.push(messageResult);
                    if (messageResult.success) {
                        successCount++;
                    } else {
                        failureCount++;
                    }
                } else {
                    failureCount++;
                    console.error('Batch promise rejected:', result.reason);
                }
            });

            // Add delay between batches (except after the last batch)
            if (batchIndex < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        console.log(`Message sending summary:`, {
            totalSubscribers: validSubscribers.length,
            successful: successCount,
            failed: failureCount,
        });

        // Generate warning message if any messages failed
        let warningMessage: string | null = null;
        if (failureCount > 0) {
            warningMessage = `${failureCount} out of ${validSubscribers.length} messages failed to send.`;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Sent signal notification to ${successCount} out of ${validSubscribers.length} subscribers`,
                totalSubscribers: validSubscribers.length,
                successCount,
                failureCount,
                warning: warningMessage,
                results: messageResults,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in send-whatsapp-notification:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
