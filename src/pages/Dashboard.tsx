"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import DashboardTile from "../components/dashboard/DashboardTile.tsx";
import {
  Handshake,
  SignalHigh,
  FileText,
  FolderOpen,
  Megaphone,
  CalendarDays,
  CircleHelp,
  Bell,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

const Dashboard: React.FC = () => {
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "Trader";

  return (
    <DashboardLayout>
      <PanelCard className="mb-4 sm:mb-6 md:mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
        <CardContent className="p-4 sm:p-6 md:p-8 relative">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
            Welcome back, {firstName} 👋
          </h2>
          <p className="text-rainy-grey leading-relaxed text-xs sm:text-sm md:text-base">
            Your trading hub for signals, analysis, documents, and support.
          </p>
        </CardContent>
      </PanelCard>

      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-rainy-grey mb-3 sm:mb-4 uppercase tracking-wider px-1">
          Trading Hub
        </h3>
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-2 lg:grid-cols-4">
          <DashboardTile
            to="/dashboard/trade-with-allytz"
            title="Trade With AllyTZ"
            description="Broker partnership"
            Icon={Handshake}
            iconBg="bg-gold"
          />
          <DashboardTile
            to="/dashboard/signals"
            title="Signals"
            description="Premium trading signals"
            Icon={SignalHigh}
            iconBg="bg-gold"
          />
          <DashboardTile
            to="/dashboard/trade-analysis"
            title="Trade Analysis"
            description="Daily pair analysis"
            Icon={FileText}
            iconBg="bg-gold"
          />
          <DashboardTile
            to="/dashboard/documents"
            title="Documents"
            description="Guides and resources"
            Icon={FolderOpen}
            iconBg="bg-slate-600"
          />
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-rainy-grey mb-3 sm:mb-4 uppercase tracking-wider px-1">
          Community
        </h3>
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-2 lg:grid-cols-3">
          <DashboardTile
            to="/dashboard/events"
            title="Events"
            description="Webinars and workshops"
            Icon={CalendarDays}
            iconBg="bg-indigo-600"
          />
          <DashboardTile
            to="/dashboard/collaborations"
            title="Collaborations"
            description="Partner with us"
            Icon={Megaphone}
            iconBg="bg-purple-600"
          />
          <DashboardTile
            to="/dashboard/enquiry"
            title="Enquiry"
            description="Get in touch"
            Icon={CircleHelp}
            iconBg="bg-rose-600"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm sm:text-base font-bold text-rainy-grey mb-3 sm:mb-4 uppercase tracking-wider px-1">
          Insights
        </h3>
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardTile
            to="/dashboard/notifications"
            title="Notifications"
            description="Alerts and updates"
            Icon={Bell}
            iconBg="bg-amber-700"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
