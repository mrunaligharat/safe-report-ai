import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — SafeReport AI" },
      { name: "description", content: "Manage your SafeReport AI profile." },
      { property: "og:title", content: "Profile — SafeReport AI" },
    ],
  }),
  component: ProfilePage,
});

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function ProfilePage() {
  const { user } = useAuth();

  // Pre-fill immediately from user_metadata (available instantly from auth session).
  // The DB query below may override this with a more up-to-date value.
  const [fullName, setFullName] = useState(
    () => (user?.user_metadata?.full_name as string | undefined) ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Seed from user_metadata in case the component mounted before user resolved
    const metaName = (user.user_metadata?.full_name as string | undefined) ?? "";
    if (metaName && !fullName) setFullName(metaName);

    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data != null) {
          // data.full_name can be "" or a real name — use it regardless (DB is source of truth)
          setFullName(data.full_name ?? metaName);
        }
        setLoading(false);
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile. Please try again.");
    } else {
      toast.success("Profile updated successfully.");
    }
  };

  const initials = getInitials(fullName, user?.email);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AppShell title="Profile" subtitle="Manage your account details">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl bg-card p-5 shadow-card sm:p-7">
          {/* Avatar */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <span className="inline-flex h-20 w-20 select-none items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {initials}
            </span>
            <div className="text-center">
              {fullName && (
                <p className="text-base font-semibold">{fullName}</p>
              )}
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {memberSince && (
                <p className="mt-1 text-xs text-muted-foreground">Member since {memberSince}</p>
              )}
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                className="h-12 rounded-2xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                className="h-12 rounded-2xl opacity-60"
                value={user?.email ?? ""}
                disabled
                readOnly
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl text-base shadow-float"
              disabled={saving || loading}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
