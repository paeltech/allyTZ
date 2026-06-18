export function formatSupabaseError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    if (parts.length) return parts.join(' — ');
    if (e.code === '42P01') return 'Database table missing. Apply the latest Supabase migrations.';
    if (e.code === 'PGRST204') return 'Database schema outdated. Apply the latest Supabase migrations.';
    if (e.message?.toLowerCase().includes('bucket not found')) {
      return 'Storage bucket missing. Apply migration 20260620120000_ensure_mobile_admin_infrastructure.sql in Supabase.';
    }
  }
  return 'Request failed';
}
