"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { PageTransition } from "@/lib/animations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SentimentVote {
  id: string;
  user_id: string;
  currency_pair: string;
  sentiment: "bullish" | "bearish" | "neutral";
  created_at: string;
}

const CURRENCY_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "EUR/GBP",
  "XAU/USD",
];

const COLORS = {
  bullish: "#10b981",
  bearish: "#ef4444",
  neutral: "#6b7280",
};

const AdminSentiment: React.FC = () => {
  const { data: votes, isLoading } = useQuery<SentimentVote[]>({
    queryKey: ["admin-sentiment-votes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sentiment_votes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const sentimentData = React.useMemo(() => {
    if (!votes) return [];

    return CURRENCY_PAIRS.map((pair) => {
      const pairVotes = votes.filter((v) => v.currency_pair === pair);
      const bullish = pairVotes.filter((v) => v.sentiment === "bullish").length;
      const bearish = pairVotes.filter((v) => v.sentiment === "bearish").length;
      const neutral = pairVotes.filter((v) => v.sentiment === "neutral").length;
      const total = pairVotes.length;

      return {
        pair,
        bullish,
        bearish,
        neutral,
        total,
        bullishPercent: total > 0 ? ((bullish / total) * 100).toFixed(1) : "0",
        bearishPercent: total > 0 ? ((bearish / total) * 100).toFixed(1) : "0",
        neutralPercent: total > 0 ? ((neutral / total) * 100).toFixed(1) : "0",
      };
    });
  }, [votes]);

  const overallStats = React.useMemo(() => {
    if (!votes) return { total: 0, bullish: 0, bearish: 0, neutral: 0 };
    return {
      total: votes.length,
      bullish: votes.filter((v) => v.sentiment === "bullish").length,
      bearish: votes.filter((v) => v.sentiment === "bearish").length,
      neutral: votes.filter((v) => v.sentiment === "neutral").length,
    };
  }, [votes]);

  const chartData = sentimentData.map((item) => ({
    pair: item.pair,
    Bullish: item.bullish,
    Bearish: item.bearish,
    Neutral: item.neutral,
  }));

  const pieData = [
    { name: "Bullish", value: overallStats.bullish, color: COLORS.bullish },
    { name: "Bearish", value: overallStats.bearish, color: COLORS.bearish },
    { name: "Neutral", value: overallStats.neutral, color: COLORS.neutral },
  ];

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-gold" size={24} />
              <div>
                <h1 className="text-2xl font-semibold text-white">Sentiment Analytics</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  View community sentiment voting data and analytics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Total Votes</p>
                      <p className="text-2xl font-semibold text-white">{overallStats.total}</p>
                    </div>
                    <BarChart3 className="text-gold" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Bullish</p>
                      <p className="text-2xl font-semibold text-green-500">{overallStats.bullish}</p>
                    </div>
                    <TrendingUp className="text-green-500" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Bearish</p>
                      <p className="text-2xl font-semibold text-red-500">{overallStats.bearish}</p>
                    </div>
                    <TrendingDown className="text-red-500" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Neutral</p>
                      <p className="text-2xl font-semibold text-gray-500">{overallStats.neutral}</p>
                    </div>
                    <Minus className="text-gray-500" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
            </div>
          </CardContent>
        </PanelCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PanelCard>
            <CardContent className="p-6">
              <h2 className="text-white font-semibold mb-4">Sentiment by Currency Pair</h2>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center text-rainy-grey">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="pair" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Bullish" fill={COLORS.bullish} />
                    <Bar dataKey="Bearish" fill={COLORS.bearish} />
                    <Bar dataKey="Neutral" fill={COLORS.neutral} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </PanelCard>

          <PanelCard>
            <CardContent className="p-6">
              <h2 className="text-white font-semibold mb-4">Overall Sentiment Distribution</h2>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center text-rainy-grey">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </PanelCard>
        </div>

        <PanelCard>
          <CardContent className="p-6">
            <h2 className="text-white font-semibold mb-4">Detailed Sentiment Breakdown</h2>
            {isLoading ? (
              <div className="text-center py-8 text-rainy-grey">Loading...</div>
            ) : (
              <div className="space-y-4">
                {sentimentData.map((item) => (
                  <div
                    key={item.pair}
                    className="bg-nero p-4 rounded-lg border border-steel-wool"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{item.pair}</h3>
                      <span className="text-rainy-grey text-sm">{item.total} votes</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-green-500 text-sm">Bullish</span>
                            <span className="text-white text-sm">{item.bullishPercent}%</span>
                          </div>
                          <div className="w-full bg-steel-wool rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${item.bullishPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-red-500 text-sm">Bearish</span>
                            <span className="text-white text-sm">{item.bearishPercent}%</span>
                          </div>
                          <div className="w-full bg-steel-wool rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${item.bearishPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-500 text-sm">Neutral</span>
                            <span className="text-white text-sm">{item.neutralPercent}%</span>
                          </div>
                          <div className="w-full bg-steel-wool rounded-full h-2">
                            <div
                              className="bg-gray-500 h-2 rounded-full"
                              style={{ width: `${item.neutralPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </PanelCard>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminSentiment;
