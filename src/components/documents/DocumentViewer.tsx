"use client";

import React, { useEffect, useState } from "react";
import { Loader2, FileWarning } from "lucide-react";
import {
  getPanelDocumentViewHeaders,
  getPanelDocumentViewUrl,
  isImageMimeType,
  isPdfMimeType,
} from "@shared/utils/document-view";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

interface DocumentViewerProps {
  documentId: string;
  mimeType: string;
  title: string;
  className?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  mimeType,
  title,
  className = "",
}) => {
  const { session } = useSupabaseSession();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked = false;
    let blobUrl: string | null = null;

    const load = async () => {
      if (!session?.access_token) {
        setError("You must be signed in to view this document.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setObjectUrl(null);

      try {
        const response = await fetch(getPanelDocumentViewUrl(documentId), {
          headers: getPanelDocumentViewHeaders(session.access_token),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load document");
        }

        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
        if (!revoked) {
          setObjectUrl(blobUrl);
        }
      } catch (err) {
        if (!revoked) {
          setError(err instanceof Error ? err.message : "Failed to load document");
        }
      } finally {
        if (!revoked) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      revoked = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [documentId, session?.access_token]);

  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[320px] bg-cursed-black rounded-lg border border-steel-wool ${className}`}>
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 min-h-[320px] bg-cursed-black rounded-lg border border-steel-wool p-6 text-center ${className}`}>
        <FileWarning className="w-10 h-10 text-rainy-grey" />
        <p className="text-rainy-grey">{error || "Unable to display this document."}</p>
      </div>
    );
  }

  if (isImageMimeType(mimeType)) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-steel-wool bg-cursed-black select-none ${className}`}
        onContextMenu={preventContextMenu}
      >
        <img
          src={objectUrl}
          alt={title}
          className="w-full h-auto max-h-[75vh] object-contain mx-auto pointer-events-none"
          draggable={false}
        />
      </div>
    );
  }

  if (isPdfMimeType(mimeType)) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-steel-wool bg-cursed-black select-none ${className}`}
        onContextMenu={preventContextMenu}
      >
        <iframe
          src={`${objectUrl}#toolbar=0&navpanes=0`}
          title={title}
          className="w-full h-[75vh] border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 min-h-[200px] bg-cursed-black rounded-lg border border-steel-wool p-6 text-center ${className}`}>
      <FileWarning className="w-10 h-10 text-rainy-grey" />
      <p className="text-rainy-grey">This file type cannot be previewed in the browser.</p>
    </div>
  );
};

export default DocumentViewer;
