"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/integrations/supabase/client";
import {
  getSignalPostAttachmentUrl,
  SIGNAL_POST_BUCKET,
} from "@shared/utils/signal-posts";

interface SignalPostAttachmentImageProps {
  attachmentPath: string;
  className?: string;
}

export default function SignalPostAttachmentImage({
  attachmentPath,
  className,
}: SignalPostAttachmentImageProps) {
  const [src, setSrc] = useState<string | null>(() => getSignalPostAttachmentUrl(attachmentPath));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(getSignalPostAttachmentUrl(attachmentPath));
    setFailed(false);
  }, [attachmentPath]);

  const handleError = async () => {
    if (failed) {
      setSrc(null);
      return;
    }
    setFailed(true);

    const { data, error } = await supabase.storage
      .from(SIGNAL_POST_BUCKET)
      .createSignedUrl(attachmentPath, 60 * 60);

    if (!error && data?.signedUrl) {
      setSrc(data.signedUrl);
      return;
    }

    setSrc(null);
  };

  if (!src) {
    return (
      <div className="mt-3 h-20 rounded-lg border border-steel-wool bg-nero/50 flex items-center justify-center text-rainy-grey text-xs">
        Image unavailable
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block mt-3">
      <img
        src={src}
        alt="Attachment"
        className={className ?? "w-full h-auto max-w-full rounded-lg border border-steel-wool object-contain"}
        onError={() => { void handleError(); }}
      />
    </a>
  );
}
