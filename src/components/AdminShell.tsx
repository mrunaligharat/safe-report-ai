import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/incidents", label: "Incidents", icon: FileText },
] as const;

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-card sm:block">
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-6">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold">Admin Panel</span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {adminNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{
                className:
                  "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 p-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ShieldCheck className="h-4 w-4" />
            User Dashboard
          </Link>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 px-4 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="sm:pl-64">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur sm:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold">Admin</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-5 py-6">
          {title ? (
            <div className="mb-6">
              <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-card/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
          {adminNavItems.map((item) => (
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