"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Search, Filter, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";

interface Enquiry {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  enquiry_type: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

const AdminEnquiries: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: enquiries, isLoading } = useQuery<Enquiry[]>({
    queryKey: ["admin-enquiries", statusFilter],
    queryFn: async () => {
      let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Enquiry["status"] }) => {
      const { error } = await supabase
        .from("enquiries")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
      showSuccess("Enquiry status updated successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update status");
    },
  });

  const filteredEnquiries = enquiries?.filter((enquiry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      enquiry.name.toLowerCase().includes(query) ||
      enquiry.email.toLowerCase().includes(query) ||
      enquiry.subject.toLowerCase().includes(query) ||
      enquiry.message.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: Enquiry["status"]) => {
    const variants: Record<Enquiry["status"], { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-600 text-white" },
      in_progress: { label: "In Progress", className: "bg-blue-600 text-white" },
      resolved: { label: "Resolved", className: "bg-green-600 text-white" },
      closed: { label: "Closed", className: "bg-gray-600 text-white" },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      general: "General",
      trading: "Trading",
      signals: "Signals",
      course: "Course",
      mentorship: "Mentorship",
      technical: "Technical",
      billing: "Billing",
      partnership: "Partnership",
      other: "Other",
    };
    return types[type] || type;
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="text-gold" size={24} />
              <div>
                <h1 className="text-2xl font-semibold text-white">Manage Enquiries</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  View and manage all user enquiries and support requests
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by name, email, subject..."
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
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-rainy-grey">Loading...</div>
            ) : filteredEnquiries?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">No enquiries found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-nero/50">
                      <TableHead className="text-white">Name</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Subject</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnquiries?.map((enquiry) => (
                      <TableRow key={enquiry.id} className="border-steel-wool hover:bg-nero/50">
                        <TableCell className="text-rainy-grey">{enquiry.name}</TableCell>
                        <TableCell className="text-rainy-grey">{enquiry.email}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {getTypeLabel(enquiry.enquiry_type)}
                        </TableCell>
                        <TableCell className="text-white font-medium">{enquiry.subject}</TableCell>
                        <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {format(new Date(enquiry.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEnquiry(enquiry);
                                setIsDialogOpen(true);
                              }}
                              className="text-gold hover:text-gold-dark"
                            >
                              <Eye size={16} />
                            </Button>
                            {enquiry.status !== "resolved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: enquiry.id,
                                    status: "resolved",
                                  })
                                }
                                className="text-green-500 hover:text-green-400"
                              >
                                <CheckCircle2 size={16} />
                              </Button>
                            )}
                            {enquiry.status !== "closed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: enquiry.id,
                                    status: "closed",
                                  })
                                }
                                className="text-gray-500 hover:text-gray-400"
                              >
                                <XCircle size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </PanelCard>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-black border-steel-wool text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Enquiry Details</DialogTitle>
              <DialogDescription className="text-rainy-grey">
                Full details of the enquiry
              </DialogDescription>
            </DialogHeader>
            {selectedEnquiry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-rainy-grey text-sm">Name</label>
                    <p className="text-white">{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Email</label>
                    <p className="text-white">{selectedEnquiry.email}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Phone</label>
                    <p className="text-white">{selectedEnquiry.phone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Type</label>
                    <p className="text-white">{getTypeLabel(selectedEnquiry.enquiry_type)}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedEnquiry.status)}</div>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Date</label>
                    <p className="text-white">
                      {format(new Date(selectedEnquiry.created_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-rainy-grey text-sm">Subject</label>
                  <p className="text-white font-medium">{selectedEnquiry.subject}</p>
                </div>
                <div>
                  <label className="text-rainy-grey text-sm">Message</label>
                  <p className="text-white whitespace-pre-wrap bg-nero p-4 rounded-lg mt-1">
                    {selectedEnquiry.message}
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Select
                    value={selectedEnquiry.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate({
                        id: selectedEnquiry.id,
                        status: value as Enquiry["status"],
                      })
                    }
                  >
                    <SelectTrigger className="bg-nero border-steel-wool text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-steel-wool text-rainy-grey"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminEnquiries;
