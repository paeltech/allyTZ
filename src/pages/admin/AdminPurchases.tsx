"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Filter, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";

interface Purchase {
  id: string;
  user_id: string;
  trade_analysis_id: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string | null;
  payment_reference: string | null;
  amount_paid: number;
  purchased_at: string;
  trade_analysis: {
    id: string;
    trading_pair: string;
    title: string;
    analysis_date: string;
  };
}

const AdminPurchases: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["admin-purchases", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("trade_analysis_purchases")
        .select(
          `
          *,
          trade_analysis:trade_analyses(id, trading_pair, title, analysis_date)
        `
        )
        .order("purchased_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Purchase[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Purchase["payment_status"];
    }) => {
      const { error } = await supabase
        .from("trade_analysis_purchases")
        .update({ payment_status: status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchases"] });
      showSuccess("Purchase status updated successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update status");
    },
  });

  const filteredPurchases = purchases?.filter((purchase) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      purchase.trade_analysis.trading_pair.toLowerCase().includes(query) ||
      purchase.trade_analysis.title.toLowerCase().includes(query) ||
      purchase.payment_reference?.toLowerCase().includes(query) ||
      purchase.user_id.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: Purchase["payment_status"]) => {
    const variants: Record<
      Purchase["payment_status"],
      { label: string; className: string }
    > = {
      pending: { label: "Pending", className: "bg-yellow-600 text-white" },
      completed: { label: "Completed", className: "bg-green-600 text-white" },
      failed: { label: "Failed", className: "bg-red-600 text-white" },
      refunded: { label: "Refunded", className: "bg-gray-600 text-white" },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const totalRevenue = purchases
    ?.filter((p) => p.payment_status === "completed")
    .reduce((sum, p) => sum + p.amount_paid, 0) || 0;

  const totalPurchases = purchases?.length || 0;
  const completedPurchases = purchases?.filter((p) => p.payment_status === "completed").length || 0;

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="text-gold" size={24} />
              <div>
                <h1 className="text-2xl font-semibold text-white">Purchase Management</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  View and manage all trade analysis purchases
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Total Revenue</p>
                      <p className="text-2xl font-semibold text-white">${totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="text-gold" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Total Purchases</p>
                      <p className="text-2xl font-semibold text-white">{totalPurchases}</p>
                    </div>
                    <ShoppingCart className="text-gold" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
              <PanelCard>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rainy-grey text-sm mb-1">Completed</p>
                      <p className="text-2xl font-semibold text-white">{completedPurchases}</p>
                    </div>
                    <DollarSign className="text-green-500" size={32} />
                  </div>
                </CardContent>
              </PanelCard>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by pair, title, reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-nero border-steel-wool text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-rainy-grey">Loading...</div>
            ) : filteredPurchases?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">No purchases found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-nero/50">
                      <TableHead className="text-white">Trading Pair</TableHead>
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">User ID</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Payment Method</TableHead>
                      <TableHead className="text-white">Reference</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases?.map((purchase) => (
                      <TableRow key={purchase.id} className="border-steel-wool hover:bg-nero/50">
                        <TableCell className="text-white font-medium">
                          {purchase.trade_analysis.trading_pair}
                        </TableCell>
                        <TableCell className="text-white">
                          {purchase.trade_analysis.title}
                        </TableCell>
                        <TableCell className="text-rainy-grey font-mono text-xs">
                          {purchase.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          ${purchase.amount_paid.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.payment_status)}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {purchase.payment_method || "N/A"}
                        </TableCell>
                        <TableCell className="text-rainy-grey font-mono text-xs">
                          {purchase.payment_reference || "N/A"}
                        </TableCell>
                        <TableCell className="text-rainy-grey">
                          {format(new Date(purchase.purchased_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {purchase.payment_status !== "completed" && (
                            <Select
                              value={purchase.payment_status}
                              onValueChange={(value) =>
                                updateStatusMutation.mutate({
                                  id: purchase.id,
                                  status: value as Purchase["payment_status"],
                                })
                              }
                            >
                              <SelectTrigger className="w-[140px] bg-nero border-steel-wool text-white text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </PanelCard>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminPurchases;
