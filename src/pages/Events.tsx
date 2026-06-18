"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import EventCard, { EventItem } from "@/components/events/EventCard";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { showSuccess } from "@/utils/toast";
import { Search } from "lucide-react";
import FilterSaveBar from "@/components/forms/FilterSaveBar.tsx";
import { PageTransition, ScrollReveal, StaggerChildren } from "@/lib/animations";
import { useQuery } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  organizer: string;
  description: string;
  category: string;
  type: "Physical" | "Virtual" | "Hybrid";
  price_type: "Free" | "Paid";
  price: number;
  location: string | null;
  capacity: number;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  registration_count?: number;
}

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "Physical" | "Virtual" | "Hybrid">("all");
  const [pricingFilter, setPricingFilter] = React.useState<"all" | "Free" | "Paid">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "Networking" | "Workshop" | "Webinar" | "Conference" | "Seminar" | "Other">("all");

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("start_date", { ascending: true, nullsFirst: false });

      if (eventsError) throw eventsError;

      // Get registration counts for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .in("registration_status", ["pending", "confirmed"]);

          return {
            ...event,
            registration_count: count || 0,
          };
        })
      );

      return eventsWithCounts;
    },
  });

  const filtered = React.useMemo(() => {
    if (!events) return [];

    return events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.organizer.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" ? true : e.type === typeFilter;
      const matchesPricing = pricingFilter === "all" ? true : e.price_type === pricingFilter;
      const matchesCategory = categoryFilter === "all" ? true : e.category === categoryFilter;
      return matchesSearch && matchesType && matchesPricing && matchesCategory;
    });
  }, [events, search, typeFilter, pricingFilter, categoryFilter]);

  const convertToEventItem = (event: Event): EventItem => {
    return {
      id: event.id,
      title: event.title,
      organizer: event.organizer,
      description: event.description,
      category: event.category,
      type: event.type,
      priceType: event.price_type,
      sessions: 1, // Default, can be extended later
      location: event.location || "TBA",
      capacity: event.capacity,
      registered: event.registration_count || 0,
      coverUrl: event.cover_image_url || "/assets/placeholder.svg",
    };
  };

  const handleView = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}`);
  };

  const handleViewSessions = (eventId: string) => {
    showSuccess("Opening sessions…");
    // Replace with sessions route/modal if needed
  };

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header */}
        <ScrollReveal>
          <PanelCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-white text-xl md:text-2xl font-semibold">Events</h1>
                  <p className="text-slate-400 text-sm">
                    {isLoading ? "Loading..." : `${filtered.length} event${filtered.length !== 1 ? "s" : ""} available`}
                  </p>
                </div>
              </div>
            </CardContent>
          </PanelCard>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search events..."
                className="pl-9 bg-slate-900/60 border-slate-800 text-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Physical">Physical</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pricingFilter} onValueChange={(v) => setPricingFilter(v as typeof pricingFilter)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pricing</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Networking">Networking</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Seminar">Seminar</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ScrollReveal>

        <div className="mb-6">
          <FilterSaveBar
            page="events"
            values={{ search, typeFilter, pricingFilter, categoryFilter }}
          />
        </div>

        {/* Event list */}
        {isLoading ? (
          <PanelCard>
            <CardContent className="p-6 text-center text-slate-400">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Loading events...
            </CardContent>
          </PanelCard>
        ) : (
          <StaggerChildren className="grid grid-cols-1 gap-6">
            {filtered.map((ev) => (
              <EventCard key={ev.id} event={convertToEventItem(ev)} onView={handleView} onViewSessions={handleViewSessions} />
            ))}
            {filtered.length === 0 && (
              <PanelCard>
                <CardContent className="p-6 text-center text-slate-400">
                  {events && events.length === 0
                    ? "No events available at the moment. Check back soon!"
                    : "No events match your filters."}
                </CardContent>
              </PanelCard>
            )}
          </StaggerChildren>
        )}
      </DashboardLayout>
    </PageTransition>
  );
};

export default EventsPage;
