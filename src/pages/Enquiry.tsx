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
import { MessageSquare, Send, Mail, Phone, Clock } from "lucide-react";

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().or(z.literal("")),
  enquiryType: z.string().min(1, "Please select an enquiry type"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

const enquiryTypes = [
  { value: "general", label: "General Inquiry" },
  { value: "trading", label: "Trading Support" },
  { value: "signals", label: "Signal Subscription" },
  { value: "technical", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "partnership", label: "Partnership Opportunities" },
  { value: "other", label: "Other" },
];

const Enquiry: React.FC = () => {
  const { session } = useSupabaseSession();
  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      enquiryType: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: EnquiryFormValues) => {
    try {
      const payload = {
        user_id: session?.user?.id || null,
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        enquiry_type: values.enquiryType,
        subject: values.subject,
        message: values.message,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("enquiries").insert(payload);

      if (error) {
        showError(error.message || "Failed to submit enquiry. Please try again.");
        throw error;
      }

      showSuccess("Your enquiry has been submitted successfully! We'll get back to you soon.");
      form.reset();
    } catch (error) {
      console.error("Enquiry submission error:", error);
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
                    <MessageSquare className="text-gold" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-white">Live Enquiry</h1>
                    <p className="text-rainy-grey mt-1">
                      Have a question? We're here to help. Send us your enquiry and we'll respond promptly.
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nero flex items-center justify-center">
                    <Mail className="text-gold" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Email</div>
                    <div className="text-rainy-grey text-xs">info@allytz.co</div>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nero flex items-center justify-center">
                    <Phone className="text-gold" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Phone</div>
                    <div className="text-rainy-grey text-xs">Available on request</div>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
            <PanelCard>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nero flex items-center justify-center">
                    <Clock className="text-gold" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Response Time</div>
                    <div className="text-rainy-grey text-xs">Within 24 hours</div>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
          </div>

          {/* Enquiry Form */}
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
                        name="enquiryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Enquiry Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-nero border-steel-wool text-white focus:ring-gold">
                                  <SelectValue placeholder="Select enquiry type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {enquiryTypes.map((type) => (
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
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Subject</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description of your enquiry"
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
                          <FormLabel className="text-white">Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please provide details about your enquiry..."
                              className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold min-h-[150px] resize-none"
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
                        Submit Enquiry
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default Enquiry;

