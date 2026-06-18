import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Phone, Mail, MessageSquare, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { PageTransition } from "@/lib/animations";

interface UserProfile {
    id: string;
    phone_number: string | null;
    phone_verified: boolean;
    whatsapp_notifications_enabled: boolean;
    email_notifications_enabled: boolean;
    telegram_notifications_enabled: boolean;
}

const NotificationPreferences: React.FC = () => {
    const { session } = useSupabaseSession();
    const queryClient = useQueryClient();
    const [phoneNumber, setPhoneNumber] = useState("");

    // Fetch user profile
    const { data: profile, isLoading } = useQuery<UserProfile>({
        queryKey: ["user-profile", session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (error) throw error;
            if (data?.phone_number) {
                setPhoneNumber(data.phone_number);
            }
            return data;
        },
        enabled: !!session?.user?.id,
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            if (!session?.user?.id) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("user_profiles")
                .update(updates)
                .eq("id", session.user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            showSuccess("Notification preferences updated");
        },
        onError: (error: any) => {
            showError(error.message || "Failed to update preferences");
        },
    });

    const handleToggle = (field: keyof UserProfile, value: boolean) => {
        updateProfileMutation.mutate({ [field]: value });
    };

    const handlePhoneUpdate = async () => {
        if (!phoneNumber) {
            showError("Please enter a phone number");
            return;
        }

        updateProfileMutation.mutate({
            phone_number: phoneNumber,
            phone_verified: false, // Reset verification when phone changes
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-rainy-grey">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <PageTransition>
            <DashboardLayout>
                <PanelCard className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="text-gold" size={24} />
                            <div>
                                <h1 className="text-2xl font-semibold text-white">Notification Preferences</h1>
                                <p className="text-rainy-grey text-sm mt-1">
                                    Manage how you receive trading signal notifications
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Phone Number Section */}
                            <div className="bg-nero border border-steel-wool rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Phone className="text-gold" size={20} />
                                    <h2 className="text-lg font-semibold text-white">WhatsApp Number</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-white mb-2">Phone Number</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="+255123456789"
                                                className="bg-black border-steel-wool text-white flex-1"
                                            />
                                            <Button
                                                onClick={handlePhoneUpdate}
                                                disabled={updateProfileMutation.isPending}
                                                className="bg-gold text-cursed-black hover:bg-gold-dark"
                                            >
                                                Update
                                            </Button>
                                        </div>
                                        <p className="text-xs text-rainy-grey mt-2">
                                            Include country code (e.g., +255 for Tanzania)
                                        </p>
                                    </div>

                                    {profile?.phone_verified ? (
                                        <div className="flex items-center gap-2 text-green-500 text-sm">
                                            <Shield size={16} />
                                            <span>Phone number verified</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-yellow-500 text-sm">
                                            <Shield size={16} />
                                            <span>Phone number not verified - verification coming soon</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notification Channels */}
                            <div className="bg-nero border border-steel-wool rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Notification Channels</h2>

                                <div className="space-y-4">
                                    {/* WhatsApp */}
                                    <div className="flex items-center justify-between p-4 bg-black border border-steel-wool rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="text-green-500" size={20} />
                                            <div>
                                                <div className="text-white font-medium">WhatsApp Notifications</div>
                                                <div className="text-sm text-rainy-grey">
                                                    Receive instant signal alerts on WhatsApp
                                                </div>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={profile?.whatsapp_notifications_enabled ?? true}
                                            onCheckedChange={(checked) =>
                                                handleToggle("whatsapp_notifications_enabled", checked)
                                            }
                                            disabled={!profile?.phone_number || updateProfileMutation.isPending}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center justify-between p-4 bg-black border border-steel-wool rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-blue-500" size={20} />
                                            <div>
                                                <div className="text-white font-medium">Email Notifications</div>
                                                <div className="text-sm text-rainy-grey">
                                                    Receive signal summaries via email
                                                </div>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={profile?.email_notifications_enabled ?? true}
                                            onCheckedChange={(checked) =>
                                                handleToggle("email_notifications_enabled", checked)
                                            }
                                            disabled={updateProfileMutation.isPending}
                                        />
                                    </div>

                                    {/* Telegram */}
                                    <div className="flex items-center justify-between p-4 bg-black border border-steel-wool rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="text-blue-400" size={20} />
                                            <div>
                                                <div className="text-white font-medium">Telegram Notifications</div>
                                                <div className="text-sm text-rainy-grey">
                                                    Receive signals on Telegram (coming soon)
                                                </div>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={profile?.telegram_notifications_enabled ?? false}
                                            onCheckedChange={(checked) =>
                                                handleToggle("telegram_notifications_enabled", checked)
                                            }
                                            disabled={true} // Disabled until Telegram integration is ready
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                <p className="text-sm text-blue-200">
                                    <strong>Note:</strong> You must have an active signal subscription to receive
                                    notifications. WhatsApp notifications require a verified phone number.
                                </p>
                            </div>

                            {/* Account Deletion Section */}
                            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="text-red-500" size={20} />
                                    <h2 className="text-lg font-semibold text-white">Account Management</h2>
                                </div>
                                <p className="text-sm text-red-200 mb-4">
                                    You have the right to request deletion of your account and all associated data
                                    in accordance with our Privacy Policy.
                                </p>
                                <Link
                                    to="/dashboard/delete-account"
                                    className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                                >
                                    <span>Request Account Deletion</span>
                                    <span>→</span>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </PanelCard>
            </DashboardLayout>
        </PageTransition>
    );
};

export default NotificationPreferences;
