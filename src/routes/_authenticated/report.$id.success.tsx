import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getIncident } from "@/lib/incidents";

export const Route = createFileRoute("/_authenticated/report/$id/success")({
  head: () => ({
    meta: [
      { title: "Report submitted — SafeReport AI" },
      {
        name: "description",
        content: "Your incident report was submitted. Keep your tracking ID safe.",
      },
      { property: "og:title", content: "Report submitted — SafeReport AI" },
      { property: "og:description", content: "Track your case status any time." },
    ],
  }),
  component: Success,
});

function Success() {
  const { id } = Route.useParams();
  const { data: incident } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold">Report submitted successfully</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You did a brave thing. We'll keep you updated as the status changes.
        </p>

        <div className="mt-6 rounded-2xl bg-accent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            Tracking ID
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">{incident?.tracking_id ?? "…"}</p>
        </div>

        <Button asChild className="mt-6 h-12 w-full rounded-2xl shadow-float">
          <Link to="/reports">Track status</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 h-11 w-full rounded-2xl">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </AppShell>
  );
}
