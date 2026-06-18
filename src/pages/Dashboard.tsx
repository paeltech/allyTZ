"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import DashboardTile from "../components/dashboard/DashboardTile.tsx";
import {
  Handshake,
  SignalHigh,
  ActivitySquare,
  Calculator,
  CalendarDays,
  Megaphone,
  BarChart3,
  GraduationCap,
  UserSquare2,
  School,
  CalendarClock,
  CircleHelp,
  FileText,
  FolderOpen,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

const Dashboard: React.FC = () => {
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "Trader";

  return (
    <DashboardLayout>
      {/* Enhanced Welcome Section for Mobile */}
      <PanelCard className="mb-4 sm:mb-6 md:mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
        <CardContent className="p-4 sm:p-6 md:p-8 relative">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
            Welcome back, {firstName} 👋
          </h2>
          <p className="text-rainy-grey leading-relaxed text-xs sm:text-sm md:text-base">
            Your complete trading hub. Tap any card below to get started.
          </p>
        </CardContent>
      </PanelCard>

      {/* Featured/Priority Section - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-rainy-grey mb-3 sm:mb-4 uppercase tracking-wider px-1">
          Trading Essentials
        </h3>
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardTile
            to="/dashboard/trade-with-allytz"
            title="Trade With AllyTZ"
            description="Broker partnership program"
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
            to="/dashboard/heatmap"
            title="Currency Heatmap"
            description="Live currency strength"
            Icon={ActivitySquare}
            iconBg="bg-gold"
          />
        </div>
      </div>

      {/* Tools Section */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-rainy-grey mb-3 sm:mb-4 uppercase tracking-wider px-1">
          Trading Tools
        </h3>
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardTile
            to="/dashboard/lot-size"
            title="Lot Size Calculator"
            description="Position sizing tool"
            Icon={Calculator}
            iconBg="bg-gold"
          />
          <DashboardTile
            to="/dashboard/economic-calendar"
            title="Economic Calendar"
            description="Forex news events"
            Icon={CalendarDays}
            iconBg="bg-gold"
          />
          <DashboardTile
            to="/dashboard/sentiment"
            title="Sentiment Voting"
            description="Community sentiment"
            Icon={BarChart3}
            iconBg="bg-teal-600"
          />
          <DashboardTile
            to="/dashboard/affiliates"
            title="Affiliate Programs"
            description="Earn commissions"
            Icon={Megaphone}
            iconBg="bg-indigo-600"
          />
        </div>
      </div>

      {/* Education & Support Section */}
      <div>
        <h3 className="text-sm sm:text-base font-bold text-rainy-grey mb-3 sm:mb-4 uppercase tracking-wider px-1">
          Education & Support
        </h3>
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardTile
            to="/dashboard/course"
            title="Course"
            description="The GOAT Strategy"
            Icon={GraduationCap}
            iconBg="bg-green-600"
          />
          <DashboardTile
            to="/dashboard/one-on-one"
            title="One on One"
            description="Personal coaching"
            Icon={UserSquare2}
            iconBg="bg-orange-600"
          />
          <DashboardTile
            to="/dashboard/academy"
            title="Academy"
            description="In-person training"
            Icon={School}
            iconBg="bg-emerald-600"
          />
          <DashboardTile
            to="/dashboard/documents"
            title="Documents"
            description="Guides and resources"
            Icon={FolderOpen}
            iconBg="bg-slate-600"
          />
          <DashboardTile
            to="/dashboard/booking"
            title="Booking"
            description="Schedule sessions"
            Icon={CalendarClock}
            iconBg="bg-pink-600"
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
    </DashboardLayout>
  );
};

export default Dashboard;