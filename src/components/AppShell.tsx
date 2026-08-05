import { Link, useNavigate } from "@tanstack/react-router";
import {
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Shield,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/admin";

// ── Logo ───────────────────────────────────────────────────────────────────

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float"
      style={{ width: size, height: size }}
    >
      <ShieldCheck style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

// ── Nav items (mobile + desktop) ───────────────────────────────────────────

const navItems = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/report/new", label: "Report", icon: FilePlus2 },
  { to: "/reports", label: "Track", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: UserCircle },
] as const;

// ── AppShell ───────────────────────────────────────────────────────────────

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: role } = useQuery({
    queryKey: ["user-role"],
    queryFn: getCurrentUserRole,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch the user's stored profile name so the avatar always shows the right initials,
  // even for users who signed up without full_name in user_metadata (e.g. Google OAuth).
  const { data: profile } = useQuery({
    queryKey: ["profile-name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const isAdmin = role === "admin" || role === "super_admin";

  // Best available name: profile DB > user_metadata > email
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    null;

  const initials = getInitials(displayName, user?.email);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-display text-lg font-semibold">SafeReport AI</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </span>
                </Link>
              )}
            </nav>

            {/* Profile avatar */}
            <Link
              to="/profile"
              aria-label="Go to profile"
              className="ml-1 inline-flex h-8 w-8 select-none items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/70"
            >
              {initials}
            </Link>

            {/* Sign out */}
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-5xl px-5 py-6">
        {title ? (
          <div className="mb-6">
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-card/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
