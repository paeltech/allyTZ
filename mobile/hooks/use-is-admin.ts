import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkIsAdmin } from '../lib/admin';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (!cancelled) setIsAdmin(false);
          return;
        }

        const admin = await checkIsAdmin(session.user.id);
        if (!cancelled) setIsAdmin(admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void run();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}
