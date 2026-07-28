import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getAllProfiles, updateUserRole, type UserRole, type UserProfile } from "@/lib/admin";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — SafeReport AI Admin" },
      { name: "description", content: "Manage users and their roles." },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: getAllProfiles,
  });

  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User role updated successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    },
  });

  const filtered = profiles.filter((p: UserProfile) => {
    const matchesSearch =
      !search ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot change your own role");
      return;
    }
    mutation.mutate({ userId, role: newRole });
  };

  return (
    <AdminShell title="User Management" subtitle="View and manage all registered users">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 max-w-sm rounded-xl"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-11 w-40 rounded-xl">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((profile: UserProfile) => (
                <tr
                  key={profile.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {profile.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {profile.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        profile.role === "super_admin"
                          ? "bg-red-100 text-red-700"
                          : profile.role === "admin"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {profile.role === "super_admin"
                        ? "Super Admin"
                        : profile.role === "admin"
                          ? "Admin"
                          : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {profile.id === currentUser?.id ? (
                      <span className="text-xs text-muted-foreground">You</span>
                    ) : (
                      <Select
                        value={profile.role}
                        onValueChange={(val) =>
                          handleRoleChange(profile.id, val as UserRole)
                        }
                      >
                        <SelectTrigger className="h-8 w-32 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No users found.
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Total: {filtered.length} user{filtered.length !== 1 ? "s" : ""}
      </p>
    </AdminShell>
  );
}