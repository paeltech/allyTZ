import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, Filter, Inbox } from "lucide-react";
import { PageTransition, StaggerChildren } from "@/lib/animations";
import {
  useNotifications,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";
import NotificationItem from "@/components/notifications/NotificationItem";
import type { NotificationType } from "@/utils/notifications";

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | NotificationType | "unread">("all");
  const [limit, setLimit] = useState(20);

  // Determine query options based on active tab
  const queryOptions = {
    limit,
    ...(activeTab === "unread" ? { unreadOnly: true } : {}),
    ...(activeTab !== "all" && activeTab !== "unread" ? { type: activeTab } : {}),
  };

  const { data: notifications, isLoading, refetch } = useNotifications(queryOptions);
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header */}
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-nero flex items-center justify-center">
                  <Bell className="text-gold" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">Notifications</h1>
                  <p className="text-rainy-grey text-sm mt-1">
                    Stay updated with signals, events, and announcements
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="bg-nero border border-steel-wool text-white hover:bg-gold hover:text-cursed-black hover:border-gold"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read ({unreadCount})
                </Button>
              )}
            </div>
          </CardContent>
        </PanelCard>

        {/* Filters */}
        <PanelCard className="mb-6">
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
              <TabsList className="bg-nero border border-steel-wool w-full justify-start overflow-x-auto">
                <TabsTrigger value="all" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="signal" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  📊 Signals
                </TabsTrigger>
                <TabsTrigger value="event" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  📅 Events
                </TabsTrigger>
                <TabsTrigger value="announcement" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  📢 Announcements
                </TabsTrigger>
                <TabsTrigger value="system" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  ⚙️ System
                </TabsTrigger>
                <TabsTrigger value="tip" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                  💡 Tips
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </PanelCard>

        {/* Notifications List */}
        <PanelCard>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-rainy-grey">Loading notifications...</div>
              </div>
            ) : notifications && notifications.length > 0 ? (
              <>
                <StaggerChildren className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))}
                  </AnimatePresence>
                </StaggerChildren>

                {/* Load More Button */}
                {notifications.length >= limit && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      className="border-steel-wool text-rainy-grey hover:bg-nero hover:text-white"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-rainy-grey">
                <Inbox className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm mt-2 text-center max-w-md">
                  {activeTab === "unread"
                    ? "You're all caught up! No unread notifications."
                    : activeTab === "all"
                    ? "You'll receive notifications about signals, events, announcements, and more."
                    : `No ${activeTab} notifications yet.`}
                </p>
              </div>
            )}
          </CardContent>
        </PanelCard>
      </DashboardLayout>
    </PageTransition>
  );
};

export default Notifications;
