"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import {
  TrendingUp,
  SignalHigh,
  TrendingDown,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Target,
  X,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { PageTransition, ScrollReveal } from "@/lib/animations";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  formatSignalOrderType,
} from "@shared/constants/signals";

interface Signal {
  id: string;
  trading_pair: string;
  signal_type: "buy" | "sell";
  order_type?: "market" | "limit" | "stop";
  entry_price: number;
  stop_loss: number;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  title: string;
  analysis: string | null;
  confidence_level: "low" | "medium" | "high" | null;
  status: "active" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
}

const Signals: React.FC = () => {
  const { session } = useSupabaseSession();

  // Fetch signals for all users (subscription check removed)
  const { data: signals, isLoading: signalsLoading } = useQuery<Signal[]>({
    queryKey: ["signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });


  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      active: { 
        label: "Active", 
        className: "bg-green-600/90 hover:bg-green-600 text-white border-green-500/50 shadow-sm",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />
      },
      closed: { 
        label: "Closed", 
        className: "bg-blue-600/90 hover:bg-blue-600 text-white border-blue-500/50 shadow-sm",
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      cancelled: { 
        label: "Cancelled", 
        className: "bg-gray-600/90 hover:bg-gray-600 text-white border-gray-500/50 shadow-sm",
        icon: <X className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[status] || variants.active;
    return (
      <Badge className={`${variant.className} font-semibold px-2.5 py-1 border flex items-center w-fit`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const getConfidenceBadge = (level: string | null) => {
    if (!level) return null;
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      high: { 
        label: "High", 
        className: "bg-green-600/90 hover:bg-green-600 text-white border-green-500/50 shadow-sm",
        icon: <TrendingUp className="h-3 w-3 mr-1" />
      },
      medium: { 
        label: "Medium", 
        className: "bg-yellow-600/90 hover:bg-yellow-600 text-white border-yellow-500/50 shadow-sm",
        icon: <BarChart3 className="h-3 w-3 mr-1" />
      },
      low: { 
        label: "Low", 
        className: "bg-gray-600/90 hover:bg-gray-600 text-white border-gray-500/50 shadow-sm",
        icon: <TrendingDown className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[level] || variants.medium;
    return (
      <Badge className={`${variant.className} font-semibold px-2.5 py-1 border flex items-center w-fit`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  // Show signals table for all users (subscription check removed)
  return (
    <PageTransition>
      <DashboardLayout>
        <ScrollReveal>
          {/* Header Card */}
          <PanelCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-9 h-9 rounded-md bg-[#697452] flex items-center justify-center"
                  >
                    <SignalHigh className="text-white" size={18} />
                  </motion.div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-white">Trading Signals</h1>
                    <p className="text-rainy-grey text-sm mt-1">
                      Access all trading signals
                    </p>
                  </div>
                </div>
                {signals && signals.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg border border-gold/20">
                    <SignalHigh className="h-4 w-4 text-gold" />
                    <span className="text-white font-semibold">{signals.length}</span>
                    <span className="text-rainy-grey text-sm">
                      {signals.length === 1 ? 'Signal' : 'Signals'}
                    </span>
                  </div>
                )}
              </div>

                {signalsLoading ? (
                  <div className="text-center text-rainy-grey py-8">Loading signals...</div>
                ) : !signals || signals.length === 0 ? (
                  <div className="text-center text-rainy-grey py-8">
                    <SignalHigh className="mx-auto mb-4 text-rainy-grey" size={48} />
                    <p className="text-lg font-medium text-white mb-2">No signals available yet</p>
                    <p className="text-sm">Signals will appear here as they are published.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-steel-wool/50 bg-nero/30 backdrop-blur-sm">
                    <div className="min-w-full">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-steel-wool bg-nero/90 backdrop-blur-sm hover:bg-nero/95 sticky top-0 z-10 shadow-lg">
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gold" />
                                <span>Pair</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Type</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Order</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ArrowUp className="h-4 w-4 text-green-500" />
                                <span>Entry / Limit / Stop</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ArrowDown className="h-4 w-4 text-red-500" />
                                <span>Stop Loss</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-gold" />
                                <span>Take Profit</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 min-w-[200px]">Reason & Notes</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Confidence</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Status</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gold" />
                                <span>Created</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gold" />
                                <span>Updated</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {signals.map((signal, index) => (
                            <TableRow 
                              key={signal.id} 
                              className="border-steel-wool/50 hover:bg-nero/60 transition-all duration-200 group"
                            >
                              <TableCell className="text-white font-semibold py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  <span className="text-base">{signal.trading_pair}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-4">
                                <Badge 
                                  className={`${
                                    signal.signal_type === 'buy' 
                                      ? 'bg-green-600/90 hover:bg-green-600 text-white border-green-500/50' 
                                      : 'bg-red-600/90 hover:bg-red-600 text-white border-red-500/50'
                                  } font-semibold px-3 py-1 border shadow-sm`}
                                >
                                  {signal.signal_type === 'buy' ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {signal.signal_type.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4 px-4">
                                <Badge variant="outline" className="border-gold text-gold text-xs">
                                  {formatSignalOrderType(signal.order_type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white py-4 px-4">
                                <div className="font-mono text-sm bg-green-500/10 px-2 py-1 rounded border border-green-500/20 inline-block">
                                  {signal.entry_price.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-white py-4 px-4">
                                <div className="font-mono text-sm bg-red-500/10 px-2 py-1 rounded border border-red-500/20 inline-block">
                                  {signal.stop_loss.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-white py-4 px-4">
                                {signal.take_profit_1 ? (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">TP1</span>
                                      <span className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                        {signal.take_profit_1.toFixed(2)}
                                      </span>
                                    </div>
                                    {signal.take_profit_2 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">TP2</span>
                                        <span className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                          {signal.take_profit_2.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {signal.take_profit_3 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">TP3</span>
                                        <span className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                          {signal.take_profit_3.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-rainy-grey text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-white py-4 px-4 max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-medium text-sm" title={signal.title}>
                                    <span className="text-rainy-grey text-xs uppercase tracking-wide">Reason: </span>
                                    {signal.title}
                                  </div>
                                  {signal.analysis && (
                                    <div 
                                      className="text-xs text-rainy-grey line-clamp-2 leading-relaxed mt-1" 
                                      title={signal.analysis}
                                    >
                                      <span className="uppercase tracking-wide">Notes: </span>
                                      {signal.analysis}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-4">{getConfidenceBadge(signal.confidence_level)}</TableCell>
                              <TableCell className="py-4 px-4">{getStatusBadge(signal.status)}</TableCell>
                              <TableCell className="text-rainy-grey py-4 px-4">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-white/90">
                                    {format(new Date(signal.created_at), "MMM dd, yyyy")}
                                  </div>
                                  <div className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(signal.created_at), "HH:mm:ss")}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-rainy-grey py-4 px-4">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-white/90">
                                    {format(new Date(signal.updated_at), "MMM dd, yyyy")}
                                  </div>
                                  <div className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(signal.updated_at), "HH:mm:ss")}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </PanelCard>
          </ScrollReveal>
        </DashboardLayout>
      </PageTransition>
  );
};

export default Signals;