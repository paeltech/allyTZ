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
import { FileText, Plus, Pencil, Trash2, Search, Upload, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import DocumentViewer from "@/components/documents/DocumentViewer";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  PANEL_DOCUMENT_BUCKET,
  PANEL_DOCUMENT_CATEGORIES,
  type PanelDocument,
  type PanelDocumentCategory,
} from "@shared/types/document";
import { formatDocumentFileSize } from "@shared/utils/document-view";

const emptyForm = {
  title: "",
  description: "",
  category: "general" as PanelDocumentCategory,
  sort_order: 0,
  published: true,
};

const AdminDocuments: React.FC = () => {
  const { session } = useSupabaseSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PanelDocument | null>(null);
  const [editing, setEditing] = useState<PanelDocument | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<PanelDocument[]>({
    queryKey: ["admin-panel-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("panel_documents")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PanelDocument[];
    },
  });

  const uploadFile = async (selected: File): Promise<{
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
  }> => {
    const fileExt = selected.name.split(".").pop() || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PANEL_DOCUMENT_BUCKET)
      .upload(filePath, selected, {
        cacheControl: "3600",
        upsert: false,
        contentType: selected.type,
      });

    if (uploadError) throw uploadError;

    return {
      file_path: filePath,
      file_name: selected.name,
      mime_type: selected.type,
      file_size_bytes: selected.size,
    };
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string; file?: File | null }) => {
      setUploading(true);
      try {
        let fileMeta: {
          file_path: string;
          file_name: string;
          mime_type: string;
          file_size_bytes: number;
        } | null = null;

        if (payload.file) {
          fileMeta = await uploadFile(payload.file);
        }

        if (payload.id) {
          const updatePayload: Record<string, unknown> = {
            title: payload.title.trim(),
            description: payload.description.trim() || null,
            category: payload.category,
            sort_order: payload.sort_order,
            published: payload.published,
          };

          if (fileMeta) {
            const existing = documents?.find((d) => d.id === payload.id);
            if (existing) {
              await supabase.storage.from(PANEL_DOCUMENT_BUCKET).remove([existing.file_path]);
            }
            Object.assign(updatePayload, fileMeta);
          }

          const { error } = await supabase
            .from("panel_documents")
            .update(updatePayload)
            .eq("id", payload.id);
          if (error) throw error;
        } else {
          if (!fileMeta) {
            throw new Error("Please select a file to upload");
          }

          const { error } = await supabase.from("panel_documents").insert({
            title: payload.title.trim(),
            description: payload.description.trim() || null,
            category: payload.category,
            sort_order: payload.sort_order,
            published: payload.published,
            uploaded_by: session?.user?.id ?? null,
            ...fileMeta,
          });
          if (error) throw error;
        }
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-panel-documents"] });
      queryClient.invalidateQueries({ queryKey: ["panel-documents"] });
      showSuccess(editing ? "Document updated" : "Document uploaded");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFile(null);
    },
    onError: (error: Error) => {
      showError(error.message || "Save failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: PanelDocument) => {
      await supabase.storage.from(PANEL_DOCUMENT_BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from("panel_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-panel-documents"] });
      queryClient.invalidateQueries({ queryKey: ["panel-documents"] });
      showSuccess("Document deleted");
    },
    onError: (error: Error) => {
      showError(error.message || "Delete failed");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFile(null);
    const nextOrder = documents?.length
      ? Math.max(...documents.map((d) => d.sort_order)) + 1
      : 0;
    setForm({ ...emptyForm, sort_order: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (doc: PanelDocument) => {
    setEditing(doc);
    setFile(null);
    setForm({
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      sort_order: doc.sort_order,
      published: doc.published,
    });
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (
      !ALLOWED_DOCUMENT_MIME_TYPES.includes(
        selected.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number]
      )
    ) {
      showError("Supported formats: PDF and images (PNG, JPG, WebP, GIF)");
      return;
    }

    if (selected.size > MAX_DOCUMENT_SIZE_BYTES) {
      showError("File must be 20MB or smaller");
      return;
    }

    setFile(selected);
    if (!form.title.trim()) {
      const baseName = selected.name.replace(/\.[^.]+$/, "");
      setForm((f) => ({ ...f, title: baseName }));
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      showError("Title is required");
      return;
    }
    if (!editing && !file) {
      showError("Please select a file to upload");
      return;
    }
    saveMutation.mutate({ ...form, id: editing?.id, file });
  };

  const filtered =
    documents?.filter((doc) => {
      if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
      if (publishedFilter === "published" && !doc.published) return false;
      if (publishedFilter === "draft" && doc.published) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        (doc.description || "").toLowerCase().includes(q) ||
        doc.file_name.toLowerCase().includes(q)
      );
    }) ?? [];

  const categoryLabel = (value: string) =>
    PANEL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label || value;

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-nero flex items-center justify-center border border-steel-wool">
                <FileText className="text-gold" size={24} />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Documents</CardTitle>
                <p className="text-rainy-grey text-sm mt-1">
                  Upload PDFs and images for users to view in-app (no direct downloads).
                </p>
              </div>
            </div>
            <Button
              onClick={openCreate}
              className="bg-gold text-cursed-black hover:bg-gold/90 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload document
            </Button>
          </CardHeader>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rainy-grey" />
                <Input
                  placeholder="Search title, description, or filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-cursed-black border-steel-wool text-white"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-44 bg-cursed-black border-steel-wool text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {PANEL_DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-full lg:w-44 bg-cursed-black border-steel-wool text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <p className="text-rainy-grey py-8 text-center">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-rainy-grey py-8 text-center">No documents match your filters.</p>
            ) : (
              <div className="rounded-lg border border-steel-wool overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-steel-wool hover:bg-transparent">
                      <TableHead className="text-rainy-grey">Order</TableHead>
                      <TableHead className="text-rainy-grey">Title</TableHead>
                      <TableHead className="text-rainy-grey">Category</TableHead>
                      <TableHead className="text-rainy-grey">File</TableHead>
                      <TableHead className="text-rainy-grey">Size</TableHead>
                      <TableHead className="text-rainy-grey">Status</TableHead>
                      <TableHead className="text-rainy-grey">Uploaded</TableHead>
                      <TableHead className="text-rainy-grey text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((doc) => (
                      <TableRow key={doc.id} className="border-steel-wool">
                        <TableCell className="text-white font-mono text-sm">{doc.sort_order}</TableCell>
                        <TableCell className="text-white font-medium max-w-[200px]">
                          <div className="truncate">{doc.title}</div>
                          {doc.description && (
                            <div className="text-rainy-grey text-xs truncate max-w-[200px]">
                              {doc.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gold text-gold">
                            {categoryLabel(doc.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-rainy-grey text-sm max-w-[160px] truncate">
                          {doc.file_name}
                        </TableCell>
                        <TableCell className="text-rainy-grey text-sm whitespace-nowrap">
                          {formatDocumentFileSize(doc.file_size_bytes)}
                        </TableCell>
                        <TableCell>
                          {doc.published ? (
                            <Badge className="bg-green-700 text-white">Published</Badge>
                          ) : (
                            <Badge className="bg-steel-wool text-white">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-rainy-grey text-sm whitespace-nowrap">
                          {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gold hover:text-gold hover:bg-nero"
                            onClick={() => setPreviewDoc(doc)}
                            aria-label="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gold hover:text-gold hover:bg-nero"
                            onClick={() => openEdit(doc)}
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-nero"
                            onClick={() => {
                              if (window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
                                deleteMutation.mutate(doc);
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
              <DialogTitle>{editing ? "Edit document" : "Upload document"}</DialogTitle>
              <DialogDescription className="text-rainy-grey">
                Users can view published documents in the app. Downloads are disabled.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Title</Label>
                <Input
                  id="doc-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-cursed-black border-steel-wool text-white"
                  placeholder="Document title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-description">Description (optional)</Label>
                <Textarea
                  id="doc-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="bg-cursed-black border-steel-wool text-white min-h-[80px]"
                  placeholder="Short summary for users"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v as PanelDocumentCategory }))
                    }
                  >
                    <SelectTrigger className="bg-cursed-black border-steel-wool text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PANEL_DOCUMENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-order">Sort order</Label>
                  <Input
                    id="doc-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="bg-cursed-black border-steel-wool text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-file">File {editing ? "(leave empty to keep current)" : ""}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="doc-file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="bg-cursed-black border-steel-wool text-white file:text-gold file:bg-transparent file:border-0"
                  />
                  <Upload className="w-5 h-5 text-gold shrink-0" />
                </div>
                {file && (
                  <p className="text-rainy-grey text-sm">
                    Selected: {file.name} ({formatDocumentFileSize(file.size)})
                  </p>
                )}
                {editing && !file && (
                  <p className="text-rainy-grey text-sm">Current: {editing.file_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="doc-published"
                  checked={form.published}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, published: c === true }))}
                />
                <Label htmlFor="doc-published" className="cursor-pointer">
                  Published (visible to users)
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
                  setFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || uploading}
                className="bg-gold text-cursed-black hover:bg-gold/90"
              >
                {saveMutation.isPending || uploading ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="bg-nero border-steel-wool text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewDoc?.title}</DialogTitle>
              <DialogDescription className="text-rainy-grey">
                Admin preview — same view-only experience as users.
              </DialogDescription>
            </DialogHeader>
            {previewDoc && (
              <DocumentViewer
                documentId={previewDoc.id}
                mimeType={previewDoc.mime_type}
                title={previewDoc.title}
              />
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminDocuments;
