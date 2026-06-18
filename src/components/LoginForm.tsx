"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignup?: () => void;
  onSwitchToForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  open,
  onOpenChange,
  onSwitchToSignup,
  onSwitchToForgotPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess("Successfully signed in!");
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
      console.error("Login error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-nero border-steel-wool text-white p-0 sm:rounded-lg [&>button]:text-rainy-grey [&>button]:hover:text-gold mx-4 sm:mx-auto">
        <div className="p-5 sm:p-6 md:p-8">
          <DialogHeader className="text-left mb-5 sm:mb-6">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-1 font-heading">
              Sign in
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-rainy-grey">
              Sign in to your AllyTZ Panel account
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
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
                          placeholder="Enter your password"
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

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-xs sm:text-sm text-gold hover:underline transition-colors min-h-[32px] flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenChange(false);
                    onSwitchToForgotPassword?.();
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black h-12 sm:h-14 rounded-md font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 text-sm sm:text-base"
              >
                Sign in
              </Button>
            </form>
          </Form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-rainy-grey">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToSignup?.();
                }}
                className="text-gold hover:underline font-medium transition-colors min-h-[32px] inline-flex items-center"
              >
                Get Started
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginForm;

