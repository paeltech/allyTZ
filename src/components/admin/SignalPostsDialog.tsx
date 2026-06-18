"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, ImagePlus, X, Lock, Users, Send } from "lucide-react";
import { format } from "date-fns";
import supabase from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { SignalPost, SignalPostAudience, SignalPostType } from "@shared/types/signal";
import {
  SIGNAL_POST_AUDIENCE_OPTIONS,
  SIGNAL_POST_MAX_IMAGE_BYTES,
  SIGNAL_POST_TYPE_OPTIONS,
  buildSignalPostAttachmentPath,
  getSignalPostAudienceLabel,
  getSignalPostTypeLabel,
} from "@shared/utils/signal-posts";
import {
  extensionForSignalPostMime,
  normalizeSignalPostImageMime,
  uploadSignalPostImage,
} from "@shared/utils/signal-post-image";
import SignalPostAttachmentImage from "@/components/admin/SignalPostAttachmentImage";

interface SignalPostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signalId: string | null;
  tradingPair?: string;
}

export default function SignalPostsDialog({
  open,
  onOpenChange,
  signalId,
  tradingPair,
}: SignalPostsDialogProps) {
  const [posts, setPosts] = useState<SignalPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postType, setPostType] = useState<SignalPostType>("update");
  const [audience, setAudience] = useState<SignalPostAudience>("all_users");
  const [summary, setSummary] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadPosts = async () => {
    if (!signalId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("signal_posts")
        .select("*")
        .eq("signal_id", signalId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load posts";
      showError(message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && signalId) {
      void loadPosts();
    } else if (!open) {
      resetForm();
      setPosts([]);
    }
  }, [open, signalId]);

  const resetForm = () => {
    setPostType("update");
    setAudience("all_users");
    setSummary("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }
    if (file.size > SIGNAL_POST_MAX_IMAGE_BYTES) {
      showError("Image must be under 5 MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!signalId) return;
    const trimmed = summary.trim();
    if (!trimmed) {
      showError("Summary is required");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showError("You must be signed in");
        return;
      }

      let attachmentPath: string | null = null;

      if (imageFile) {
        const normalizedMime = normalizeSignalPostImageMime(imageFile.type);
        const ext = extensionForSignalPostMime(normalizedMime);
        attachmentPath = buildSignalPostAttachmentPath(session.user.id, signalId, ext);
        await uploadSignalPostImage(supabase, attachmentPath, imageFile, normalizedMime);
      }

      const displayName =
        session.user.user_metadata?.full_name?.trim() ||
        session.user.email?.split("@")[0] ||
        "Admin";

      const { error } = await supabase.from("signal_posts").insert({
        signal_id: signalId,
        author_id: session.user.id,
        post_type: postType,
        audience,
        summary: trimmed,
        attachment_path: attachmentPath,
        author_display_name: displayName,
      });

      if (error) throw error;

      showSuccess("Post published");
      resetForm();
      await loadPosts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish post";
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-steel-wool text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gold" />
            Discussion {tradingPair ? `— ${tradingPair}` : ""}
          </DialogTitle>
          <DialogDescription className="text-rainy-grey">
            Post updates or feedback for users, or reply privately. Users can also post feedback and questions here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border border-steel-wool bg-nero/50 p-4 space-y-4">
            <h4 className="text-sm font-medium text-gold uppercase tracking-wide">New post</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-rainy-grey">Type</Label>
                <Select value={postType} onValueChange={(v) => setPostType(v as SignalPostType)}>
                  <SelectTrigger className="bg-black border-steel-wool text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-steel-wool">
                    {SIGNAL_POST_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-rainy-grey">Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as SignalPostAudience)}>
                  <SelectTrigger className="bg-black border-steel-wool text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-steel-wool">
                    {SIGNAL_POST_AUDIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-rainy-grey">
              {SIGNAL_POST_AUDIENCE_OPTIONS.find((o) => o.value === audience)?.description}
            </p>

            <div className="space-y-2">
              <Label className="text-rainy-grey">Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Share an update, feedback, or answer a user question..."
                className="bg-black border-steel-wool text-white min-h-[96px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-rainy-grey">Attachment (optional, images only)</Label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg border border-steel-wool"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2 h-7 w-7 border-steel-wool"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-steel-wool rounded-lg p-3 text-rainy-grey hover:border-gold hover:text-gold transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  <span className="text-sm">Add image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            <Button
              type="button"
              className="bg-gold text-cursed-black hover:bg-gold-dark"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gold uppercase tracking-wide">
              Posts ({posts.length})
            </h4>
            {loading ? (
              <p className="text-rainy-grey text-sm py-4 text-center">Loading posts...</p>
            ) : posts.length === 0 ? (
              <p className="text-rainy-grey text-sm">No posts yet for this signal.</p>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {posts.map((post) => {
                  const isPrivate = post.audience === "admin_only";
                  return (
                    <div
                      key={post.id}
                      className="rounded-lg border border-steel-wool bg-nero/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-white font-medium">
                            {post.author_display_name || "User"}
                          </p>
                          <p className="text-rainy-grey text-xs">
                            {format(new Date(post.created_at), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Badge variant="outline" className="border-gold text-gold text-xs">
                            {getSignalPostTypeLabel(post.post_type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs flex items-center gap-1 ${
                              isPrivate
                                ? "border-amber-500 text-amber-400"
                                : "border-blue-500 text-blue-400"
                            }`}
                          >
                            {isPrivate ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {getSignalPostAudienceLabel(post.audience)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-white text-sm whitespace-pre-wrap">{post.summary}</p>
                      {post.attachment_path ? (
                        <SignalPostAttachmentImage attachmentPath={post.attachment_path} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-steel-wool text-rainy-grey"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
