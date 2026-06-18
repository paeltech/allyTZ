"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";

export type TradingTipContentKind = "tip" | "quote";

export interface TradingTip {
  id: string;
  title: string;
  body: string;
  content_kind: TradingTipContentKind;
  sort_order: number;
  active: boolean;
  created_at: string;
}

const emptyForm = {
  title: "",
  body: "",
  content_kind: "tip" as TradingTipContentKind,
  sort_order: 0,
  active: true,
};

const AdminTips: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TradingTip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: tips, isLoading } = useQuery<TradingTip[]>({
    queryKey: ["admin-trading-tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_tips")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as TradingTip[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("trading_tips")
          .update({
            title: payload.title.trim(),
            body: payload.body.trim(),
            content_kind: payload.content_kind,
            sort_order: payload.sort_order,
            active: payload.active,
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trading_tips").insert({
          title: payload.title.trim(),
          body: payload.body.trim(),
          content_kind: payload.content_kind,
          sort_order: payload.sort_order,
          active: payload.active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trading-tips"] });
      showSuccess(editing ? "Tip updated" : "Tip created");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      showError(error.message || "Save failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trading_tips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trading-tips"] });
      showSuccess("Tip deleted");
    },
    onError: (error: Error) => {
      showError(
        error.message ||
          "Delete failed (tip may be referenced by a daily dispatch record — deactivate instead)"
      );
    },
  });

  const openCreate = () => {
    setEditing(null);
    const nextOrder = tips?.length ? Math.max(...tips.map((t) => t.sort_order)) + 1 : 0;
    setForm({ ...emptyForm, sort_order: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (tip: TradingTip) => {
    setEditing(tip);
    setForm({
      title: tip.title,
      body: tip.body,
      content_kind: tip.content_kind,
      sort_order: tip.sort_order,
      active: tip.active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.body.trim()) {
      showError("Title and body are required");
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const filtered =
    tips?.filter((t) => {
      if (kindFilter !== "all" && t.content_kind !== kindFilter) return false;
      if (activeFilter === "active" && !t.active) return false;
      if (activeFilter === "inactive" && t.active) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    }) ?? [];

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-nero flex items-center justify-center border border-steel-wool">
                <Lightbulb className="text-gold" size={24} />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Tips & Quotes</CardTitle>
                <p className="text-rainy-grey text-sm mt-1">
                  Content shown in the mobile app and rotated for daily tip notifications.
                </p>
              </div>
            </div>
            <Button
              onClick={openCreate}
              className="bg-gold text-cursed-black hover:bg-gold/90 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add tip / quote
            </Button>
          </CardHeader>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rainy-grey" />
                <Input
                  placeholder="Search title or body..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-cursed-black border-steel-wool text-white"
                />
              </div>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger className="w-full lg:w-44 bg-cursed-black border-steel-wool text-white">
                  <SelectValue placeholder="Kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kinds</SelectItem>
                  <SelectItem value="tip">Tips</SelectItem>
                  <SelectItem value="quote">Quotes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full lg:w-44 bg-cursed-black border-steel-wool text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="inactive">Inactive only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <p className="text-rainy-grey py-8 text-center">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-rainy-grey py-8 text-center">No tips match your filters.</p>
            ) : (
              <div className="rounded-lg border border-steel-wool overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-transparent">
                      <TableHead className="text-rainy-grey">Order</TableHead>
                      <TableHead className="text-rainy-grey">Kind</TableHead>
                      <TableHead className="text-rainy-grey">Title</TableHead>
                      <TableHead className="text-rainy-grey max-w-md">Preview</TableHead>
                      <TableHead className="text-rainy-grey">Status</TableHead>
                      <TableHead className="text-rainy-grey">Created</TableHead>
                      <TableHead className="text-rainy-grey text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tip) => (
                      <TableRow key={tip.id} className="border-steel-wool">
                        <TableCell className="text-white font-mono text-sm">{tip.sort_order}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tip.content_kind === "quote"
                                ? "border-purple-400 text-purple-300"
                                : "border-gold text-gold"
                            }
                          >
                            {tip.content_kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-medium max-w-[200px] truncate">
                          {tip.title}
                        </TableCell>
                        <TableCell className="text-rainy-grey text-sm max-w-md truncate">
                          {tip.body}
                        </TableCell>
                        <TableCell>
                          {tip.active ? (
                            <Badge className="bg-green-700 text-white">Active</Badge>
                          ) : (
                            <Badge className="bg-steel-wool text-white">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-rainy-grey text-sm whitespace-nowrap">
                          {format(new Date(tip.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gold hover:text-gold hover:bg-nero"
                            onClick={() => openEdit(tip)}
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-nero"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this tip? If it is linked to a dispatch log, delete may fail — prefer setting inactive."
                                )
                              ) {
                                deleteMutation.mutate(tip.id);
                              }
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </PanelCard>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-nero border-steel-wool text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit tip / quote" : "New tip / quote"}</DialogTitle>
              <DialogDescription className="text-rainy-grey">
                Inactive items are hidden from the app but remain in the database.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="tip-title">Title</Label>
                <Input
                  id="tip-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-cursed-black border-steel-wool text-white"
                  placeholder="Short headline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tip-body">Body</Label>
                <Textarea
                  id="tip-body"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  className="bg-cursed-black border-steel-wool text-white min-h-[140px]"
                  placeholder="Full tip or quote text"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kind</Label>
                  <Select
                    value={form.content_kind}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, content_kind: v as TradingTipContentKind }))
                    }
                  >
                    <SelectTrigger className="bg-cursed-black border-steel-wool text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tip">Tip</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tip-order">Sort order</Label>
                  <Input
                    id="tip-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="bg-cursed-black border-steel-wool text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tip-active"
                  checked={form.active}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, active: c === true }))}
                />
                <Label htmlFor="tip-active" className="cursor-pointer">
                  Active (visible in app & eligible for daily rotation)
                </Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="border-steel-wool text-white hover:bg-cursed-black"
                onClick={() => {
                  setDialogOpen(false);
                  setEditing(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-gold text-cursed-black hover:bg-gold/90"
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminTips;
