import { cn } from "@/lib/utils";
import { STATUS_LABEL, type StatusValue } from "@/lib/incidents";

const styles: Record<StatusValue, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/15 text-accent-foreground",
  under_review: "bg-warning/20 text-warning-foreground",
  investigating: "bg-info/15 text-info",
  closed: "bg-success/15 text-success",
};

export function StatusBadge({ status, className }: { status: StatusValue; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
