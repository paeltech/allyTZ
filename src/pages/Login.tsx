"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
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
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useSupabaseSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && session) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectPath, { replace: true });
    }
  }, [session, loading, navigate]);

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
      
      // Check if there's a redirect path stored
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      showError("An error occurred. Please try again.");
      console.error("Login error:", error);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rainy-grey">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if already authenticated (redirect will happen)
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-rainy-grey hover:text-gold transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to home</span>
        </Link>

        {/* Logo */}
        <div className="mb-8 text-center">
          <img 
            src="/assets/logo.png" 
            alt="AllyTZ Panel logo" 
            className="w-32 mx-auto rounded-lg mb-6" 
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-heading">
            Sign in
          </h1>
          <p className="text-sm sm:text-base text-rainy-grey">
            Sign in to your AllyTZ Panel account
          </p>
        </div>

        {/* Login Form */}
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-white">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="bg-black border-steel-wool text-white placeholder:text-rainy-grey focus-visible:ring-gold focus-visible:border-gold pr-12 h-12 text-base"
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
                <Link
                  to="/forgot-password"
                  className="text-sm text-gold hover:underline transition-colors min-h-[32px] flex items-center"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black h-14 rounded-md font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 text-base"
              >
                Sign in
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-rainy-grey">
              Don't have an account?{" "}
              <Link
                to="/"
                className="text-gold hover:underline font-medium transition-colors min-h-[32px] inline-flex items-center"
              >
                Get Started
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
