import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Lock, Sparkles } from "lucide-react";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeReport AI — Report incidents safely and confidently" },
      {
        name: "description",
        content:
          "Turn evidence into a ready-to-file complaint. SafeReport AI helps you report harassment, stalking, theft, cybercrime and accidents in minutes.",
      },
      { property: "og:title", content: "SafeReport AI — Report incidents safely" },
      {
        property: "og:description",
        content: "AI-assisted incident reporting with secure evidence storage and status tracking.",
      },
    ],
  }),
  component: Splash,
});

const highlights = [
  { icon: Sparkles, title: "AI complaint drafting", text: "Your story, structured for authorities." },
  { icon: Lock, title: "Private by design", text: "Evidence is encrypted and only visible to you." },
  { icon: FileText, title: "Track every case", text: "Follow your report from submitted to closed." },
];

function Splash() {
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative w-full max-w-md text-center">
        <div className="flex justify-center">
          <Logo size={80} />
        </div>
        <h1 className="mt-8 text-4xl font-bold">SafeReport AI</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Report incidents safely and confidently
        </p>

        <div className="mt-10 space-y-3 text-left">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-3xl bg-card p-4 shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <Button asChild size="lg" className="mt-10 h-14 w-full rounded-2xl text-base shadow-float">
          <Link to={user ? "/dashboard" : "/auth"}>{user ? "Go to dashboard" : "Get Started"}</Link>
        </Button>
        {!user ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
