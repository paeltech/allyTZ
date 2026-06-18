"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, LineChart, TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle2, Lock, FileText, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { cn } from "@/lib/utils";

type TradingPair = "XAUUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "AUDUSD" | "USDCAD" | "EURGBP" | "NZDUSD" | "USDCHF" | "BTCUSD";

interface TradeAnalysis {
  id: string;
  trading_pair: TradingPair;
  analysis_date: string;
  title: string;
  content: string;
  summary: string | null;
  technical_analysis: any;
  fundamental_analysis: any;
  entry_levels: any;
  exit_levels: any;
  risk_level: "low" | "medium" | "high" | null;
  price: number;
  chart_image_url: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  trade_analysis_id: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  amount_paid: number;
  purchased_at: string;
  trade_analysis: TradeAnalysis;
}

const TRADING_PAIRS: { value: TradingPair; label: string }[] = [
  { value: "XAUUSD", label: "XAU/USD (Gold)" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "AUDUSD", label: "AUD/USD" },
  { value: "USDCAD", label: "USD/CAD" },
  { value: "EURGBP", label: "EUR/GBP" },
  { value: "NZDUSD", label: "NZD/USD" },
  { value: "USDCHF", label: "USD/CHF" },
  { value: "BTCUSD", label: "BTC/USD" },
];

const DEFAULT_DAILY_FEE = 25.00;

