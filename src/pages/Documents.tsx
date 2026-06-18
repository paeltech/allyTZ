"use client";

import React, { useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Search, Eye, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";
import DocumentViewer from "@/components/documents/DocumentViewer";
import {
  PANEL_DOCUMENT_CATEGORIES,
  type PanelDocument,
} from "@shared/types/document";
import { formatDocumentFileSize } from "@shared/utils/document-view";

const Documents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewingDoc, setViewingDoc] = useState<PanelDocument | null>(null);

  const { data: documents, isLoading, error } = useQuery<PanelDocument[]>({
    queryKey: ["panel-documents"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("panel_documents")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      return (data || []) as PanelDocument[];
    },
  });

  const filtered = useMemo(() => {
    return (
      documents?.filter((doc) => {
        if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.description || "").toLowerCase().includes(q)
        );
      }) ?? []
    );
  }, [documents, categoryFilter, searchQuery]);

  const categoryLabel = (value: string) =>
    PANEL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label || value;

  const tableMissing =
    error instanceof Error && error.message.includes("panel_documents");

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-nero flex items-center justify-center border border-steel-wool shrink-0">
                <FolderOpen className="text-gold" size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Documents</h1>
                <p className="text-rainy-grey text-sm mt-1">
                  View guides, reports, and resources shared by the AllyTZ team. View-only — downloads are not available.
                </p>
              </div>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rainy-grey" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-cursed-black border-steel-wool text-white"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-cursed-black border-steel-wool text-white">
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
            </div>

            {tableMissing ? (
              <p className="text-rainy-grey py-8 text-center">
                Documents are not available yet. Please run the latest database migration.
              </p>
            ) : isLoading ? (
              <p className="text-rainy-grey py-8 text-center">Loading documents…</p>
            ) : filtered.length === 0 ? (
              <p className="text-rainy-grey py-8 text-center">No documents available yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((doc) => (
                  <PanelCard
                    key={doc.id}
                    className="hover:border-gold/40 transition-colors cursor-pointer group"
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-nero border border-steel-wool flex items-center justify-center shrink-0">
                          <FileText className="text-gold" size={20} />
                        </div>
                        <Badge variant="outline" className="border-gold/50 text-gold text-xs">
                          {categoryLabel(doc.category)}
                        </Badge>
                      </div>
                      <h3 className="text-white font-semibold mb-1 line-clamp-2">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-rainy-grey text-sm mb-3 line-clamp-2 flex-1">
                          {doc.description}
                        </p>
                      )}
                      <div className="text-rainy-grey text-xs mb-4 space-y-1">
                        <p>{formatDocumentFileSize(doc.file_size_bytes)}</p>
                        <p>{format(new Date(doc.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <Button
                        className="w-full bg-gold text-cursed-black hover:bg-gold/90"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View document
                      </Button>
                    </CardContent>
                  </PanelCard>
                ))}
              </div>
            )}
          </CardContent>
        </PanelCard>

        <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
          <DialogContent className="bg-nero border-steel-wool text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingDoc?.title}</DialogTitle>
              <DialogDescription className="text-rainy-grey">
                {viewingDoc?.description || "View-only document"}
              </DialogDescription>
            </DialogHeader>
            {viewingDoc && (
              <DocumentViewer
                documentId={viewingDoc.id}
                mimeType={viewingDoc.mime_type}
                title={viewingDoc.title}
              />
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PageTransition>
  );
};

export default Documents;
