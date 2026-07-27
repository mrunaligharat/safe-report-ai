import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  categoryLabel,
  getComplaint,
  getIncident,
  listEvidence,
  saveComplaint,
} from "@/lib/incidents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/report/$id/preview")({
  head: () => ({
    meta: [
      { title: "Complaint preview — SafeReport AI" },
      { name: "description", content: "Review, edit and submit your AI-generated complaint." },
      { property: "og:title", content: "Complaint preview — SafeReport AI" },
      { property: "og:description", content: "A structured complaint ready to file." },
    ],
  }),
  component: Preview,
});

function Preview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: incident } = useQuery({ queryKey: ["incident", id], queryFn: () => getIncident(id) });
  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", id],
    queryFn: () => listEvidence(id),
  });
  const { data: complaint } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => getComplaint(id),
  });

  useEffect(() => {
    if (complaint?.generated_text) setText(complaint.generated_text);
  }, [complaint?.generated_text]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await saveComplaint(id, user.id, text);
      setEditing(false);
      toast.success("Draft updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>${incident?.tracking_id ?? "complaint"}</title><style>body{font-family:Inter,Arial,sans-serif;padding:48px;line-height:1.6;white-space:pre-wrap;color:#1E293B}</style></head><body>${text.replace(/[<>]/g, "")}</body></html>`,
    );
    win.document.close();
    win.print();
  };

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from("incidents").update({ status: "submitted" }).eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/report/$id/success", params: { id } });
  };

  if (!incident) {
    return (
      <AppShell title="Complaint preview">
        <div className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
          Loading your report…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Complaint preview" subtitle="Step 3 of 3 · Review before you submit">
      <div className="space-y-4 rounded-3xl bg-card p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="font-display text-lg font-semibold">{incident.title}</p>
            <p className="text-xs text-muted-foreground">
              {categoryLabel(incident.category)} · Ref {incident.tracking_id}
            </p>
          </div>
          <StatusBadge status={incident.status} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date and time
            </dt>
            <dd className="mt-1 text-sm">{new Date(incident.incident_date).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </dt>
            <dd className="mt-1 text-sm">{incident.location || "Not specified"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence attached
            </dt>
            <dd className="mt-1 text-sm">
              {evidence.length
                ? evidence.map((e) => e.file_name).join(", ")
                : "No files attached"}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Complaint statement
          </p>
          {editing ? (
            <Textarea
              rows={16}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-2 rounded-2xl font-mono text-sm"
            />
          ) : (
            <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-muted/60 p-4 font-sans text-sm leading-relaxed">
              {text || "No draft yet. Go back and run the AI generator."}
            </pre>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {editing ? (
          <Button onClick={save} disabled={busy} className="h-12 flex-1 rounded-2xl">
            Save changes
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className="h-12 flex-1 rounded-2xl"
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
        <Button variant="outline" onClick={download} className="h-12 flex-1 rounded-2xl">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
        <Button
          onClick={submit}
          disabled={busy || incident.status !== "draft"}
          className="h-12 flex-1 rounded-2xl shadow-float"
        >
          <Send className="mr-2 h-4 w-4" />
          {incident.status === "draft" ? "Submit" : "Submitted"}
        </Button>
      </div>
    </AppShell>
  );
}