"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { showError, showSuccess } from "@/utils/toast";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTransition, ScrollReveal, fadeInUp } from "@/lib/animations";
import { motion } from "framer-motion";
import { Handshake, Send, Building, Users, Briefcase, Target } from "lucide-react";

const collaborationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  collaborationType: z.string().min(1, "Please select a collaboration type"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type CollaborationFormValues = z.infer<typeof collaborationSchema>;

const collaborationTypes = [
  { value: "content", label: "Content Creation & Marketing" },
  { value: "affiliate", label: "Affiliate Partnership" },
  { value: "education", label: "Educational Partnership" },
  { value: "technology", label: "Technology Integration" },
  { value: "events", label: "Events & Webinars" },
  { value: "media", label: "Media & Press" },
  { value: "influencer", label: "Influencer Collaboration" },
  { value: "strategic", label: "Strategic Partnership" },
  { value: "other", label: "Other" },
];

const Collaborations: React.FC = () => {
  const { session } = useSupabaseSession();
  const form = useForm<CollaborationFormValues>({
    resolver: zodResolver(collaborationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      collaborationType: "",
      website: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: CollaborationFormValues) => {
    try {
      const payload = {
        user_id: session?.user?.id || null,
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        company: values.company,
        collaboration_type: values.collaborationType,
        website: values.website || null,
        subject: values.subject,
        message: values.message,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("collaborations").insert(payload);

      if (error) {
        showError(error.message || "Failed to submit collaboration enquiry. Please try again.");
        throw error;
      }

      showSuccess("Your collaboration enquiry has been submitted successfully! We'll review and contact you soon.");
      form.reset();
    } catch (error) {
      console.error("Collaboration submission error:", error);
    }
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-6">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-nero flex items-center justify-center">
                    <Handshake className="text-gold" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-white">Collaborations</h1>
                    <p className="text-rainy-grey mt-1">
                      Partner with AllyTZ Panel. Let's explore opportunities to grow together and create value.
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>

          {/* Collaboration Types Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nero flex items-center justify-center">
                    <Users className="text-gold" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Partnership</div>
                    <div className="text-rainy-grey text-xs">Strategic alliances</div>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nero flex items-center justify-center">
                    <Briefcase className="text-gold" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Business Growth</div>
                    <div className="text-rainy-grey text-xs">Mutual benefits</div>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nero flex items-center justify-center">
                    <Target className="text-gold" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Win-Win</div>
                    <div className="text-rainy-grey text-xs">Shared success</div>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
          </div>

          {/* Collaboration Form */}
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your full name"
                                className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your.email@example.com"
                                className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+1234567890"
                                className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Company/Organization</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your company name"
                                className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="collaborationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Collaboration Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-nero border-steel-wool text-white focus:ring-gold">
                                  <SelectValue placeholder="Select collaboration type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {collaborationTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                    className="text-white focus:bg-nero"
                                  >
                                    {type.label}
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
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Website (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://yourwebsite.com"
                                className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
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
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Subject</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description of your collaboration proposal"
                              className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Collaboration Proposal</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please provide details about your collaboration proposal, including goals, benefits, and how we can work together..."
                              className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold min-h-[200px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        className="border-steel-wool text-rainy-grey hover:bg-nero/50 hover:border-gold/40"
                      >
                        Clear Form
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 font-semibold"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Collaboration Enquiry
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </PanelCard>
          </ScrollReveal>

          {/* Info Section */}
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-6">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-white">Why Collaborate with AllyTZ Panel?</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Building className="text-gold mt-0.5" size={18} />
                        <div>
                          <div className="text-white font-medium text-sm">Established Brand</div>
                          <div className="text-rainy-grey text-xs">
                            Join a trusted platform with a growing community of traders
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Users className="text-gold mt-0.5" size={18} />
                        <div>
                          <div className="text-white font-medium text-sm">Active Community</div>
                          <div className="text-rainy-grey text-xs">
                            Reach engaged traders looking for quality content and partnerships
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Target className="text-gold mt-0.5" size={18} />
                        <div>
                          <div className="text-white font-medium text-sm">Mutual Growth</div>
                          <div className="text-rainy-grey text-xs">
                            Partnerships designed to benefit both parties
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Briefcase className="text-gold mt-0.5" size={18} />
                        <div>
                          <div className="text-white font-medium text-sm">Flexible Partnerships</div>
                          <div className="text-rainy-grey text-xs">
                            Customized collaboration models to fit your needs
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default Collaborations;

