import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw redirect({ to: "/auth" });

    // Check user role
    const { data: roleData, error: roleError } = await supabase.rpc("get_user_role");
    if (roleError || !roleData || (roleData !== "admin" && roleData !== "super_admin")) {
      throw redirect({ to: "/dashboard" });
    }

    return { user: userData.user, role: roleData as string };
  },
  component: () => <Outlet />,
});