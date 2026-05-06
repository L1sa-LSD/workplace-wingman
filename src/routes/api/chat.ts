import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are an intelligent AI Workplace Productivity Assistant designed to help professionals save time, improve efficiency, and automate repetitive tasks.

CORE RESPONSIBILITIES:
1. Generate professional, context-aware emails (with subject line, greeting, closing, appropriate tone)
2. Summarize meeting notes into key points, decisions, action items, deadlines, responsible persons
3. Create structured daily/weekly task plans (prioritized by urgency + importance, with time blocks)
4. Simplify research and provide concise insights (avoid jargon, give recommendations)
5. Interact conversationally like a helpful workplace assistant

INSTRUCTIONS:
- Ask clarifying questions if input is unclear
- Adapt tone (formal, informal, persuasive) based on context
- Tailor responses to audience (client, manager, team member)
- Keep outputs concise, structured, action-oriented
- Use clear headings, bullet points, bold for deadlines/priorities/owners
- Use markdown formatting

RESPONSIBLE AI:
- State limitations when unsure
- Avoid assumptions without context
- Encourage verification of critical info
- Stay unbiased and professional`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, mode, tone, audience } = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
            mode?: string;
            tone?: string;
            audience?: string;
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const modeHints: Record<string, string> = {
            email: "The user wants help drafting a professional email. Always include a Subject line, greeting, body, and closing. Adapt language to the requested tone and audience.",
            meeting: "The user wants a meeting summary. Output sections: Key Points, Decisions, Action Items (with owner + deadline), and Risks/Follow-ups if relevant.",
            tasks: "The user wants a task plan. Prioritize with the Eisenhower matrix (urgent/important). Include time blocks, suggested breaks, and at least 2 time-optimization tips at the end.",
            research: "The user wants research insights. Provide: TL;DR, Key Insights (bulleted), Recommendations, and a 'Verify' note listing what the user should fact-check.",
          };

          const toneHint = tone && mode === "email" ? `\nTONE: Write in a ${tone} tone.` : "";
          const audienceHint = audience && mode === "email" ? `\nAUDIENCE: Tailor the message for a ${audience}.` : "";

          const system =
            SYSTEM_PROMPT +
            (mode && modeHints[mode] ? `\n\nCURRENT MODE: ${modeHints[mode]}` : "") +
            toneHint +
            audienceHint;

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              stream: true,
              messages: [{ role: "system", content: system }, ...messages],
            }),
          });

          if (!resp.ok) {
            if (resp.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit hit, please try again shortly." }),
                { status: 429, headers: { "Content-Type": "application/json" } },
              );
            }
            if (resp.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            const t = await resp.text();
            console.error("AI gateway error", resp.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(resp.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.error("chat handler error", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
