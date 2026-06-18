"use client";

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Handshake,
  SignalHigh,
  FileText,
  BookMarked,
  CalendarDays,
  MessageSquare,
  Bell,
  Settings,
  UserRound,
  LogOut,
  Shield,
  Menu,
} from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useAdmin } from "@/hooks/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

type NavItem = {
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  to: string;
  badge?: string;
  showInBottomNav?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, to: "/dashboard", showInBottomNav: true },
  { label: "Trade With AllyTZ", icon: Handshake, to: "/dashboard/trade-with-allytz" },
  { label: "Signals", icon: SignalHigh, to: "/dashboard/signals", showInBottomNav: true },
  { label: "Trade Analysis", shortLabel: "Analysis", icon: FileText, to: "/dashboard/trade-analysis", showInBottomNav: true },
  { label: "Resources", icon: BookMarked, to: "/dashboard/documents", badge: "NEW", showInBottomNav: true },
  { label: "Events", icon: CalendarDays, to: "/dashboard/events" },
  { label: "Collaborations", icon: Handshake, to: "/dashboard/collaborations" },
  { label: "Live Enquiry", shortLabel: "Support", icon: MessageSquare, to: "/dashboard/enquiry", showInBottomNav: true },
  { label: "Notifications", icon: Bell, to: "/dashboard/notifications" },
];

const Topbar: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const isMobile = useIsMobile();
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "Trader";

  return (
    <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 border-b border-steel-wool/40 bg-black/95 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="text-gold hover:bg-nero/50 min-w-[44px] min-h-[44px] -ml-2"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </Button>
        )}
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="AllyTZ Panel logo" className="h-7 sm:h-8" />
        </Link>
        <span className="text-rainy-grey text-xs sm:text-base hidden md:inline">
          {isMobile ? "Dashboard" : `Welcome, ${firstName}`}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <Button 
          variant="outline" 
          className="h-8 sm:h-9 border-steel-wool text-rainy-grey hover:bg-nero hover:text-gold hover:border-gold/40 transition-all duration-200 text-xs px-2 sm:px-3 hidden lg:inline-flex"
        >
          <span className="mr-1.5">Forecast</span>
          <Badge variant="secondary" className="bg-gold text-cursed-black text-[9px] px-1">NEW</Badge>
        </Button>
        
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px]"
          >
            <Settings size={18} />
          </Button>
        )}
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px]"
          >
            <Bell size={isMobile ? 20 : 18} />
          </Button>
          <span className="absolute top-1 right-1 bg-gold text-cursed-black text-[9px] sm:text-[10px] rounded-full px-1 sm:px-1.5 min-w-[16px] sm:min-w-[18px] text-center font-bold">
            2
          </span>
        </div>
        
        {!isMobile && (
          <>
            <Button 
              variant="ghost" 
              className="gap-2 text-rainy-grey hover:text-gold transition-colors duration-200 min-h-[44px] hidden md:inline-flex"
            >
              <UserRound className="opacity-80" size={18} />
              <span className="hidden lg:inline">{firstName}</span>
            </Button>
            <button
              className="p-2 rounded-lg hover:bg-nero/50 text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={async () => {
                await supabase.auth.signOut();
                showSuccess("Signed out");
              }}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const MobileBottomNav: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const location = useLocation();
  const bottomNavItems = navItems.filter(item => item.showInBottomNav);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-steel-wool/40 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isDashboardItem = item.label === "Dashboard";
          const targetTo = isDashboardItem && isAdmin ? "/admin" : item.to;

          const isActive =
            location.pathname === targetTo ||
            (targetTo !== "/dashboard" && location.pathname.startsWith(targetTo));

          return (
            <Link
              key={item.to}
              to={targetTo}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-gold bg-nero/50"
                  : "text-rainy-grey hover:text-gold hover:bg-nero/30"
              }`}
            >
              <Icon
                size={20}
                className={`mb-1 ${
                  isActive ? "scale-110" : ""
                } transition-transform duration-200`}
              />
              <span className="text-[10px] font-semibold">
                {isDashboardItem && isAdmin
                  ? "Admin"
                  : item.shortLabel || item.label}
              </span>
              {item.badge && isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <SidebarProvider 
      className="min-h-screen bg-black text-foreground"
      open={isMobile ? isSidebarOpen : undefined}
      onOpenChange={isMobile ? setIsSidebarOpen : undefined}
    >
      <Sidebar 
        side="left" 
        variant="sidebar" 
        className="bg-black border-r border-steel-wool/40 text-rainy-grey"
        collapsible={isMobile ? "offcanvas" : "icon"}
      >
        <SidebarHeader className="pt-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-rainy-grey mb-4 text-xs font-semibold">
              Navigation
            </SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isDashboardItem = item.label === "Dashboard";
                  const targetTo = isDashboardItem && isAdmin ? "/admin" : item.to;

                  const isActive =
                    location.pathname === targetTo ||
                    (targetTo !== "/dashboard" &&
                      location.pathname.startsWith(targetTo));

                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link
                        to={targetTo}
                        onClick={() => isMobile && setIsSidebarOpen(false)}
                      >
                        <SidebarMenuButton
                          isActive={isActive}
                          className={`text-rainy-grey hover:text-gold transition-all duration-200 min-h-[44px] ${
                            isActive
                              ? "text-gold bg-nero/80 border-l-2 border-gold"
                              : ""
                          }`}
                        >
                          {isDashboardItem && isAdmin ? (
                            <Shield size={20} />
                          ) : (
                            <Icon size={20} />
                          )}
                          <span className="font-medium">
                            {isDashboardItem && isAdmin
                              ? "Admin Dashboard"
                              : item.label}
                          </span>
                        </SidebarMenuButton>
                      </Link>
                      {item.badge && (
                        <SidebarMenuBadge className="bg-gold text-cursed-black text-[10px] font-bold">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarHeader>
      </Sidebar>

      <SidebarInset className="bg-black">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className={`px-3 sm:px-6 py-4 sm:py-6 md:py-8 ${isMobile ? "pb-20" : ""}`}>
          {children}
        </div>
        {isMobile && <MobileBottomNav isAdmin={isAdmin} />}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;