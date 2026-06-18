export interface UserDirectMessage {
  id: string;
  thread_user_id: string;
  author_id: string;
  body: string;
  attachment_path: string | null;
  author_display_name: string | null;
  created_at: string;
}
