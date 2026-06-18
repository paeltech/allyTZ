"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import DashboardTile from "../components/dashboard/DashboardTile.tsx";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import supabase from "@/integrations/supabase/client";
import {
  FileText,
  MessageSquare,
  Handshake,
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  SignalHigh,
  Lightbulb,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/lib/animations";

interface DashboardStats {
  enquiries: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  collaborations: {
    total: number;
    pending: number;
    reviewing: number;
    approved: number;
  };
  tradeAnalyses: {
    total: number;
    recent: number;
  };
  purchases: {
    total: number;
    completed: number;
    pending: number;
  };
  signalSubscriptions: {
    total: number;
    active: number;
    monthly: number;
    perPip: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "Admin";

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Fetch enquiries stats
      const { data: enquiriesData } = await supabase
        .from("enquiries")
        .select("status");

      const enquiries = {
        total: enquiriesData?.length || 0,
        pending: enquiriesData?.filter((e) => e.status === "pending").length || 0,
        inProgress: enquiriesData?.filter((e) => e.status === "in_progress").length || 0,
        resolved: enquiriesData?.filter((e) => e.status === "resolved").length || 0,
      };

      // Fetch collaborations stats
      const { data: collaborationsData } = await supabase
        .from("collaborations")
        .select("status");

      const collaborations = {
        total: collaborationsData?.length || 0,
        pending: collaborationsData?.filter((c) => c.status === "pending").length || 0,
        reviewing: collaborationsData?.filter((c) => c.status === "reviewing").length || 0,
        approved: collaborationsData?.filter((c) => c.status === "approved").length || 0,
      };

      // Fetch trade analyses stats
      const { data: tradeAnalysesData } = await supabase
        .from("trade_analyses")
        .select("created_at");

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const tradeAnalyses = {
        total: tradeAnalysesData?.length || 0,
        recent: tradeAnalysesData?.filter(
          (ta) => new Date(ta.created_at) >= oneWeekAgo
        ).length || 0,
      };

      // Fetch purchases stats
      const { data: purchasesData } = await supabase
        .from("trade_analysis_purchases")
        .select("payment_status");

      const purchases = {
        total: purchasesData?.length || 0,
        completed: purchasesData?.filter((p) => p.payment_status === "completed").length || 0,
        pending: purchasesData?.filter((p) => p.payment_status === "pending").length || 0,
      };

      // Fetch signal subscriptions stats
      const { data: subscriptionsData } = await supabase
        .from("signal_subscriptions")
        .select("status, subscription_type");

      const signalSubscriptions = {
        total: subscriptionsData?.length || 0,
        active: subscriptionsData?.filter((s) => s.status === "active").length || 0,
        monthly: subscriptionsData?.filter((s) => s.subscription_type === "monthly" && s.status === "active").length || 0,
        perPip: subscriptionsData?.filter((s) => s.subscription_type === "per_pip" && s.status === "active").length || 0,
      };

      return {
        enquiries,
        collaborations,
        tradeAnalyses,
        purchases,
        signalSubscriptions,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              Admin Dashboard 👨‍💼
            </h2>
            <p className="text-rainy-grey mt-3 sm:mt-4 leading-relaxed text-sm sm:text-base">
              Welcome back, {firstName}. Manage all platform activities from here.
            </p>
          </CardContent>
        </PanelCard>

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <PanelCard key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-nero rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-nero rounded w-1/2"></div>
                  </div>
                </CardContent>
              </PanelCard>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rainy-grey text-sm mb-1">Total Enquiries</p>
                    <p className="text-2xl font-semibold text-white">{stats?.enquiries.total || 0}</p>
                    <p className="text-xs text-rainy-grey mt-1">
                      {stats?.enquiries.pending || 0} pending
                    </p>
                  </div>
                  <MessageSquare className="text-gold" size={32} />
                </div>
              </CardContent>
            </PanelCard>

            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rainy-grey text-sm mb-1">Collaborations</p>
                    <p className="text-2xl font-semibold text-white">
                      {stats?.collaborations.total || 0}
                    </p>
                    <p className="text-xs text-rainy-grey mt-1">
                      {stats?.collaborations.pending || 0} pending
                    </p>
                  </div>
                  <Handshake className="text-gold" size={32} />
                </div>
              </CardContent>
            </PanelCard>

            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rainy-grey text-sm mb-1">Trade Analyses</p>
                    <p className="text-2xl font-semibold text-white">
                      {stats?.tradeAnalyses.total || 0}
                    </p>
                    <p className="text-xs text-rainy-grey mt-1">
                      {stats?.tradeAnalyses.recent || 0} this week
                    </p>
                  </div>
                  <FileText className="text-gold" size={32} />
                </div>
              </CardContent>
            </PanelCard>

            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rainy-grey text-sm mb-1">Purchases</p>
                    <p className="text-2xl font-semibold text-white">{stats?.purchases.total || 0}</p>
                    <p className="text-xs text-rainy-grey mt-1">
                      {stats?.purchases.completed || 0} completed
                    </p>
                  </div>
                  <ShoppingCart className="text-gold" size={32} />
                </div>
              </CardContent>
            </PanelCard>
          </div>
        )}

        {/* Management Sections */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardTile
            to="/admin/enquiries"
            title="Manage Enquiries"
            description="View and respond to user enquiries"
            Icon={MessageSquare}
            iconBg="bg-blue-700"
          />
          <DashboardTile
            to="/admin/collaborations"
            title="Manage Collaborations"
            description="Review partnership requests"
            Icon={Handshake}
            iconBg="bg-purple-700"
          />
          <DashboardTile
            to="/admin/trade-analyses"
            title="Trade Analyses"
            description="Create and manage trading analyses"
            Icon={FileText}
            iconBg="bg-gold"
          />
          <DashboardTile
            to="/admin/purchases"
            title="Purchase Management"
            description="View and manage purchases"
            Icon={ShoppingCart}
            iconBg="bg-green-700"
          />
          <DashboardTile
            to="/admin/users"
            title="User Management"
            description="Manage user roles and permissions"
            Icon={Users}
            iconBg="bg-orange-700"
          />
          <DashboardTile
            to="/admin/events"
            title="Event Management"
            description="Create and manage platform events"
            Icon={Calendar}
            iconBg="bg-indigo-700"
          />
          <DashboardTile
            to="/admin/signals"
            title="Signal Management"
            description="Configure pricing and subscriptions"
            Icon={SignalHigh}
            iconBg="bg-blue-600"
          />
          <DashboardTile
            to="/admin/tips"
            title="Tips & Quotes"
            description="Daily tips for mobile and push rotation"
            Icon={Lightbulb}
            iconBg="bg-amber-700"
          />
          <DashboardTile
            to="/admin/documents"
            title="Documents"
            description="Upload and manage view-only resources"
            Icon={FileText}
            iconBg="bg-slate-700"
          />
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminDashboard;
