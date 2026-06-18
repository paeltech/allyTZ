"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import PanelCard from "@/components/dashboard/PanelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Search, Shield, UserCheck, User, Mail, Phone, Calendar, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { PageTransition } from "@/lib/animations";

interface UserWithRole {
  user_id: string;
  full_name?: string | null;
  email: string;
  created_at: string;
  role: "admin" | "moderator" | "user";
  role_created_at: string | null;
  phone_number?: string | null;
}

const AdminUsers: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ["admin-all-users", roleFilter],
    queryFn: async () => {
      // Call the database function to get all users with their roles
      const { data, error } = await supabase.rpc("get_all_users_with_roles");

      if (error) {
        // If function doesn't exist, fall back to manual query
        console.warn("get_all_users_with_roles function not found, using fallback query:", error);
        
        // Fallback: Get all users from user_roles (which should now have all users after migration)
        let query = supabase.from("user_roles").select("*").order("created_at", { ascending: false });

        if (roleFilter !== "all") {
          query = query.eq("role", roleFilter);
        }

        const { data: roles, error: rolesError } = await query;
        if (rolesError) throw rolesError;

        // Get user emails from auth.users (we'll need to use a service role or admin function for this)
        // For now, return users with roles and mark emails as unavailable
        const usersWithRoles = (roles || []).map((role: { user_id: string; created_at: string; role: string }) => ({
          user_id: role.user_id,
          full_name: null,
          email: "", // Email not available in fallback without service role
          created_at: role.created_at,
          role: role.role,
          role_created_at: role.created_at,
          phone_number: null,
        }));

        // Fetch full_name and phone_number from user_profiles
        const userIds = usersWithRoles.map((u: UserWithRole) => u.user_id);
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from("user_profiles")
            .select("id, full_name, phone_number, email")
            .in("id", userIds);

          if (!profilesError && profiles) {
            return usersWithRoles.map((user: UserWithRole) => {
              const profile = profiles.find((p) => p.id === user.user_id);
              return {
                ...user,
                full_name: profile?.full_name ?? null,
                phone_number: profile?.phone_number ?? null,
                email: (user.email?.trim() && user.email) || (profile?.email ?? ""),
              };
            });
          }
        }

        return usersWithRoles;
      }

      // Filter by role if needed
      let filteredData = data || [];
      if (roleFilter !== "all") {
        filteredData = filteredData.filter((user: UserWithRole) => user.role === roleFilter);
      }

      // Fetch full_name, phone_number, email from user_profiles (email in case RPC omits it)
      const userIds = filteredData.map((user: UserWithRole) => user.user_id);
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, full_name, phone_number, email")
          .in("id", userIds);

        if (!profilesError && profiles) {
          filteredData = filteredData.map((user: UserWithRole) => {
            const profile = profiles.find((p) => p.id === user.user_id);
            return {
              ...user,
              full_name: profile?.full_name ?? user.full_name ?? null,
              phone_number: profile?.phone_number ?? user.phone_number ?? null,
              email: (user.email?.trim() && user.email) || (profile?.email ?? user.email ?? ""),
            };
          });
        }
      }

      return filteredData as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "moderator" | "user";
    }) => {
      // Check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      showSuccess("User role updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update user role");
    },
  });

  const filteredUsers = users?.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.user_id.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone_number?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === "admin").length || 0,
    moderators: users?.filter((u) => u.role === "moderator").length || 0,
    regularUsers: users?.filter((u) => u.role === "user").length || 0,
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      admin: { 
        label: "Admin", 
        className: "bg-red-600/90 hover:bg-red-600 text-white border-red-500/50 shadow-sm",
        icon: <Shield className="h-3 w-3 mr-1" />
      },
      moderator: { 
        label: "Moderator", 
        className: "bg-blue-600/90 hover:bg-blue-600 text-white border-blue-500/50 shadow-sm",
        icon: <UserCheck className="h-3 w-3 mr-1" />
      },
      user: { 
        label: "User", 
        className: "bg-gray-600/90 hover:bg-gray-600 text-white border-gray-500/50 shadow-sm",
        icon: <Users className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[role] || variants.user;
    return (
      <Badge className={`${variant.className} font-semibold px-2.5 py-1 border flex items-center w-fit`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <PanelCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Users className="text-gold" size={24} />
                <div>
                  <h1 className="text-2xl font-semibold text-white">User Management</h1>
                  <p className="text-rainy-grey text-sm mt-1">
                    Manage user roles and permissions
                  </p>
                </div>
              </div>
              {users && users.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg border border-gold/20">
                  <Users className="h-4 w-4 text-gold" />
                  <span className="text-white font-semibold">{stats.total}</span>
                  <span className="text-rainy-grey text-sm">Total Users</span>
                </div>
              )}
            </div>

            {/* Statistics Grid */}
            {users && users.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-nero border border-steel-wool rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-gold" size={18} />
                    <span className="text-rainy-grey text-sm">Total Users</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-nero border border-steel-wool rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-red-500" size={18} />
                    <span className="text-rainy-grey text-sm">Admins</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.admins}</div>
                </div>
                <div className="bg-nero border border-steel-wool rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="text-blue-500" size={18} />
                    <span className="text-rainy-grey text-sm">Moderators</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.moderators}</div>
                </div>
                <div className="bg-nero border border-steel-wool rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-gray-400" size={18} />
                    <span className="text-rainy-grey text-sm">Regular Users</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.regularUsers}</div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rainy-grey" size={18} />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-nero border-steel-wool text-white">
                  <Shield className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </PanelCard>

        <PanelCard>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-rainy-grey">Loading users...</div>
            ) : filteredUsers?.length === 0 ? (
              <div className="p-8 text-center text-rainy-grey">
                <Users className="mx-auto mb-4 text-rainy-grey" size={48} />
                <p className="text-lg font-medium text-white mb-2">No users found</p>
                <p className="text-sm">
                  {searchQuery ? "Try adjusting your search criteria" : "No users in the system yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-steel-wool/50 bg-nero/30 backdrop-blur-sm">
                <div className="min-w-full">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-steel-wool bg-nero/90 backdrop-blur-sm hover:bg-nero/95 sticky top-0 z-10 shadow-lg">
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gold" />
                            <span>User ID</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gold" />
                            <span>Full name</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gold" />
                            <span>Email</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gold" />
                            <span>Phone</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gold" />
                            <span>Role</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gold" />
                            <span>Created</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        <TableRow 
                          key={user.user_id} 
                          className="border-steel-wool/50 hover:bg-nero/60 transition-all duration-200 group"
                        >
                          <TableCell className="text-white py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <span className="font-mono text-sm font-medium">
                                {user.user_id.substring(0, 8)}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white py-4 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-rainy-grey" />
                              <span className={user.full_name ? "" : "text-rainy-grey italic"}>
                                {user.full_name || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-rainy-grey" />
                              <span className={user.email ? "" : "text-rainy-grey italic"}>
                                {user.email || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-rainy-grey" />
                              <span className={user.phone_number ? "" : "text-rainy-grey italic"}>
                                {user.phone_number || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-rainy-grey py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-white/90">
                                {format(new Date(user.created_at), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(user.created_at), "HH:mm:ss")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(value) =>
                                  updateRoleMutation.mutate({
                                    userId: user.user_id,
                                    role: value as "admin" | "moderator" | "user",
                                  })
                                }
                              >
                                <SelectTrigger className="w-[140px] bg-nero border-steel-wool text-white text-xs h-8 hover:border-gold/50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </PanelCard>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminUsers;
