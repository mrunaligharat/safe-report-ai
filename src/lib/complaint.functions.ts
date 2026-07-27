import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildFallbackComplaint, callLovableAI } from "./complaint.server";

const Input = z.object({ incidentId: z.string().uuid() });

export const generateComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { data: incident, error } = await context.supabase
      .from("incidents")
      .select("*")
      .eq("id", data.incidentId)
      .single();
    if (error || !incident) throw new Error("Report not found");

    const { data: evidence } = await context.supabase
      .from("evidence")
      .select("file_name, file_type")
      .eq("incident_id", data.incidentId);

    const evidenceList = (evidence ?? []).map(
      (e) => `${e.file_name ?? "attachment"} (${e.file_type ?? "file"})`,
    );

    const text =
      (await callLovableAI(incident, evidenceList)) ??
      buildFallbackComplaint(incident, evidenceList);

    const { data: existing } = await context.supabase
      .from("complaints")
      .select("id")
      .eq("incident_id", data.incidentId)
      .maybeSingle();

    if (existing) {
      await context.supabase
        .from("complaints")
        .update({ generated_text: text })
        .eq("id", existing.id);
    } else {
      await context.supabase.from("complaints").insert({
        incident_id: data.incidentId,
        user_id: context.userId,
        generated_text: text,
      });
    }

    return { text };
  });