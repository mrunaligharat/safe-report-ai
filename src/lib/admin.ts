import { supabase } from "@/integrations/supabase/client";

export type UserRole = "user" | "admin" | "super_admin";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export async function getCurrentUserRole(): Promise<UserRole> {
  const { data, error } = await supabase.rpc("get_user_role");
  if (error || !data) return "user";
  return data as UserRole;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UserProfile[];
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

export async function getAllIncidents() {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateIncidentStatus(
  incidentId: string,
  status: "submitted" | "under_review" | "investigating" | "closed" | "draft"
): Promise<void> {
  const { error } = await supabase
    .from("incidents")
    .update({ status })
    .eq("id", incidentId);
  if (error) throw error;
}

export async function getAdminStats() {
  const { data: incidents } = await supabase
    .from("incidents")
    .select("status, created_at");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("role, created_at");

  const totalUsers = profiles?.length ?? 0;
  const totalIncidents = incidents?.length ?? 0;
  const pendingReview = incidents?.filter((i) => i.status === "submitted").length ?? 0;
  const investigating = incidents?.filter((i) => i.status === "investigating").length ?? 0;
  const closed = incidents?.filter((i) => i.status === "closed").length ?? 0;
  const admins = profiles?.filter((p) => p.role === "admin" || p.role === "super_admin").length ?? 0;

  return {
    totalUsers,
    totalIncidents,
    pendingReview,
    investigating,
    closed,
    admins,
  };
}