const TradeAnalysis: React.FC = () => {
  const { session } = useSupabaseSession();
  const [selectedPair, setSelectedPair] = useState<TradingPair | "">("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableAnalyses, setAvailableAnalyses] = useState<TradeAnalysis[]>([]);
  const [purchasedAnalyses, setPurchasedAnalyses] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<"purchase" | "my-analyses">("purchase");
  const [selectedAnalysis, setSelectedAnalysis] = useState<TradeAnalysis | null>(null);

  // Fetch available analyses
  const fetchAvailableAnalyses = async (pair?: TradingPair, date?: Date) => {
    if (!pair || !date) return;

    setIsLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("trade_analyses")
        .select("*")
        .eq("trading_pair", pair)
        .eq("analysis_date", dateStr)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          showError("Database table not found. Please run the SQL migration in Supabase.");
          return;
        }
        throw error;
      }

      setAvailableAnalyses(data || []);
    } catch (error: any) {
      console.error("Error fetching analyses:", error);
      showError(error.message || "Failed to load analyses");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's purchased analyses
  const fetchPurchasedAnalyses = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_analysis_purchases")
        .select(`
          *,
          trade_analysis:trade_analyses(*)
        `)
        .eq("user_id", session.user.id)
        .eq("payment_status", "completed")
        .order("purchased_at", { ascending: false });

      if (error) {
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          showError("Database table not found. Please run the SQL migration in Supabase.");
          return;
        }
        throw error;
      }

      const purchases = (data || []).map((p: any) => ({
        ...p,
        trade_analysis: p.trade_analysis as TradeAnalysis,
      }));

      setPurchasedAnalyses(purchases);
    } catch (error: any) {
      console.error("Error fetching purchased analyses:", error);
      showError(error.message || "Failed to load purchased analyses");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has already purchased an analysis
  const checkPurchaseStatus = async (analysisId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const { data, error } = await supabase
        .from("trade_analysis_purchases")
        .select("id, payment_status")
        .eq("user_id", session.user.id)
        .eq("trade_analysis_id", analysisId)
        .eq("payment_status", "completed")
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" which is fine
        console.error("Error checking purchase:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking purchase status:", error);
      return false;
    }
  };

  // Handle purchase
  const handlePurchase = async (analysis: TradeAnalysis) => {
    if (!session?.user?.id) {
      showError("Please sign in to purchase analyses");
      return;
    }

    // Check if already purchased
    const alreadyPurchased = await checkPurchaseStatus(analysis.id);
    if (alreadyPurchased) {
      showError("You have already purchased this analysis");
      setSelectedAnalysis(analysis);
      setActiveTab("my-analyses");
      return;
    }

    setIsPurchasing(true);
    try {
      // Create purchase record with pending status
      const { data: purchase, error: purchaseError } = await supabase
        .from("trade_analysis_purchases")
        .insert({
          user_id: session.user.id,
          trade_analysis_id: analysis.id,
          payment_status: "pending",
          amount_paid: analysis.price,
          payment_method: "manual", // Replace with actual payment method
          payment_reference: `PAY-${Date.now()}`,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // In a real implementation, you would integrate with a payment provider here
      // For now, we'll simulate a successful payment after a short delay
      // TODO: Replace this with actual payment integration (Stripe, PayPal, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update purchase status to completed
      const { error: updateError } = await supabase
        .from("trade_analysis_purchases")
        .update({ payment_status: "completed" })
        .eq("id", purchase.id);

      if (updateError) throw updateError;

      showSuccess("Analysis purchased successfully!");
      await fetchPurchasedAnalyses();
      setSelectedAnalysis(analysis);
      setActiveTab("my-analyses");
    } catch (error: any) {
      console.error("Error purchasing analysis:", error);
      showError(error.message || "Failed to complete purchase");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Search for analysis when pair and date are selected
  useEffect(() => {
    if (selectedPair && selectedDate) {
      fetchAvailableAnalyses(selectedPair, selectedDate);
    }
  }, [selectedPair, selectedDate]);

  // Fetch purchased analyses on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchPurchasedAnalyses();
    }
  }, [session?.user?.id]);

  const getRiskBadgeColor = (risk: string | null) => {
    switch (risk) {
      case "low":
        return "bg-green-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "high":
        return "bg-red-600 text-white";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header */}
        <ScrollReveal>
          <PanelCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-9 h-9 rounded-md bg-gold/20 flex items-center justify-center"
                  >
                    <LineChart className="text-gold" size={18} />
                  </motion.div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-white">Trade Analysis</h1>
                    <p className="text-slate-400 text-sm mt-1">
                      Get daily in-depth analysis for your favorite trading pairs
                    </p>
                  </div>
                </div>
                <Badge className="bg-gold text-cursed-black px-3 py-1">
                  ${DEFAULT_DAILY_FEE.toFixed(2)} / day
                </Badge>
              </div>
            </CardContent>
          </PanelCard>
        </ScrollReveal>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "purchase" ? "default" : "outline"}
            onClick={() => setActiveTab("purchase")}
            className={activeTab === "purchase" ? "bg-gold text-cursed-black hover:bg-gold/90" : "border-slate-700 text-slate-300"}
          >
            Purchase Analysis
          </Button>
          <Button
            variant={activeTab === "my-analyses" ? "default" : "outline"}
            onClick={() => setActiveTab("my-analyses")}
            className={activeTab === "my-analyses" ? "bg-gold text-cursed-black hover:bg-gold/90" : "border-slate-700 text-slate-300"}
          >
            My Analyses
          </Button>
        </div>

        {/* Purchase Tab */}
        {activeTab === "purchase" && (
          <>
            {/* Selection Form */}
            <ScrollReveal>
              <PanelCard className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-white font-semibold mb-4">Select Trading Pair & Date</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Trading Pair</label>
                      <Select value={selectedPair} onValueChange={(v) => setSelectedPair(v as TradingPair)}>
                        <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                          <SelectValue placeholder="Select a trading pair" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRADING_PAIRS.map((pair) => (
                            <SelectItem key={pair.value} value={pair.value}>
                              {pair.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Analysis Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-slate-900/60 border-slate-800 text-slate-200",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="bg-slate-900"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </PanelCard>
            </ScrollReveal>

            {/* Available Analyses */}
            {selectedPair && selectedDate && (
              <ScrollReveal>
                <PanelCard>
                  <CardContent className="p-6">
                    <h2 className="text-white font-semibold mb-4">
                      Available Analysis for {TRADING_PAIRS.find((p) => p.value === selectedPair)?.label} - {format(selectedDate, "MMM dd, yyyy")}
                    </h2>
                    {isLoading ? (
                      <div className="text-center py-8 text-slate-400">Loading...</div>
                    ) : availableAnalyses.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
                        <p className="text-slate-400 mb-2">No analysis available for this date</p>
                        <p className="text-slate-500 text-sm">Analyses are typically published daily. Check back later or try a different date.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableAnalyses.map((analysis) => (
                          <motion.div key={analysis.id} variants={fadeInUp}>
                            <HoverScale>
                              <PanelCard className="border-slate-800">
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-white font-semibold text-lg">{analysis.title || `${analysis.trading_pair} Analysis`}</h3>
                                        {analysis.risk_level && (
                                          <Badge className={getRiskBadgeColor(analysis.risk_level)}>
                                            {analysis.risk_level.toUpperCase()} RISK
                                          </Badge>
                                        )}
                                      </div>
                                      {analysis.summary && (
                                        <p className="text-slate-400 text-sm mb-3">{analysis.summary}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1">
                                          <Clock size={14} />
                                          <span>{format(new Date(analysis.analysis_date), "MMM dd, yyyy")}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign size={14} />
                                          <span>${analysis.price.toFixed(2)}</span>
                                        </div>
                                        {analysis.chart_image_url && (
                                          <div className="flex items-center gap-1 text-green-500">
                                            <LineChart size={14} />
                                            <span>Chart included</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => handlePurchase(analysis)}
                                      disabled={isPurchasing}
                                      className="bg-gold text-cursed-black hover:bg-gold/90"
                                    >
                                      {isPurchasing ? "Processing..." : `Purchase $${analysis.price.toFixed(2)}`}
                                    </Button>
                                  </div>
                                </CardContent>
                              </PanelCard>
                            </HoverScale>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </PanelCard>
              </ScrollReveal>
            )}
          </>
        )}

        {/* My Analyses Tab */}
        {activeTab === "my-analyses" && (
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-6">
                <h2 className="text-white font-semibold mb-4">Your Purchased Analyses</h2>
                {isLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : purchasedAnalyses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
                    <p className="text-slate-400 mb-2">No purchased analyses yet</p>
                    <p className="text-slate-500 text-sm">Purchase an analysis to view it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedAnalyses.map((purchase) => {
                      const analysis = purchase.trade_analysis;
                      return (
                        <motion.div key={purchase.id} variants={fadeInUp}>
                          <HoverScale>
                            <PanelCard className="border-slate-800">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-white font-semibold text-lg">{analysis.title || `${analysis.trading_pair} Analysis`}</h3>
                                      {analysis.risk_level && (
                                        <Badge className={getRiskBadgeColor(analysis.risk_level)}>
                                          {analysis.risk_level.toUpperCase()} RISK
                                        </Badge>
                                      )}
                                      <Badge className="bg-green-600 text-white">
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Purchased
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                      <div className="flex items-center gap-1">
                                        <Clock size={14} />
                                        <span>{format(new Date(analysis.analysis_date), "MMM dd, yyyy")}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <DollarSign size={14} />
                                        <span>Paid ${purchase.amount_paid.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                                    className="border-slate-700 text-slate-300"
                                  >
                                    {selectedAnalysis?.id === analysis.id ? "Hide Analysis" : "View Analysis"}
                                  </Button>
                                </div>

                                {/* Analysis Content */}
                                {selectedAnalysis?.id === analysis.id && (
                                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                                  {analysis.chart_image_url && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-medium mb-2">Chart</h4>
                                      <div className="bg-slate-900/60 p-4 rounded-lg">
                                        <img
                                          src={analysis.chart_image_url}
                                          alt={`${analysis.trading_pair} chart`}
                                          className="w-full h-auto rounded-lg"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {analysis.summary && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-medium mb-2">Summary</h4>
                                      <p className="text-slate-300">{analysis.summary}</p>
                                    </div>
                                  )}
                                  <div className="mb-4">
                                    <h4 className="text-white font-medium mb-2">Full Analysis</h4>
                                    <div className="text-slate-300 whitespace-pre-wrap bg-slate-900/60 p-4 rounded-lg">
                                      {analysis.content}
                                    </div>
                                  </div>
                                  {analysis.entry_levels && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-medium mb-2">Entry Levels</h4>
                                      <div className="text-slate-300 bg-slate-900/60 p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(analysis.entry_levels, null, 2)}</pre>
                                      </div>
                                    </div>
                                  )}
                                  {analysis.exit_levels && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-medium mb-2">Exit Levels</h4>
                                      <div className="text-slate-300 bg-slate-900/60 p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(analysis.exit_levels, null, 2)}</pre>
                                      </div>
                                    </div>
                                  )}
                                  {analysis.technical_analysis && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-medium mb-2">Technical Analysis</h4>
                                      <div className="text-slate-300 bg-slate-900/60 p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(analysis.technical_analysis, null, 2)}</pre>
                                      </div>
                                    </div>
                                  )}
                                  {analysis.fundamental_analysis && (
                                    <div>
                                      <h4 className="text-white font-medium mb-2">Fundamental Analysis</h4>
                                      <div className="text-slate-300 bg-slate-900/60 p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(analysis.fundamental_analysis, null, 2)}</pre>
                                      </div>
                                    </div>
                                  )}
                                  </div>
                                )}
                              </CardContent>
                            </PanelCard>
                          </HoverScale>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        )}
      </DashboardLayout>
    </PageTransition>
  );
};

export default TradeAnalysis;
