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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Handshake, Search, Filter, Eye, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";

interface Collaboration {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  collaboration_type: string;
  website: string | null;
  subject: string;
  message: string;
  status: "pending" | "reviewing" | "approved" | "rejected" | "closed";
  created_at: string;
  updated_at: string;
}

const AdminCollaborations: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: collaborations, isLoading } = useQuery<Collaboration[]>({
    queryKey: ["admin-collaborations", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("collaborations")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Collaboration["status"] }) => {
      const { error } = await supabase
        .from("collaborations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collaborations"] });
      showSuccess("Collaboration status updated successfully");
      if (selectedCollaboration) {
        setSelectedCollaboration({
          ...selectedCollaboration,
          status: updateStatusMutation.variables?.status || selectedCollaboration.status,
        });
      }
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update status");
    },
  });

  const filteredCollaborations = collaborations?.filter((collab) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collab.name.toLowerCase().includes(query) ||
      collab.email.toLowerCase().includes(query) ||
      collab.company.toLowerCase().includes(query) ||
      collab.subject.toLowerCase().includes(query) ||
      collab.message.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: Collaboration["status"]) => {
    const variants: Record<
      Collaboration["status"],
      { label: string; className: string }
    > = {
      pending: { label: "Pending", className: "bg-yellow-600 text-white" },
      reviewing: { label: "Reviewing", className: "bg-blue-600 text-white" },
      approved: { label: "Approved", className: "bg-green-600 text-white" },
      rejected: { label: "Rejected", className: "bg-red-600 text-white" },
      closed: { label: "Closed", className: "bg-gray-600 text-white" },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      content: "Content Creation",
      affiliate: "Affiliate",
      education: "Education",
      technology: "Technology",
      events: "Events",
      media: "Media",
      influencer: "Influencer",
      strategic: "Strategic",
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
              <Handshake className="text-gold" size={24} />
              <div>
                <h1 className="text-2xl font-semibold text-white">Manage Collaborations</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  Review and manage partnership and collaboration requests
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by name, email, company..."
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
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
            ) : filteredCollaborations?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">No collaborations found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-nero/50">
                      <TableHead className="text-white">Name</TableHead>
                      <TableHead className="text-white">Company</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollaborations?.map((collab) => (
                      <TableRow key={collab.id} className="border-steel-wool hover:bg-nero/50">
                        <TableCell className="text-rainy-grey">{collab.name}</TableCell>
                        <TableCell className="text-white font-medium">{collab.company}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {getTypeLabel(collab.collaboration_type)}
                        </TableCell>
                        <TableCell className="text-rainy-grey">{collab.email}</TableCell>
                        <TableCell>{getStatusBadge(collab.status)}</TableCell>
                        <TableCell className="text-rainy-grey">
                          {format(new Date(collab.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCollaboration(collab);
                                setIsDialogOpen(true);
                              }}
                              className="text-gold hover:text-gold-dark"
                            >
                              <Eye size={16} />
                            </Button>
                            {collab.status !== "approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: collab.id,
                                    status: "approved",
                                  })
                                }
                                className="text-green-500 hover:text-green-400"
                              >
                                <CheckCircle2 size={16} />
                              </Button>
                            )}
                            {collab.status !== "rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: collab.id,
                                    status: "rejected",
                                  })
                                }
                                className="text-red-500 hover:text-red-400"
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
              <DialogTitle className="text-white">Collaboration Details</DialogTitle>
              <DialogDescription className="text-rainy-grey">
                Full details of the collaboration request
              </DialogDescription>
            </DialogHeader>
            {selectedCollaboration && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-rainy-grey text-sm">Name</label>
                    <p className="text-white">{selectedCollaboration.name}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Email</label>
                    <p className="text-white">{selectedCollaboration.email}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Phone</label>
                    <p className="text-white">{selectedCollaboration.phone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Company</label>
                    <p className="text-white font-medium">{selectedCollaboration.company}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Type</label>
                    <p className="text-white">{getTypeLabel(selectedCollaboration.collaboration_type)}</p>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Website</label>
                    {selectedCollaboration.website ? (
                      <a
                        href={selectedCollaboration.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline flex items-center gap-1"
                      >
                        {selectedCollaboration.website}
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <p className="text-white">N/A</p>
                    )}
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedCollaboration.status)}</div>
                  </div>
                  <div>
                    <label className="text-rainy-grey text-sm">Date</label>
                    <p className="text-white">
                      {format(new Date(selectedCollaboration.created_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-rainy-grey text-sm">Subject</label>
                  <p className="text-white font-medium">{selectedCollaboration.subject}</p>
                </div>
                <div>
                  <label className="text-rainy-grey text-sm">Message</label>
                  <p className="text-white whitespace-pre-wrap bg-nero p-4 rounded-lg mt-1">
                    {selectedCollaboration.message}
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Select
                    value={selectedCollaboration.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate({
                        id: selectedCollaboration.id,
                        status: value as Collaboration["status"],
                      })
                    }
                  >
                    <SelectTrigger className="bg-nero border-steel-wool text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
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

export default AdminCollaborations;
