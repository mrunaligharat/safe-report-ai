import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Clock, Search, CheckCircle, Shield } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { getAdminStats } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SafeReport AI" },
      { name: "description", content: "Admin overview of SafeReport AI platform." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Total Incidents",
      value: stats?.totalIncidents ?? 0,
      icon: FileText,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Pending Review",
      value: stats?.pendingReview ?? 0,
      icon: Clock,
      color: "text-orange-600 bg-orange-100",
    },
    {
      label: "Investigating",
      value: stats?.investigating ?? 0,
      icon: Search,
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      label: "Closed",
      value: stats?.closed ?? 0,
      icon: CheckCircle,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Admins",
      value: stats?.admins ?? 0,
      icon: Shield,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <AdminShell title="Admin Dashboard" subtitle="Platform overview and statistics">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stats…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
