import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  { value: "harassment", label: "Harassment" },
  { value: "stalking", label: "Stalking" },
  { value: "theft", label: "Theft" },
  { value: "cybercrime", label: "Cybercrime" },
  { value: "accident", label: "Accident" },
  { value: "other", label: "Other" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export type StatusValue = "draft" | "submitted" | "under_review" | "investigating" | "closed";

export type Incident = {
  id: string;
  user_id: string;
  tracking_id: string;
  title: string;
  category: CategoryValue;
  description: string;
  location: string | null;
  incident_date: string;
  status: StatusValue;
  created_at: string;
};

export type Evidence = {
  id: string;
  incident_id: string;
  file_path: string;
  file_name: string | null;
  file_type: string | null;
  uploaded_at: string;
};

export const STATUS_LABEL: Record<StatusValue, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  investigating: "Investigating",
  closed: "Closed",
};

export const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? "Other";

export async function listIncidents() {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Incident[];
}

export async function getIncident(id: string) {
  const { data, error } = await supabase.from("incidents").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as Incident;
}

export async function listEvidence(incidentId: string) {
  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .eq("incident_id", incidentId)
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Evidence[];
}

export async function getComplaint(incidentId: string) {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as { id: string; generated_text: string } | null;
}

export async function saveComplaint(incidentId: string, userId: string, text: string) {
  const existing = await getComplaint(incidentId);
  if (existing) {
    const { error } = await supabase
      .from("complaints")
      .update({ generated_text: text })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("complaints")
    .insert({ incident_id: incidentId, user_id: userId, generated_text: text });
  if (error) throw error;
}

export async function evidenceSignedUrl(path: string) {
  const { data } = await supabase.storage.from("evidence").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
