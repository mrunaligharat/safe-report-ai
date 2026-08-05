import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { categoryLabel, listIncidents, STATUS_LABEL, type StatusValue } from "@/lib/incidents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Track reports — SafeReport AI" },
      { name: "description", content: "Follow every incident report from submitted to closed." },
      { property: "og:title", content: "Track reports — SafeReport AI" },
      { property: "og:description", content: "Live status for all your incident reports." },
    ],
  }),
  component: Reports,
});

const FILTERS: Array<{ value: StatusValue | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: STATUS_LABEL.draft },
  { value: "submitted", label: STATUS_LABEL.submitted },
  { value: "under_review", label: STATUS_LABEL.under_review },
  { value: "investigating", label: STATUS_LABEL.investigating },
  { value: "closed", label: STATUS_LABEL.closed },
];

function Reports() {
  const [filter, setFilter] = useState<StatusValue | "all">("all");
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: listIncidents,
  });

  const visible = incidents.filter((i) => filter === "all" || i.status === filter);

  return (
    <AppShell title="Track reports" subtitle="Every case you've filed, in one place">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-soft",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading reports…</p>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-card p-10 text-center shadow-card">
          <p className="text-sm text-muted-foreground">No reports in this category yet.</p>
          <Button asChild className="mt-5 h-12 rounded-2xl">
            <Link to="/report/new">Create a report</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((incident) => (
            <li key={incident.id}>
              <Link
                to="/report/$id/preview"
                params={{ id: incident.id }}
                className="block rounded-3xl bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">{incident.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {categoryLabel(incident.category)} ·{" "}
                      {new Date(incident.incident_date).toLocaleDateString()} ·{" "}
                      {incident.tracking_id}
                    </p>
                  </div>
                  <StatusBadge status={incident.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
