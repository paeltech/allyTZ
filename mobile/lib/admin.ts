import { supabase } from './supabase';

export type UserRole = 'admin' | 'moderator' | 'user';

export interface UserWithRole {
  user_id: string;
  full_name?: string | null;
  email: string;
  created_at: string;
  role: UserRole;
  role_created_at: string | null;
  phone_number?: string | null;
}

export async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  return !error && !!data;
}

export async function getPostAuthRoute(): Promise<'/admin' | '/home'> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return '/home';
  const isAdmin = await checkIsAdmin(session.user.id);
  return isAdmin ? '/admin' : '/home';
}

export async function fetchAdminUsers(): Promise<UserWithRole[]> {
  const { data, error } = await supabase.rpc('get_all_users_with_roles');

  if (error) {
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (rolesError) throw rolesError;

    const usersWithRoles: UserWithRole[] = (roles || []).map((role) => ({
      user_id: role.user_id,
      full_name: null,
      email: '',
      created_at: role.created_at,
      role: role.role as UserRole,
      role_created_at: role.created_at,
      phone_number: null,
    }));

    return enrichUsersWithProfiles(usersWithRoles);
  }

  return enrichUsersWithProfiles((data || []) as UserWithRole[]);
}

async function enrichUsersWithProfiles(users: UserWithRole[]): Promise<UserWithRole[]> {
  const userIds = users.map((u) => u.user_id);
  if (userIds.length === 0) return users;

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone_number, email')
    .in('id', userIds);

  if (profilesError || !profiles) return users;

  return users.map((user) => {
    const profile = profiles.find((p) => p.id === user.user_id);
    return {
      ...user,
      full_name: profile?.full_name ?? null,
      phone_number: profile?.phone_number ?? null,
      email: (user.email?.trim() && user.email) || (profile?.email ?? ''),
    };
  });
}
