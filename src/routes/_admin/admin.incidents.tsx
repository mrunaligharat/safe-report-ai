import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllIncidents, updateIncidentStatus } from "@/lib/admin";
import { categoryLabel, STATUS_LABEL } from "@/lib/incidents";

export const Route = createFileRoute("/_admin/admin/incidents")({
  head: () => ({
    meta: [
      { title: "Incident Management — SafeReport AI Admin" },
      { name: "description", content: "View and manage all reported incidents." },
    ],
  }),
  component: AdminIncidents,
});

function AdminIncidents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["admin-incidents"],
    queryFn: getAllIncidents,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "submitted" | "under_review" | "investigating" | "closed" | "draft" }) =>
      updateIncidentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Incident status updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    },
  });

  const filtered = incidents.filter((incident) => {
    const matchesSearch =
      !search ||
      incident.title?.toLowerCase().includes(search.toLowerCase()) ||
      incident.tracking_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || incident.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || incident.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <AdminShell
      title="Incident Management"
      subtitle="View and manage all reported incidents across the platform"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by title or tracking ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 max-w-sm rounded-xl"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 w-40 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-11 w-40 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="harassment">Harassment</SelectItem>
            <SelectItem value="stalking">Stalking</SelectItem>
            <SelectItem value="theft">Theft</SelectItem>
            <SelectItem value="cybercrime">Cybercrime</SelectItem>
            <SelectItem value="accident">Accident</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading incidents…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tracking ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Update Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {incident.tracking_id}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium">
                    {incident.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {categoryLabel(incident.category)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(incident.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={incident.status}
                      onValueChange={(val) =>
                        mutation.mutate({ id: incident.id, status: val as "submitted" | "under_review" | "investigating" | "closed" | "draft" })
                      }
                    >
                      <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          {STATUS_LABEL.draft}
                        </SelectItem>
                        <SelectItem value="submitted">
                          {STATUS_LABEL.submitted}
                        </SelectItem>
                        <SelectItem value="under_review">
                          {STATUS_LABEL.under_review}
                        </SelectItem>
                        <SelectItem value="investigating">
                          {STATUS_LABEL.investigating}
                        </SelectItem>
                        <SelectItem value="closed">
                          {STATUS_LABEL.closed}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No incidents found.
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Total: {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
      </p>
    </AdminShell>
  );
}