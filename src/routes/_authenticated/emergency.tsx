import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency help — SafeReport AI" },
      { name: "description", content: "Urgent helpline numbers and immediate safety steps." },
      { property: "og:title", content: "Emergency help — SafeReport AI" },
      { property: "og:description", content: "Reach help immediately if you are in danger." },
    ],
  }),
  component: Emergency,
});

const contacts = [
  { name: "Police", number: "112", note: "All-in-one emergency response" },
  { name: "Women's helpline", number: "1091", note: "24x7 support for harassment and stalking" },
  { name: "Cybercrime helpline", number: "1930", note: "Online fraud and cybercrime" },
  { name: "Ambulance", number: "108", note: "Medical emergencies and accidents" },
];

function Emergency() {
  return (
    <AppShell title="Emergency help" subtitle="If you are in immediate danger, call first — report later.">
      <div className="rounded-3xl bg-destructive/10 p-5 text-sm text-foreground shadow-soft">
        Move to a safe, public place if you can. Tell someone you trust where you are.
      </div>
      <ul className="mt-5 space-y-3">
        {contacts.map((c) => (
          <li key={c.name}>
            <a
              href={`tel:${c.number}`}
              className="flex items-center justify-between gap-4 rounded-3xl bg-card p-4 shadow-card"
            >
              <div>
                <p className="font-display font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Phone className="h-4 w-4" />
                {c.number}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}