"use client";

import React from "react";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import supabase from "@/integrations/supabase/client";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const DebugAdmin: React.FC = () => {
  const { session } = useSupabaseSession();
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDebugInfo = async () => {
      if (!session?.user?.id) {
        setDebugInfo({ error: "No session found" });
        setLoading(false);
        return;
      }

      try {
        // Get user ID
        const userId = session.user.id;

        // Try to query user_roles
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        // Try to query all user_roles (to see if table exists and RLS allows)
        const { data: allRoles, error: allRolesError } = await supabase
          .from("user_roles")
          .select("*")
          .limit(5);

        setDebugInfo({
          userId,
          userEmail: session.user.email,
          roleData,
          roleError: roleError ? {
            message: roleError.message,
            code: roleError.code,
            details: roleError.details,
            hint: roleError.hint,
          } : null,
          allRoles,
          allRolesError: allRolesError ? {
            message: allRolesError.message,
            code: allRolesError.code,
          } : null,
        });
      } catch (error: any) {
        setDebugInfo({
          error: error.message,
          stack: error.stack,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, [session]);

  if (loading) {
    return (
      <DashboardLayout>
        <PanelCard>
          <CardContent className="p-6">
            <div className="text-center text-rainy-grey">Loading debug info...</div>
          </CardContent>
        </PanelCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PanelCard>
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-white mb-4">Admin Debug Information</h1>
          <div className="space-y-4">
            <div className="bg-nero p-4 rounded-lg">
              <h2 className="text-white font-semibold mb-2">Your User Information</h2>
              <pre className="text-rainy-grey text-sm overflow-auto">
                {JSON.stringify(
                  {
                    userId: debugInfo?.userId,
                    userEmail: debugInfo?.userEmail,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="bg-nero p-4 rounded-lg">
              <h2 className="text-white font-semibold mb-2">Your Role Data</h2>
              <pre className="text-rainy-grey text-sm overflow-auto">
                {JSON.stringify(
                  {
                    roleData: debugInfo?.roleData,
                    roleError: debugInfo?.roleError,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="bg-nero p-4 rounded-lg">
              <h2 className="text-white font-semibold mb-2">All Roles (First 5)</h2>
              <pre className="text-rainy-grey text-sm overflow-auto">
                {JSON.stringify(
                  {
                    allRoles: debugInfo?.allRoles,
                    allRolesError: debugInfo?.allRolesError,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {debugInfo?.error && (
              <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg">
                <h2 className="text-red-500 font-semibold mb-2">Error</h2>
                <pre className="text-red-300 text-sm overflow-auto">
                  {JSON.stringify(debugInfo.error, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-gold/20 border border-gold p-4 rounded-lg">
              <h2 className="text-gold font-semibold mb-2">Instructions</h2>
              <ol className="text-rainy-grey text-sm space-y-2 list-decimal list-inside">
                <li>Check your <code className="bg-black px-1 rounded">userId</code> above</li>
                <li>Verify that this ID matches the user_id in your user_roles table</li>
                <li>If the IDs don't match, update the INSERT statement in the migration file</li>
                <li>If roleData is null, you need to insert a role for your user</li>
                <li>If you see an RLS error, the policies might need adjustment</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </PanelCard>
    </DashboardLayout>
  );
};

export default DebugAdmin;
