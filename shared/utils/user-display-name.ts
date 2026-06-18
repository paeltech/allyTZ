export function resolveUserDisplayName(input: {
  profileFullName?: string | null;
  userMetadata?: Record<string, unknown> | null;
  email?: string | null;
  fallback?: string;
}): string {
  const fromProfile = input.profileFullName?.trim();
  if (fromProfile) return fromProfile;

  const meta = input.userMetadata;
  const fromFullName =
    typeof meta?.full_name === 'string' ? meta.full_name.trim() : '';
  if (fromFullName) return fromFullName;

  const first =
    typeof meta?.first_name === 'string' ? meta.first_name.trim() : '';
  const last =
    typeof meta?.last_name === 'string' ? meta.last_name.trim() : '';
  const fromParts = [first, last].filter(Boolean).join(' ');
  if (fromParts) return fromParts;

  const emailLocal = input.email?.split('@')[0]?.trim();
  if (emailLocal) return emailLocal;

  return input.fallback ?? 'Trader';
}

export function formatDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
