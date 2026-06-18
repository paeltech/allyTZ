import React, { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useIsAdmin } from '../hooks/use-is-admin';

const ADMIN_ALLOWED_SEGMENTS = new Set(['admin', 'auth', '']);

/**
 * Redirects signed-in admins away from regular user screens.
 * Admins only use /admin/* routes on mobile.
 */
export function UserRouteGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const { isAdmin, loading } = useIsAdmin();

  useEffect(() => {
    if (loading || !isAdmin) return;

    const first = segments[0] ?? '';
    if (ADMIN_ALLOWED_SEGMENTS.has(first)) return;

    router.replace('/admin');
  }, [isAdmin, loading, segments]);

  return <>{children}</>;
}
