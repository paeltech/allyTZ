export type PanelDocumentCategory =
  | "general"
  | "guides"
  | "reports"
  | "education";

export interface PanelDocument {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  category: PanelDocumentCategory;
  sort_order: number;
  published: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const PANEL_DOCUMENT_CATEGORIES: { value: PanelDocumentCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "guides", label: "Guides" },
  { value: "reports", label: "Reports" },
  { value: "education", label: "Education" },
];

export const PANEL_DOCUMENT_BUCKET = "panel-documents";

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;
