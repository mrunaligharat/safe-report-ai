import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { generateComplaint } from "@/lib/complaint.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/report/$id/processing")({
  head: () => ({
    meta: [
      { title: "Generating your complaint — SafeReport AI" },
      {
        name: "description",
        content: "SafeReport AI is drafting a structured complaint from your report.",
      },
      { property: "og:title", content: "Generating your complaint — SafeReport AI" },
      {
        property: "og:description",
        content: "AI turns your incident details into a formal complaint.",
      },
    ],
  }),
  component: Processing,
});

const STEPS = [
  "Extracting information from evidence",
  "Processing uploaded media",
  "Generating complaint draft",
  "Preparing final report",
];

function Processing() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const generate = useServerFn(generateComplaint);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100);

    (async () => {
      try {
        await generate({ data: { incidentId: id } });
        if (cancelled) return;
        setStep(STEPS.length);
        setTimeout(() => navigate({ to: "/report/$id/preview", params: { id } }), 700);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Could not generate the draft");
        navigate({ to: "/report/$id/preview", params: { id } });
      } finally {
        clearInterval(timer);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [generate, id, navigate]);

  const progress = Math.min((step / STEPS.length) * 100, 100);

  return (
    <AppShell title="Building your complaint" subtitle="This usually takes a few seconds">
      <div className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ul className="mt-8 space-y-4">
          {STEPS.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={label} className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                    done
                      ? "bg-success text-primary-foreground"
                      : active
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-5 w-5" />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </span>
                <p
                  className={cn(
                    "text-sm",
                    done || active ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
