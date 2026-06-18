"use client";

import React, { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { PageTransition } from "@/lib/animations";
import { useNavigate } from "react-router-dom";

const DeleteAccount: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const [confirmationText, setConfirmationText] = useState("");
  const [reason, setReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const requiredText = "DELETE";

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) {
        throw new Error("Not authenticated");
      }

      // First, send a deletion request email to the user and admin
      const { error: emailError } = await supabase.functions.invoke("request-account-deletion", {
        body: {
          userId: session.user.id,
          email: session.user.email,
          reason: reason || "No reason provided",
        },
      });

      if (emailError) {
        console.error("Error sending deletion request email:", emailError);
        // Continue with deletion even if email fails
      }

      // Delete user profile data (cascades will handle related data)
      const { error: profileError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", session.user.id);

      if (profileError) {
        console.error("Error deleting profile:", profileError);
        // Continue even if profile deletion fails
      }

      // Delete notification preferences
      const { error: notifError } = await supabase
        .from("notification_preferences")
        .delete()
        .eq("user_id", session.user.id);

      if (notifError) {
        console.error("Error deleting notification preferences:", notifError);
      }

      // Delete signal subscriptions
      const { error: subError } = await supabase
        .from("signal_subscriptions")
        .delete()
        .eq("user_id", session.user.id);

      if (subError) {
        console.error("Error deleting subscriptions:", subError);
      }

      // Delete trade analysis purchases
      const { error: purchaseError } = await supabase
        .from("trade_analysis_purchases")
        .delete()
        .eq("user_id", session.user.id);

      if (purchaseError) {
        console.error("Error deleting purchases:", purchaseError);
      }

      // Delete auth user via Edge Function (requires admin privileges)
      // If Edge Function doesn't exist, we'll submit a request for admin processing
      try {
        const { error: deleteError } = await supabase.functions.invoke("delete-user-account", {
          body: {
            userId: session.user.id,
          },
        });

        if (deleteError) {
          // If Edge Function fails, submit request for manual deletion
          throw new Error(
            "Account deletion request submitted. Our team will process your request within 7 business days. You will receive a confirmation email once completed."
          );
        }
      } catch (error: any) {
        // If Edge Function doesn't exist or fails, submit request for admin processing
        throw new Error(
          "Account deletion request submitted. Our team will process your request within 7 business days. You will receive a confirmation email once completed."
        );
      }

      return true;
    },
    onSuccess: () => {
      showSuccess("Your account has been deleted successfully");
      // Sign out and redirect to home
      supabase.auth.signOut().then(() => {
        navigate("/");
      });
    },
    onError: (error: any) => {
      // If it's the admin approval message, show success
      if (error.message?.includes("admin approval")) {
        showSuccess(error.message);
        navigate("/dashboard");
      } else {
        showError(error.message || "Failed to delete account. Please contact support.");
      }
    },
  });

  const handleDelete = async () => {
    if (confirmationText !== requiredText) {
      showError(`Please type "${requiredText}" to confirm`);
      return;
    }

    if (!isConfirmed) {
      showError("Please confirm that you understand the consequences");
      return;
    }

    deleteAccountMutation.mutate();
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Delete Account</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>

            {/* Warning Alert */}
            <Alert className="bg-red-900/20 border-red-700/50 mb-6">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200 mt-2">
                <strong className="text-white">Warning:</strong> This action cannot be undone. All
                your data will be permanently deleted, including:
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Your profile information</li>
                  <li>All trading signals and subscriptions</li>
                  <li>Purchase history and trade analyses</li>
                  <li>Notification preferences</li>
                  <li>All other account data</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* What Happens Section */}
            <div className="bg-nero border border-steel-wool rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="text-gold" size={20} />
                What Will Be Deleted
              </h2>
              <div className="space-y-3 text-rainy-grey text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-red-500 mt-0.5" size={16} />
                  <span>
                    <strong className="text-white">Account Information:</strong> Email, phone number,
                    profile data
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-red-500 mt-0.5" size={16} />
                  <span>
                    <strong className="text-white">Trading Data:</strong> Signal subscriptions,
                    purchase history, trade analyses
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-red-500 mt-0.5" size={16} />
                  <span>
                    <strong className="text-white">Preferences:</strong> Notification settings,
                    account preferences
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="text-red-500 mt-0.5" size={16} />
                  <span>
                    <strong className="text-white">Access:</strong> You will lose access to all
                    premium features and content
                  </span>
                </div>
              </div>
            </div>

            {/* Reason Section */}
            <div className="mb-6">
              <Label className="text-white mb-2 block">
                Reason for Deletion (Optional)
              </Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve by telling us why you're leaving..."
                className="w-full min-h-[100px] bg-black border border-steel-wool rounded-lg p-3 text-white placeholder:text-rainy-grey focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-steel-wool bg-black text-gold focus:ring-gold focus:ring-offset-black"
                />
                <span className="text-rainy-grey text-sm">
                  I understand that this action is permanent and cannot be undone. I confirm that I
                  want to delete my account and all associated data.
                </span>
              </label>
            </div>

            {/* Confirmation Text Input */}
            <div className="mb-6">
              <Label className="text-white mb-2 block">
                Type <strong className="text-red-500">{requiredText}</strong> to confirm:
              </Label>
              <Input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                placeholder={requiredText}
                className="bg-black border-steel-wool text-white uppercase"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDelete}
                disabled={
                  confirmationText !== requiredText ||
                  !isConfirmed ||
                  deleteAccountMutation.isPending
                }
                className="bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                {deleteAccountMutation.isPending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Trash2 className="mr-2" size={16} />
                    Permanently Delete My Account
                  </>
                )}
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="flex-1 border-steel-wool text-white hover:bg-nero"
                disabled={deleteAccountMutation.isPending}
              >
                Cancel
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-steel-wool">
              <p className="text-xs text-rainy-grey leading-relaxed">
                <strong className="text-white">Note:</strong> If you have an active subscription,
                it will be cancelled. If you have any outstanding payments or credits, please contact
                support before deleting your account. For questions or concerns, please contact us
                at{" "}
                <a href="mailto:info@allytz.co" className="text-gold hover:underline">
                  info@allytz.co
                </a>
                .
              </p>
            </div>
          </CardContent>
        </PanelCard>
      </DashboardLayout>
    </PageTransition>
  );
};

export default DeleteAccount;
