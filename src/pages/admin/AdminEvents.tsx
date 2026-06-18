"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Plus, Edit, Trash2, Search, Filter, Image as ImageIcon, Upload, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { PageTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { createNotificationForUsers, formatEventNotification } from "@/utils/notifications";

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
  status: "draft" | "published" | "cancelled" | "completed";
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  registration_count?: number;
}

const eventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  organizer: z.string().min(2, "Organizer name is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum(["Networking", "Workshop", "Webinar", "Conference", "Seminar", "Other"]),
  type: z.enum(["Physical", "Virtual", "Hybrid"]),
  price_type: z.enum(["Free", "Paid"]),
  price: z.number().min(0, "Price must be positive"),
  location: z.string().optional().nullable(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  cover_image_url: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  registration_start_date: z.string().optional().nullable(),
  registration_end_date: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  is_featured: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventSchema>;

const CATEGORIES = ["Networking", "Workshop", "Webinar", "Conference", "Seminar", "Other"];
const TYPES = ["Physical", "Virtual", "Hybrid"];
const STATUSES = ["draft", "published", "cancelled", "completed"];

const AdminEvents: React.FC = () => {
  const { session } = useSupabaseSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      organizer: "",
      description: "",
      category: "Networking",
      type: "Physical",
      price_type: "Free",
      price: 0,
      location: "",
      capacity: 100,
      cover_image_url: null,
      start_date: null,
      end_date: null,
      registration_start_date: null,
      registration_end_date: null,
      status: "draft",
      is_featured: false,
    },
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["admin-events", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: eventsData, error } = await query;

      if (error) throw error;

      // Get registration counts
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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `event-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("event-covers")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showError(error.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("cover_image_url", null);
  };

  const createMutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      let coverImageUrl = values.cover_image_url;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload cover image');
        }
      }

      const { data, error } = await supabase.from("events").insert({
        title: values.title,
        organizer: values.organizer,
        description: values.description,
        category: values.category,
        type: values.type,
        price_type: values.price_type,
        price: values.price_type === "Free" ? 0 : values.price,
        location: values.location || null,
        capacity: values.capacity,
        cover_image_url: coverImageUrl,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        registration_start_date: values.registration_start_date || null,
        registration_end_date: values.registration_end_date || null,
        status: values.status,
        is_featured: values.is_featured,
        created_by: session?.user?.id || null,
      })
      .select()
      .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (event) => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Event created successfully");

      // Create in-app notifications for all users
      try {
        console.log('Creating in-app notifications for event:', event.id);

        // Fetch all user IDs
        const { data: users, error: usersError } = await supabase
          .from('user_profiles')
          .select('id');

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else if (users && users.length > 0) {
          const userIds = users.map(user => user.id);
          const { title, message } = formatEventNotification({
            title: event.title,
            event_type: event.type,
            start_date: event.start_date,
          });

          await createNotificationForUsers(userIds, {
            notification_type: 'event',
            title,
            message,
            action_url: `/dashboard/events/${event.id}`,
            metadata: {
              event_id: event.id,
              event_type: event.type,
              category: event.category,
            },
          });

          console.log(`In-app notifications created for ${userIds.length} users`);
        }
      } catch (error) {
        console.error('Error creating in-app notifications:', error);
        // Don't show error to user - notifications are not critical
      }

      setIsDialogOpen(false);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      showError(error.message || "Failed to create event");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EventFormValues }) => {
      let coverImageUrl = values.cover_image_url;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload cover image');
        }
      }

      const { error } = await supabase
        .from("events")
        .update({
          title: values.title,
          organizer: values.organizer,
          description: values.description,
          category: values.category,
          type: values.type,
          price_type: values.price_type,
          price: values.price_type === "Free" ? 0 : values.price,
          location: values.location || null,
          capacity: values.capacity,
          cover_image_url: coverImageUrl,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          registration_start_date: values.registration_start_date || null,
          registration_end_date: values.registration_end_date || null,
          status: values.status,
          is_featured: values.is_featured,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Event updated successfully");
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedEvent(null);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update event");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Event deleted successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to delete event");
    },
  });

  const filteredEvents = events?.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.organizer.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-600 text-white" },
      published: { label: "Published", className: "bg-green-600 text-white" },
      cancelled: { label: "Cancelled", className: "bg-red-600 text-white" },
      completed: { label: "Completed", className: "bg-blue-600 text-white" },
    };
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    form.reset({
      title: event.title,
      organizer: event.organizer,
      description: event.description,
      category: event.category as any,
      type: event.type,
      price_type: event.price_type,
      price: event.price,
      location: event.location || "",
      capacity: event.capacity,
      cover_image_url: event.cover_image_url,
      start_date: event.start_date || null,
      end_date: event.end_date || null,
      registration_start_date: event.registration_start_date || null,
      registration_end_date: event.registration_end_date || null,
      status: event.status,
      is_featured: event.is_featured,
    });
    setImagePreview(event.cover_image_url || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedEvent(null);
    form.reset({
      title: "",
      organizer: "",
      description: "",
      category: "Networking",
      type: "Physical",
      price_type: "Free",
      price: 0,
      location: "",
      capacity: 100,
      cover_image_url: null,
      start_date: null,
      end_date: null,
      registration_start_date: null,
      registration_end_date: null,
      status: "draft",
      is_featured: false,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const onSubmit = (values: EventFormValues) => {
    if (isEditMode && selectedEvent) {
      updateMutation.mutate({ id: selectedEvent.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="text-gold" size={24} />
                <div>
                  <h1 className="text-2xl font-semibold text-white">Manage Events</h1>
                  <p className="text-rainy-grey text-sm mt-1">
                    Create and manage platform events
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                className="bg-gold text-cursed-black hover:bg-gold-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by title, organizer, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-nero border-steel-wool text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-rainy-grey">Loading...</div>
            ) : filteredEvents?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">No events found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-nero/50">
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Organizer</TableHead>
                      <TableHead className="text-white">Category</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Registrations</TableHead>
                      <TableHead className="text-white">Start Date</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents?.map((event) => (
                      <TableRow key={event.id} className="border-steel-wool hover:bg-nero/50">
                        <TableCell className="text-white font-medium">{event.title}</TableCell>
                        <TableCell className="text-rainy-grey">{event.organizer}</TableCell>
                        <TableCell className="text-rainy-grey">{event.category}</TableCell>
                        <TableCell className="text-rainy-grey">{event.type}</TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell className="text-white">
                          {event.registration_count || 0} / {event.capacity}
                        </TableCell>
                        <TableCell className="text-rainy-grey">
                          {event.start_date ? format(new Date(event.start_date), "MMM dd, yyyy") : "TBA"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(event)}
                              className="text-gold hover:text-gold-dark"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this event?")) {
                                  deleteMutation.mutate(event.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </PanelCard>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-black border-steel-wool text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {isEditMode ? "Edit Event" : "Create Event"}
              </DialogTitle>
              <DialogDescription className="text-rainy-grey">
                {isEditMode ? "Update the event details" : "Create a new platform event"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Event title"
                            className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organizer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Organizer</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Organizer name"
                            className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Event description"
                          className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-nero border-steel-wool text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-nero border-steel-wool text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-nero border-steel-wool text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Pricing Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-nero border-steel-wool text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Free">Free</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("price_type") === "Paid" && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-nero border-steel-wool text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Event location"
                            className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? new Date(value).toISOString() : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? new Date(value).toISOString() : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registration_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Registration Start</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? new Date(value).toISOString() : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registration_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Registration End</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            className="bg-nero border-steel-wool text-white"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? new Date(value).toISOString() : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="cover_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Cover Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {imagePreview ? (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Cover preview"
                                className="w-full h-auto max-h-64 object-contain rounded-lg border border-steel-wool bg-nero"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white"
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-steel-wool rounded-lg p-6 text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-rainy-grey mb-2" />
                              <p className="text-rainy-grey text-sm mb-2">
                                Upload a cover image (PNG, JPG, max 5MB)
                              </p>
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                  disabled={uploadingImage}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-steel-wool text-rainy-grey hover:bg-nero"
                                  disabled={uploadingImage}
                                  asChild
                                >
                                  <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploadingImage ? "Uploading..." : "Choose Image"}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          )}
                          <input type="hidden" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 rounded border-steel-wool bg-nero text-gold focus:ring-gold"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-white cursor-pointer">
                          Featured Event
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsEditMode(false);
                      setSelectedEvent(null);
                      form.reset();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="border-steel-wool text-rainy-grey"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gold text-cursed-black hover:bg-gold-dark"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {isEditMode ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminEvents;
