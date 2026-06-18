"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, TrendingDown, RefreshCw, Users, CheckSquare, LineChart, Search, MessageSquare } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

type SentimentType = "bullish" | "bearish" | "neutral";
type CurrencyPair = "EUR/USD" | "GBP/USD" | "USD/JPY" | "AUD/USD" | "USD/CAD" | "EUR/GBP" | "XAU/USD";

interface SentimentVote {
  id: string;
  currency_pair: CurrencyPair;
  sentiment: SentimentType;
  user_id: string;
  created_at: string;
}

interface PairStats {
  pair: CurrencyPair;
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  userVote: SentimentType | null;
}

const CURRENCY_PAIRS: CurrencyPair[] = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "EUR/GBP",
  "XAU/USD",
];

const PAIR_QUESTIONS: Record<CurrencyPair, string> = {
  "EUR/USD": "EUR/USD - What's your outlook? What's your bias on EUR/USD this coming week?",
  "GBP/USD": "GBP/USD - What's your outlook? Where are we going from here?",
  "USD/JPY": "USD/JPY - What's your sentiment? Where do you see this pair heading?",
  "AUD/USD": "AUD/USD - What's your outlook? What's your bias on AUD/USD?",
  "USD/CAD": "USD/CAD - What's your sentiment? Where are we going from here?",
  "EUR/GBP": "EUR/GBP - What's your outlook? What's your bias on EUR/GBP?",
  "XAU/USD": "What's your outlook? Gold just created an all time high. Where do we go from here?",
};

