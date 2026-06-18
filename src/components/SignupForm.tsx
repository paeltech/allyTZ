"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, X } from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useNavigate } from "react-router-dom";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z
    .string()
    .max(15, "Phone number must not exceed 15 digits")
    .refine(
      (v) => v === "" || /^[0-9]+$/.test(v),
      "Phone number must contain only digits"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  verifyPassword: z.string().min(1, "Please confirm your password"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
})
  .refine((data) => data.password === data.verifyPassword, {
    message: "Passwords do not match",
    path: ["verifyPassword"],
  })
  .refine(
    (data) => {
      const n = data.phoneNumber.trim();
      if (n.length === 0) return true;
      return n.length >= 6;
    },
    {
      message: "Phone number looks too short",
      path: ["phoneNumber"],
    }
  );

type SignupFormValues = z.infer<typeof signupSchema>;

const countryCodes = [
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", country: "Albania", flag: "🇦🇱" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+376", country: "Andorra", flag: "🇦🇩" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },
  { code: "+1", country: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+374", country: "Armenia", flag: "🇦🇲" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
  { code: "+1", country: "Bahamas", flag: "🇧🇸" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+1", country: "Barbados", flag: "🇧🇧" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+501", country: "Belize", flag: "🇧🇿" },
  { code: "+229", country: "Benin", flag: "🇧🇯" },
  { code: "+975", country: "Bhutan", flag: "🇧🇹" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+673", country: "Brunei", flag: "🇧🇳" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
  { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", country: "Chad", flag: "🇹🇩" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+269", country: "Comoros", flag: "🇰🇲" },
  { code: "+242", country: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "Congo (DRC)", flag: "🇨🇩" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+53", country: "Cuba", flag: "🇨🇺" },
  { code: "+357", country: "Cyprus", flag: "🇨🇾" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+253", country: "Djibouti", flag: "🇩🇯" },
  { code: "+1", country: "Dominica", flag: "🇩🇲" },
  { code: "+1", country: "Dominican Republic", flag: "🇩🇴" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", country: "Eritrea", flag: "🇪🇷" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+679", country: "Fiji", flag: "🇫🇯" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+1", country: "Grenada", flag: "🇬🇩" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+224", country: "Guinea", flag: "🇬🇳" },
  { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", country: "Guyana", flag: "🇬🇾" },
  { code: "+509", country: "Haiti", flag: "🇭🇹" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+1", country: "Jamaica", flag: "🇯🇲" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+686", country: "Kiribati", flag: "🇰🇮" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+266", country: "Lesotho", flag: "🇱🇸" },
  { code: "+231", country: "Liberia", flag: "🇱🇷" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
  { code: "+389", country: "North Macedonia", flag: "🇲🇰" },
  { code: "+261", country: "Madagascar", flag: "🇲🇬" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+960", country: "Maldives", flag: "🇲🇻" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+356", country: "Malta", flag: "🇲🇹" },
  { code: "+692", country: "Marshall Islands", flag: "🇲🇭" },
  { code: "+222", country: "Mauritania", flag: "🇲🇷" },
  { code: "+230", country: "Mauritius", flag: "🇲🇺" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+691", country: "Micronesia", flag: "🇫🇲" },
  { code: "+373", country: "Moldova", flag: "🇲🇩" },
  { code: "+377", country: "Monaco", flag: "🇲🇨" },
  { code: "+976", country: "Mongolia", flag: "🇲🇳" },
  { code: "+382", country: "Montenegro", flag: "🇲🇪" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+95", country: "Myanmar", flag: "🇲🇲" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+674", country: "Nauru", flag: "🇳🇷" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+850", country: "North Korea", flag: "🇰🇵" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+680", country: "Palau", flag: "🇵🇼" },
  { code: "+970", country: "Palestine", flag: "🇵🇸" },
  { code: "+507", country: "Panama", flag: "🇵🇦" },
  { code: "+675", country: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+1", country: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1", country: "Saint Lucia", flag: "🇱🇨" },
  { code: "+1", country: "Saint Vincent", flag: "🇻🇨" },
  { code: "+685", country: "Samoa", flag: "🇼🇸" },
  { code: "+378", country: "San Marino", flag: "🇸🇲" },
  { code: "+239", country: "São Tomé and Príncipe", flag: "🇸🇹" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+248", country: "Seychelles", flag: "🇸🇨" },
  { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+386", country: "Slovenia", flag: "🇸🇮" },
  { code: "+677", country: "Solomon Islands", flag: "🇸🇧" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+597", country: "Suriname", flag: "🇸🇷" },
  { code: "+268", country: "Eswatini", flag: "🇸🇿" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+676", country: "Tonga", flag: "🇹🇴" },
  { code: "+1", country: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
  { code: "+1", country: "Tuvalu", flag: "🇹🇻" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", country: "Vanuatu", flag: "🇻🇺" },
  { code: "+379", country: "Vatican City", flag: "🇻🇦" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+967", country: "Yemen", flag: "🇾🇪" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
];

interface SignupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  open,
  onOpenChange,
  onSwitchToLogin,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+255",
      phoneNumber: "",
      password: "",
      verifyPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);

    try {
      // Get the current origin for the redirect URL after email confirmation
      const redirectUrl = `${window.location.origin}/dashboard`;

      const phoneDigits = values.phoneNumber.trim();
      const fullPhone =
        phoneDigits.length > 0
          ? `${values.countryCode}${phoneDigits}`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            ...(fullPhone ? { phone: fullPhone } : {}),
          },
        },
      });

      if (error) {
        // Log full error details for debugging
        console.error("Signup error details:", {
          message: error.message,
          code: error.code,
          status: error.status,
          name: error.name,
        });

        // Check for duplicate email errors - Supabase returns specific error codes/messages
        const errorMessage = error.message.toLowerCase();
        const errorCode = error.code?.toLowerCase() || "";

        // Check for email already exists errors
        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("email already exists") ||
          errorMessage.includes("user already exists") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user with this email address has already been registered") ||
          errorCode === "email_already_exists" ||
          errorCode === "user_already_registered" ||
          error.status === 422
        ) {
          form.setError("email", {
            type: "manual",
            message: "This email is already registered. Please sign in instead or use a different email address.",
          });
          showError(
            "This email is already registered. Please sign in instead or use a different email address."
          );
          // Optionally switch to login form
          setTimeout(() => {
            onOpenChange(false);
            onSwitchToLogin?.();
          }, 2000);
        } else if (
          // Check for email sending errors
          errorMessage.includes("email") &&
          (errorMessage.includes("send") || errorMessage.includes("deliver") || errorMessage.includes("smtp"))
        ) {
          // Email sending specific error
          showError(
            "Unable to send confirmation email. Please check your email address and try again. If the problem persists, contact info@allytz.co"
          );
          console.error("Email sending error:", error);
        } else {
          // Show the actual error message for other errors
          showError(error.message || "An error occurred during signup. Please try again.");
        }
        return;
      }

      // Check if email confirmation is required
      // In some Supabase configurations, the user might be created but email not sent
      if (data?.user && !data?.session) {
        // User created but needs email confirmation
        console.log("User created, confirmation email should be sent");
      }

      // Create or update user profile with phone number
      // Use RPC function to bypass RLS (user may not have session yet if email confirmation required)
      if (data?.user) {
        const fullPhoneNumber = fullPhone ?? "";
        const hasPhone = Boolean(fullPhone);
        const fullName = `${values.firstName} ${values.lastName}`.trim();
        const { error: profileError } = await supabase.rpc('update_user_profile_on_signup', {
          user_id: data.user.id,
          phone_number_param: fullPhoneNumber,
          phone_verified_param: hasPhone,
          whatsapp_notifications_param: hasPhone,
          email_notifications_param: true,
          full_name_param: fullName || null,
        });

        if (profileError) {
          console.error("Error creating/updating user profile:", profileError);
          showError(
            "Account created but we couldn't save your profile details. Please update them in your profile settings."
          );
        }

        // Auto-subscribe to monthly signals
        // Note: A database trigger should handle this automatically, but we do it here as a backup
        try {
          // Get monthly pricing
          const { data: monthlyPricing, error: pricingError } = await supabase
            .from("signal_pricing")
            .select("id")
            .eq("pricing_type", "monthly")
            .eq("is_active", true)
            .single();

          if (!pricingError && monthlyPricing) {
            // Check if subscription already exists (trigger may have created it)
            const { data: existingSub } = await supabase
              .from("signal_subscriptions")
              .select("id")
              .eq("user_id", data.user.id)
              .eq("status", "active")
              .maybeSingle();

            // Only create if it doesn't exist
            if (!existingSub) {
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + 1);

              const { error: subscriptionError } = await supabase
                .from("signal_subscriptions")
                .insert({
                  user_id: data.user.id,
                  pricing_id: monthlyPricing.id,
                  subscription_type: "monthly",
                  status: "active",
                  payment_status: "completed",
                  amount_paid: 0.00,
                  whatsapp_notifications: hasPhone,
                  email_notifications: true,
                  telegram_notifications: false,
                  start_date: new Date().toISOString(),
                  end_date: endDate.toISOString(),
                });

              if (subscriptionError) {
                console.error("Error creating subscription:", subscriptionError);
                // Don't show error to user - trigger should handle it or admin can fix
              }
            }
          }
        } catch (subscriptionErr) {
          console.error("Error in subscription creation:", subscriptionErr);
          // Don't show error to user - trigger should handle it or admin can fix
        }
      }

      showSuccess("Account created successfully! Please check your email to verify your account.");
      form.reset();
      onOpenChange(false);

      // Check if there's a redirect path stored
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      showError("An error occurred. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-nero border-steel-wool text-white p-0 sm:rounded-lg [&>button]:text-rainy-grey [&>button]:hover:text-gold mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6 md:p-8">
          <DialogHeader className="text-left mb-5 sm:mb-6">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-1 font-heading">
              Get Started
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-rainy-grey">
              Create your AllyTZ Panel account
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium text-white">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First name"
                          className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold h-11 sm:h-12 text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium text-white">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold h-11 sm:h-12 text-sm sm:text-base"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-white">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold h-11 sm:h-12 text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-white">
                  WhatsApp Number{" "}
                  <span className="text-rainy-grey font-normal">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-[120px] sm:w-[140px] bg-black border-steel-wool text-white focus:ring-gold focus:border-gold h-11 sm:h-12 text-sm sm:text-base">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent className="bg-nero border-steel-wool">
                              {countryCodes.map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                  className="text-white hover:bg-black hover:text-gold focus:bg-black focus:text-gold cursor-pointer"
                                >
                                  <span className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.code}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter phone number only"
                            className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold h-11 sm:h-12 text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-rainy-grey mt-1 leading-relaxed">
                  Optional — add your number for WhatsApp updates. Select your
                  country code, then enter digits only without the country code
                  or leading zeros (max 15 digits).
                </p>
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-white">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold pr-12 h-11 sm:h-12 text-sm sm:text-base"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-rainy-grey hover:text-gold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="verifyPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-medium text-white">
                      Verify Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold pr-12 h-11 sm:h-12 text-sm sm:text-base"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-rainy-grey hover:text-gold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1 border-steel-wool data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs sm:text-sm text-rainy-grey font-normal cursor-pointer">
                        I agree to the{" "}
                        <a
                          href="/terms"
                          className="text-gold hover:underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Terms & Conditions
                        </a>
                        ,{" "}
                        <a
                          href="/privacy"
                          className="text-gold hover:underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </a>{" "}
                        and{" "}
                        <a
                          href="/email-policy"
                          className="text-gold hover:underline transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Email Policy
                        </a>{" "}
                        including opting in to receive marketing & campaign
                        emails.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black h-12 sm:h-14 rounded-md font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-rainy-grey">
              Already have an account?{" "}
              <button
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToLogin?.();
                }}
                className="text-gold hover:underline font-medium transition-colors min-h-[32px] inline-flex items-center"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupForm;

