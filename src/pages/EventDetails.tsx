"use client";

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition, ScrollReveal } from "@/lib/animations";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

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
  registration_start_date: string | null;
  registration_end_date: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  registration_count?: number;
  user_registration?: {
    id: string;
    registration_status: string;
    payment_status: string | null;
  } | null;
}

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("status", "published")
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Event not found");

      // Get registration count
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("registration_status", ["pending", "confirmed"]);

      // Get user's registration if logged in
      let userRegistration = null;
      if (session?.user?.id) {
        const { data: regData } = await supabase
          .from("event_registrations")
          .select("id, registration_status, payment_status")
          .eq("event_id", eventId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        userRegistration = regData;
      }

      return {
        ...eventData,
        registration_count: count || 0,
        user_registration: userRegistration,
      };
    },
    enabled: !!eventId,
  });

  const registrationMutation = useMutation({
    mutationFn: async () => {
      if (!event || !session?.user?.id) throw new Error("You must be logged in to register");

      // Check if registration is open
      const now = new Date();
      if (event.registration_start_date && new Date(event.registration_start_date) > now) {
        throw new Error("Registration has not started yet");
      }
      if (event.registration_end_date && new Date(event.registration_end_date) < now) {
        throw new Error("Registration has closed");
      }

      // Check if event is full
      if (event.registration_count && event.registration_count >= event.capacity) {
        throw new Error("Event is fully booked");
      }

      // Check if user is already registered
      if (event.user_registration) {
        throw new Error("You are already registered for this event");
      }

      // Create registration
      const { error } = await supabase.from("event_registrations").insert({
        event_id: event.id,
        user_id: session.user.id,
        registration_status: "pending",
        payment_status: event.price_type === "Paid" ? "pending" : null,
        amount_paid: event.price_type === "Paid" ? event.price : 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Successfully registered for this event!");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to register for event");
    },
  });

  const handleRegister = async () => {
    if (!session) {
      showError("Please log in to register for events");
      navigate("/login");
      return;
    }

    setIsRegistering(true);
    try {
      await registrationMutation.mutateAsync();
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <DashboardLayout>
          <PanelCard>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
              <p className="text-rainy-grey">Loading event details...</p>
            </CardContent>
          </PanelCard>
        </DashboardLayout>
      </PageTransition>
    );
  }

  if (!event) {
    return (
      <PageTransition>
        <DashboardLayout>
          <PanelCard>
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Event Not Found</h2>
              <p className="text-rainy-grey mb-4">The event you're looking for doesn't exist or is no longer available.</p>
              <Button
                onClick={() => navigate("/dashboard/events")}
                className="bg-gold text-cursed-black hover:bg-gold-dark"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </CardContent>
          </PanelCard>
        </DashboardLayout>
      </PageTransition>
    );
  }

  const isFull = (event.registration_count || 0) >= event.capacity;
  const progressValue = Math.min(100, Math.round(((event.registration_count || 0) / event.capacity) * 100));
  const isRegistered = !!event.user_registration;
  const canRegister = !isFull && !isRegistered && event.status === "published";

  const now = new Date();
  const registrationOpen = 
    (!event.registration_start_date || new Date(event.registration_start_date) <= now) &&
    (!event.registration_end_date || new Date(event.registration_end_date) >= now);

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Back Button */}
        <ScrollReveal>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/events")}
            className="mb-4 text-rainy-grey hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </ScrollReveal>

        {/* Cover Image */}
        {event.cover_image_url && (
          <ScrollReveal>
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          </ScrollReveal>
        )}

        {/* Event Header */}
        <ScrollReveal>
          <PanelCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {event.is_featured && (
                      <Badge className="bg-gold text-cursed-black">Featured</Badge>
                    )}
                    <Badge variant="secondary" className="bg-nero text-white">
                      {event.category}
                    </Badge>
                    <Badge className="bg-gold text-cursed-black">{event.type}</Badge>
                    <Badge className="bg-gold text-cursed-black">{event.price_type}</Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{event.title}</h1>
                  <p className="text-rainy-grey">By {event.organizer}</p>
                </div>
              </div>
            </CardContent>
          </PanelCard>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <ScrollReveal>
              <PanelCard>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">About This Event</h2>
                  <p className="text-rainy-grey whitespace-pre-line leading-relaxed">
                    {event.description}
                  </p>
                </CardContent>
              </PanelCard>
            </ScrollReveal>

            {/* Event Details */}
            <ScrollReveal>
              <PanelCard>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>
                  <div className="space-y-4">
                    {event.start_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Start Date</p>
                          <p className="text-rainy-grey">
                            {format(new Date(event.start_date), "EEEE, MMMM dd, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.end_date && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">End Date</p>
                          <p className="text-rainy-grey">
                            {format(new Date(event.end_date), "EEEE, MMMM dd, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Location</p>
                          <p className="text-rainy-grey">{event.location}</p>
                        </div>
                      </div>
                    )}
                    {event.price_type === "Paid" && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Price</p>
                          <p className="text-rainy-grey">${event.price.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </PanelCard>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <ScrollReveal>
              <PanelCard>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">Registration</h3>
                        {isRegistered && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Registered
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-rainy-grey text-sm mb-4">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.registration_count || 0} / {event.capacity} registered
                        </span>
                      </div>
                      <Progress
                        value={progressValue}
                        className={cn("h-2 rounded-md", isFull ? "[&>div]:bg-red-500" : "[&>div]:bg-gold")}
                      />
                      <p className={cn("text-xs mt-2", isFull ? "text-red-400" : "text-rainy-grey")}>
                        {isFull ? "Fully booked" : `${event.capacity - (event.registration_count || 0)} spots remaining`}
                      </p>
                    </div>

                    {!registrationOpen && (
                      <div className="p-3 bg-nero rounded-lg border border-steel-wool">
                        <p className="text-sm text-rainy-grey">
                          {event.registration_start_date && new Date(event.registration_start_date) > now
                            ? `Registration opens ${format(new Date(event.registration_start_date), "MMM dd, yyyy")}`
                            : "Registration has closed"}
                        </p>
                      </div>
                    )}

                    {canRegister && registrationOpen && (
                      <Button
                        onClick={handleRegister}
                        disabled={isRegistering || registrationMutation.isPending}
                        className="w-full bg-gold text-cursed-black hover:bg-gold-dark font-semibold"
                      >
                        {isRegistering || registrationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Register for Event"
                        )}
                      </Button>
                    )}

                    {isRegistered && (
                      <div className="p-3 bg-green-900/20 rounded-lg border border-green-700/30">
                        <p className="text-sm text-green-400">
                          You're registered! We'll send you updates about this event.
                        </p>
                        {event.user_registration?.payment_status === "pending" && event.price_type === "Paid" && (
                          <p className="text-xs text-yellow-400 mt-2">
                            Payment pending. Complete payment to confirm your registration.
                          </p>
                        )}
                      </div>
                    )}

                    {isFull && !isRegistered && (
                      <div className="p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                        <p className="text-sm text-red-400">This event is fully booked.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </PanelCard>
            </ScrollReveal>

            {/* Quick Info */}
            <ScrollReveal>
              <PanelCard>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-rainy-grey">Category</span>
                      <span className="text-white">{event.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rainy-grey">Type</span>
                      <span className="text-white">{event.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rainy-grey">Pricing</span>
                      <span className="text-white">
                        {event.price_type === "Free" ? "Free" : `$${event.price.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rainy-grey">Capacity</span>
                      <span className="text-white">{event.capacity} attendees</span>
                    </div>
                  </div>
                </CardContent>
              </PanelCard>
            </ScrollReveal>
          </div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default EventDetails;
