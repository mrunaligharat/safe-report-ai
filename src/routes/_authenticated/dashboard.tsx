import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, LifeBuoy, ListChecks, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryLabel, listIncidents } from "@/lib/incidents";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SafeReport AI" },
      { name: "description", content: "See your reporting activity and start a new incident report." },
      { property: "og:title", content: "Dashboard — SafeReport AI" },
      { property: "og:description", content: "Your incident reporting overview." },
    ],
  }),
  component: Dashboard,
});

const actions = [
  { to: "/report/new", label: "Create Report", desc: "Start a new incident", icon: FilePlus2 },
  { to: "/reports", label: "Upload Evidence", desc: "Add files to a report", icon: UploadCloud },
  { to: "/reports", label: "Track Reports", desc: "Follow your cases", icon: ListChecks },
  { to: "/emergency", label: "Emergency Help", desc: "Urgent contacts", icon: LifeBuoy },
] as const;

function Dashboard() {
  const { user } = useAuth();
  const { data: incidents = [] } = useQuery({ queryKey: ["incidents"], queryFn: listIncidents });

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const stats = [
    { label: "Total Reports", value: incidents.length },
    { label: "Pending", value: incidents.filter((i) => i.status === "draft").length },
    {
      label: "Submitted",
      value: incidents.filter((i) => i.status !== "draft").length,
    },
  ];

  return (
    <AppShell title={`Hi ${name} 👋`} subtitle="You're in a safe place. What would you like to do?">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-card p-4 text-center shadow-card">
            <p className="font-display text-2xl font-semibold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group rounded-3xl bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <a.icon className="h-5 w-5" />
            </span>
            <p className="font-display text-sm font-semibold">{a.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.desc}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent reports</h2>
          <Link to="/reports" className="text-sm font-medium text-primary">
            View all
          </Link>
        </div>
        {incidents.length === 0 ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              No reports yet. Your first report takes about two minutes.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {incidents.slice(0, 4).map((incident) => (
              <li key={incident.id}>
                <Link
                  to="/report/$id/preview"
                  params={{ id: incident.id }}
                  className="flex items-center justify-between gap-4 rounded-3xl bg-card p-4 shadow-card"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabel(incident.category)} ·{" "}
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={incident.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}