const Sentiment: React.FC = () => {
  const { session } = useSupabaseSession();
  const [allPairStats, setAllPairStats] = useState<PairStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [tableError, setTableError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPair, setFilterPair] = useState<"all" | CurrencyPair>("all");
  const [selectedPairForVote, setSelectedPairForVote] = useState<CurrencyPair | null>(null);
  const [voteSentiment, setVoteSentiment] = useState<SentimentType | null>(null);

  // Fetch all sentiment data
  const fetchAllSentimentData = async () => {
    try {
      const { data: votes, error } = await supabase
        .from("sentiment_votes")
        .select("*");

      if (error) {
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          console.error("Table 'sentiment_votes' does not exist. Please run the SQL migration.");
          setTableError(true);
          showError("Database table not found. Please run the SQL migration in Supabase.");
          return;
        }
        throw error;
      }

      setTableError(false);

      // Calculate stats for each pair
      const stats: PairStats[] = CURRENCY_PAIRS.map((pair) => {
        const pairVotes = votes?.filter((v) => v.currency_pair === pair) || [];
        const bullishCount = pairVotes.filter((v) => v.sentiment === "bullish").length;
        const bearishCount = pairVotes.filter((v) => v.sentiment === "bearish").length;
        const neutralCount = pairVotes.filter((v) => v.sentiment === "neutral").length;
        const total = bullishCount + bearishCount + neutralCount;

        const userVoteData = session?.user?.id
          ? pairVotes.find((v) => v.user_id === session.user.id)?.sentiment || null
          : null;

        return {
          pair,
          bullish: bullishCount,
          bearish: bearishCount,
          neutral: neutralCount,
          total,
          userVote: userVoteData,
        };
      });

      setAllPairStats(stats);
    } catch (error: any) {
      console.error("Error fetching sentiment data:", error);
      showError("Failed to load sentiment data");
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllSentimentData();
  }, [session?.user?.id]);

  // Polling mechanism - refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPolling(true);
      fetchAllSentimentData().finally(() => {
        setIsPolling(false);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Submit vote
  const handleVote = async (pair: CurrencyPair, sentiment: SentimentType) => {
    if (!session?.user?.id) {
      showError("Please sign in to vote");
      return;
    }

    setIsLoading(true);
    try {
      const { data: existingVote } = await supabase
        .from("sentiment_votes")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("currency_pair", pair)
        .single();

      if (existingVote) {
        const { error } = await supabase
          .from("sentiment_votes")
          .update({ sentiment })
          .eq("id", existingVote.id);

        if (error) throw error;
        showSuccess("Vote updated!");
      } else {
        const { error } = await supabase.from("sentiment_votes").insert({
          user_id: session.user.id,
          currency_pair: pair,
          sentiment,
        });

        if (error) throw error;
        showSuccess("Vote submitted!");
      }

      setSelectedPairForVote(null);
      setVoteSentiment(null);
      await fetchAllSentimentData();
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        setTableError(true);
        showError("Database table not found. Please run the SQL migration in Supabase.");
      } else {
        showError(error.message || "Failed to submit vote");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const getDominantSentiment = (stats: PairStats): SentimentType | null => {
    if (stats.total === 0) return null;
    if (stats.bullish > stats.bearish && stats.bullish > stats.neutral) return "bullish";
    if (stats.bearish > stats.bullish && stats.bearish > stats.neutral) return "bearish";
    if (stats.neutral > stats.bullish && stats.neutral > stats.bearish) return "neutral";
    return null;
  };

  // Calculate summary stats
  const totalVotes = allPairStats.reduce((sum, s) => sum + s.total, 0);
  const userVotes = allPairStats.filter((s) => s.userVote !== null).length;
  const activePolls = allPairStats.filter((s) => s.total > 0).length;

  // Filter pairs
  const filteredPairs = allPairStats.filter((stats) => {
    const matchesSearch = stats.pair.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPair === "all" || stats.pair === filterPair;
    return matchesSearch && matchesFilter;
  });

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header */}
        <ScrollReveal>
          <PanelCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold text-white">Market Sentiment Voting</h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Vote on currency pair directions and see community sentiment
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPolling(true);
                    fetchAllSentimentData().finally(() => setIsPolling(false));
                  }}
                  disabled={isPolling}
                  className="border-slate-700 text-slate-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isPolling ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </PanelCard>
        </ScrollReveal>

        {/* Table Error Message */}
        {tableError && (
          <ScrollReveal>
            <PanelCard className="mb-6 border-yellow-600/50 bg-yellow-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="text-yellow-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-yellow-400 font-semibold mb-2">Database Table Not Found</h3>
                    <p className="text-slate-300 text-sm mb-3">
                      The <code className="bg-slate-800 px-2 py-1 rounded">sentiment_votes</code> table needs to be created in Supabase.
                    </p>
                    <div className="bg-slate-900/60 rounded-lg p-4 mb-3">
                      <p className="text-slate-400 text-xs mb-2 font-semibold">Quick Setup:</p>
                      <ol className="text-slate-300 text-xs space-y-1 list-decimal list-inside">
                        <li>Go to Supabase Dashboard → SQL Editor</li>
                        <li>Open <code className="bg-slate-800 px-1 rounded">supabase/migrations/create_sentiment_votes.sql</code></li>
                        <li>Copy and run the SQL migration</li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:text-yellow-300 text-sm underline"
                    >
                      Open Supabase Dashboard →
                    </a>
                  </div>
                </div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        )}

        {/* Summary Cards */}
        {!tableError && (
          <ScrollReveal>
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div variants={fadeInUp}>
                <HoverScale>
                  <PanelCard>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                          <CheckSquare className="text-blue-400" size={20} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{activePolls}</div>
                          <div className="text-slate-400 text-sm">Active Polls</div>
                        </div>
                      </div>
                    </CardContent>
                  </PanelCard>
                </HoverScale>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <HoverScale>
                  <PanelCard>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-600/20 flex items-center justify-center">
                          <BarChart3 className="text-teal-400" size={20} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{totalVotes}</div>
                          <div className="text-slate-400 text-sm">Total Votes</div>
                        </div>
                      </div>
                    </CardContent>
                  </PanelCard>
                </HoverScale>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <HoverScale>
                  <PanelCard>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                          <LineChart className="text-purple-400" size={20} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{userVotes}</div>
                          <div className="text-slate-400 text-sm">Your Votes</div>
                        </div>
                      </div>
                    </CardContent>
                  </PanelCard>
                </HoverScale>
              </motion.div>
            </StaggerChildren>
          </ScrollReveal>
        )}

        {/* Search and Filters */}
        {!tableError && (
          <ScrollReveal>
            <PanelCard className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search polls..."
                      className="pl-9 bg-slate-900/60 border-slate-800 text-slate-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterPair} onValueChange={(v) => setFilterPair(v as typeof filterPair)}>
                    <SelectTrigger className="w-[150px] bg-slate-900/60 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pairs</SelectItem>
                      {CURRENCY_PAIRS.map((pair) => (
                        <SelectItem key={pair} value={pair}>
                          {pair}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        )}

        {/* Poll Cards Grid */}
        {!tableError && (
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPairs.map((stats) => {
              const dominantSentiment = getDominantSentiment(stats);
              const bullishPercent = getPercentage(stats.bullish, stats.total);
              const bearishPercent = getPercentage(stats.bearish, stats.total);
              const isOpen = stats.total > 0;
              const isVoting = selectedPairForVote === stats.pair;

              return (
                <motion.div key={stats.pair} variants={fadeInUp}>
                  <HoverScale>
                    <PanelCard className="h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white text-lg">{stats.pair}</CardTitle>
                          <Badge
                            variant={isOpen ? "default" : "secondary"}
                            className={isOpen ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"}
                          >
                            {isOpen ? "Open" : "Closed"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-slate-400 text-sm mb-4 flex-1">
                          {PAIR_QUESTIONS[stats.pair]}
                        </p>

                        {/* Voting Section */}
                        {isVoting ? (
                          <div className="space-y-3 mb-4">
                            <p className="text-slate-300 text-sm font-medium">Cast your vote:</p>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleVote(stats.pair, "bullish")}
                                disabled={isLoading}
                                className={`h-10 text-xs ${
                                  voteSentiment === "bullish" || stats.userVote === "bullish"
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                }`}
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Bull
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVote(stats.pair, "neutral")}
                                disabled={isLoading}
                                className={`h-10 text-xs ${
                                  voteSentiment === "neutral" || stats.userVote === "neutral"
                                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                }`}
                              >
                                <BarChart3 className="w-3 h-3 mr-1" />
                                Neutral
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVote(stats.pair, "bearish")}
                                disabled={isLoading}
                                className={`h-10 text-xs ${
                                  voteSentiment === "bearish" || stats.userVote === "bearish"
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                }`}
                              >
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Bear
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPairForVote(null);
                                setVoteSentiment(null);
                              }}
                              className="w-full border-slate-700 text-slate-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {stats.total > 0 ? (
                              <>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>{stats.total} votes</span>
                                  <span>{isOpen ? "Poll Open" : "Poll Closed"}</span>
                                </div>
                                <div className="relative h-6 bg-slate-800 rounded-md overflow-hidden">
                                  <div
                                    className="absolute left-0 top-0 h-full bg-green-600 flex items-center justify-end pr-2"
                                    style={{ width: `${bullishPercent}%` }}
                                  >
                                    {bullishPercent > 10 && (
                                      <span className="text-white text-xs font-semibold">{bullishPercent}%</span>
                                    )}
                                  </div>
                                  <div
                                    className="absolute right-0 top-0 h-full bg-red-600 flex items-center justify-start pl-2"
                                    style={{ width: `${bearishPercent}%` }}
                                  >
                                    {bearishPercent > 10 && (
                                      <span className="text-white text-xs font-semibold">{bearishPercent}%</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-green-500">Bullish {bullishPercent}%</span>
                                  <span className="text-red-500">Bearish {bearishPercent}%</span>
                                </div>
                                {dominantSentiment && (
                                  <Badge
                                    className={`w-full justify-center ${
                                      dominantSentiment === "bullish"
                                        ? "bg-green-600 text-white"
                                        : dominantSentiment === "bearish"
                                        ? "bg-red-600 text-white"
                                        : "bg-yellow-600 text-white"
                                    }`}
                                  >
                                    {dominantSentiment === "bullish" ? "📈 BULLISH" : dominantSentiment === "bearish" ? "📉 BEARISH" : "➡️ NEUTRAL"}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-4 text-slate-500 text-sm">
                                No votes yet. Be the first!
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto">
                          {!isVoting && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPairForVote(stats.pair);
                                setVoteSentiment(stats.userVote);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {stats.userVote ? "Change Vote" : "Vote Now"}
                            </Button>
                          )}
                          {stats.total > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700 text-slate-300"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Comments
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </PanelCard>
                  </HoverScale>
                </motion.div>
              );
            })}
          </StaggerChildren>
        )}

        {!tableError && filteredPairs.length === 0 && (
          <ScrollReveal>
            <PanelCard>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
                <p className="text-slate-400">No polls match your search criteria.</p>
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        )}
      </DashboardLayout>
    </PageTransition>
  );
};

export default Sentiment;
