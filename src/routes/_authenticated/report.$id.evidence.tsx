import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileAudio, FileText, FileVideo, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FileUpload, type PendingFile } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { evidenceSignedUrl, listEvidence } from "@/lib/incidents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/report/$id/evidence")({
  head: () => ({
    meta: [
      { title: "Upload evidence — SafeReport AI" },
      { name: "description", content: "Attach photos, videos and audio to support your report." },
      { property: "og:title", content: "Upload evidence — SafeReport AI" },
      { property: "og:description", content: "Securely store evidence with your incident report." },
    ],
  }),
  component: EvidencePage,
});

const MAX_BYTES = 50 * 1024 * 1024;

function fileIcon(type: string | null) {
  if (!type) return FileText;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  return FileText;
}

function EvidencePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedUrls, setSavedUrls] = useState<Record<string, string | null>>({});

  const { data: saved = [] } = useQuery({
    queryKey: ["evidence", id],
    queryFn: () => listEvidence(id),
  });

  // Fetch signed URLs for saved image evidence.
  // We use a stable string key (all IDs joined) so the effect only re-runs
  // when the actual set of evidence items changes, not on every render.
  const savedKey = saved.map((e) => e.id).join(",");
  useEffect(() => {
    if (!saved.length) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        saved.map(async (e) => {
          if (!e.file_type?.startsWith("image/")) return [e.id, null] as const;
          const url = await evidenceSignedUrl(e.file_path);
          return [e.id, url] as const;
        }),
      );
      if (!cancelled) setSavedUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (list: FileList | null) => {
    if (!list) return;
    const next: PendingFile[] = [];
    Array.from(list).forEach((file) => {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 50 MB`);
        return;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
      });
    });
    setFiles((prev) => [...prev, ...next]);
  };

  const remove = (fileId: string) => setFiles((prev) => prev.filter((f) => f.id !== fileId));

  const upload = async () => {
    if (!user) return;
    setBusy(true);
    try {
      for (const item of files) {
        const path = `${user.id}/${id}/${crypto.randomUUID()}-${item.file.name.replace(/[^\w.-]/g, "_")}`;
        setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f)));
        const { error } = await supabase.storage.from("evidence").upload(path, item.file, {
          contentType: item.file.type || "application/octet-stream",
        });
        if (error) throw error;
        const { error: dbError } = await supabase.from("evidence").insert({
          incident_id: id,
          user_id: user.id,
          file_path: path,
          file_name: item.file.name,
          file_type: item.file.type,
        });
        if (dbError) throw dbError;
        setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, progress: 100 } : f)));
      }
      setFiles([]);
      await queryClient.invalidateQueries({ queryKey: ["evidence", id] });
      navigate({ to: "/report/$id/processing", params: { id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="Upload evidence"
      subtitle="Step 2 of 3 · Optional, but it strengthens your case"
    >
      <FileUpload files={files} onAdd={add} onRemove={remove} disabled={busy} />

      {saved.length > 0 && (
        <div className="mt-6 rounded-3xl bg-card p-5 shadow-card">
          <p className="font-display text-sm font-semibold">Already attached</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {saved.map((e) => {
              const isImage = e.file_type?.startsWith("image/") ?? false;
              const signedUrl = savedUrls[e.id];
              const Icon = fileIcon(e.file_type);
              return (
                <div key={e.id} className="flex flex-col items-center gap-1">
                  {isImage && signedUrl ? (
                    <img
                      src={signedUrl}
                      alt={e.file_name ?? "evidence"}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="max-w-14 truncate text-xs text-muted-foreground">
                    {e.file_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={upload}
          disabled={busy || files.length === 0}
          className="h-12 flex-1 rounded-2xl text-base shadow-float"
        >
          {busy ? "Uploading…" : "Upload and continue"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => navigate({ to: "/report/$id/processing", params: { id } })}
          className="h-12 rounded-2xl"
        >
          Skip for now
        </Button>
      </div>
    </AppShell>
  );
}
