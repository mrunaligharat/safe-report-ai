import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, type CategoryValue } from "@/lib/incidents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/report/new")({
  head: () => ({
    meta: [
      { title: "Create incident report — SafeReport AI" },
      { name: "description", content: "Describe what happened, where and when. We handle the paperwork." },
      { property: "og:title", content: "Create incident report — SafeReport AI" },
      { property: "og:description", content: "Start a guided incident report in minutes." },
    ],
  }),
  component: NewReport,
});

function NewReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryValue>("harassment");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("incidents")
      .insert({
        user_id: user.id,
        title: title.trim().slice(0, 150),
        category,
        description: description.trim().slice(0, 5000),
        location: location.trim().slice(0, 200) || null,
        incident_date: new Date(incidentDate).toISOString(),
      })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not save your report");
      return;
    }
    navigate({ to: "/report/$id/evidence", params: { id: data.id } });
  };

  return (
    <AppShell title="Create report" subtitle="Step 1 of 3 · Tell us what happened">
      <form onSubmit={submit} className="space-y-5 rounded-3xl bg-card p-5 shadow-card sm:p-7">
        <div className="space-y-2">
          <Label htmlFor="title">Incident title</Label>
          <Input
            id="title"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Repeated messages from an unknown number"
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-2xl border border-border px-3 py-3 text-sm font-medium transition-colors",
                  category === c.value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">What happened?</Label>
          <Textarea
            id="description"
            required
            maxLength={5000}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the incident in your own words. Take your time."
            className="rounded-2xl"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              maxLength={200}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Street, area or city"
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date and time</Label>
            <Input
              id="date"
              type="datetime-local"
              required
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="h-13 w-full rounded-2xl py-4 text-base shadow-float"
        >
          Continue to evidence
        </Button>
      </form>
    </AppShell>
  );
}