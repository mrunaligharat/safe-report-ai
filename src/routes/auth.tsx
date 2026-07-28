import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/admin";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SafeReport AI" },
      {
        name: "description",
        content: "Sign in or create your SafeReport AI account to file and track incident reports.",
      },
      { property: "og:title", content: "Sign in — SafeReport AI" },
      {
        property: "og:description",
        content: "Secure access to your incident reports and evidence.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      getCurrentUserRole().then((role) => {
        if (role === "admin" || role === "super_admin") {
          navigate({ to: "/admin/dashboard", replace: true });
        } else {
          navigate({ to: "/dashboard", replace: true });
        }
      });
    }
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const role = await getCurrentUserRole();
        if (role === "admin" || role === "super_admin") {
          navigate({ to: "/admin/dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Check your email to confirm, then sign in.");
          setMode("login");
          return;
        }
        toast.success("Account created. You can start reporting now.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex flex-col items-center gap-3">
          <Logo size={56} />
          <span className="font-display text-xl font-semibold">SafeReport AI</span>
        </Link>

        <div className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-semibold">
            {mode === "login"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "We'll email you a secure link to set a new password."
              : "Your reports stay private and encrypted."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                  className="h-12 rounded-2xl"
                  placeholder="Aditi Sharma"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="h-12 rounded-2xl"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" ? (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-2xl"
                  placeholder="••••••••"
                />
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-2xl text-base shadow-float"
            >
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={google}
                className="h-12 w-full rounded-2xl"
              >
                Continue with Google
              </Button>
            </>
          ) : null}

          <div className="mt-6 space-y-2 text-center text-sm">
            {mode === "login" ? (
              <>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  New here?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary"
                    onClick={() => setMode("signup")}
                  >
                    Create an account
                  </button>
                </p>
              </>
            ) : (
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setMode("login")}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}