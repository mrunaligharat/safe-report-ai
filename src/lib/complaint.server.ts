type IncidentLike = {
  title: string;
  category: string;
  description: string;
  location: string | null;
  incident_date: string;
  tracking_id: string;
};

export function buildFallbackComplaint(incident: IncidentLike, evidence: string[]) {
  const when = new Date(incident.incident_date).toLocaleString();
  return [
    `SUBJECT: Formal complaint regarding ${incident.category} — ${incident.title}`,
    "",
    "INCIDENT SUMMARY",
    incident.description,
    "",
    `DATE AND TIME: ${when}`,
    `LOCATION: ${incident.location || "Not specified"}`,
    "",
    "EVIDENCE ATTACHED",
    evidence.length ? evidence.map((e, i) => `${i + 1}. ${e}`).join("\n") : "No files attached.",
    "",
    "STATEMENT",
    `I request that the concerned authority register this complaint (reference ${incident.tracking_id}), investigate the matter and take appropriate action under the applicable law. The information provided above is true to the best of my knowledge.`,
  ].join("\n");
}

export async function callLovableAI(
  incident: IncidentLike,
  evidence: string[],
): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You draft formal, factual incident complaints for authorities. Use a calm, respectful, victim-supportive tone. Output plain text with these upper-case headings: SUBJECT, INCIDENT SUMMARY, DATE AND TIME, LOCATION, EVIDENCE ATTACHED, STATEMENT. Never invent facts that were not provided.",
          },
          {
            role: "user",
            content: [
              `Reference: ${incident.tracking_id}`,
              `Title: ${incident.title}`,
              `Category: ${incident.category}`,
              `Date and time: ${incident.incident_date}`,
              `Location: ${incident.location || "Not specified"}`,
              `Description from the reporter: ${incident.description}`,
              `Evidence files: ${evidence.length ? evidence.join(", ") : "none"}`,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
