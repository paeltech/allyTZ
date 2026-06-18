"use client";

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess(
        "Password reset email sent! Check your inbox and follow the link to set a new password."
      );
      form.reset();
      navigate("/login", { replace: true });
    } catch (error) {
      showError("An error occurred. Please try again.");
      console.error("Forgot password error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-rainy-grey hover:text-gold transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to sign in</span>
        </Link>

        <div className="mb-8 text-center">
          <img
            src="/assets/logo.png"
            alt="AllyTZ Panel logo"
            className="w-32 mx-auto rounded-lg mb-6"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-heading">
            Reset password
          </h1>
          <p className="text-sm sm:text-base text-rainy-grey">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        <div className="bg-nero border border-steel-wool rounded-lg p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-white">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold h-12 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black h-14 rounded-md font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 text-base"
              >
                Send reset link
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-rainy-grey">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-gold hover:underline font-medium transition-colors min-h-[32px] inline-flex items-center"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
