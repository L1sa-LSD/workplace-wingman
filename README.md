# Workmate AI — Workplace Productivity Assistant

Workmate AI is an AI-powered workplace assistant that helps professionals save time on repetitive tasks. It drafts emails, summarizes meeting notes, plans your day, and turns research into clear insights — all from a single chat interface with specialized modes.

Built as part of an AI Workplace Productivity Assistant project, the app follows the brief's core responsibilities, prompt-engineering guidelines, and responsible-AI principles.

---

## What This Project Does

Workmate AI behaves like a smart workplace teammate. You pick a mode for the task at hand and chat naturally — the assistant adapts its structure, tone, and output style to match.

### Modes

| Mode | Purpose | Output Style |
|------|---------|--------------|
| **Chat** | General conversational assistant | Free-form, helpful answers |
| **Email** | Draft professional emails | Subject line, greeting, body, closing — adapted to tone & audience |
| **Meeting** | Summarize meeting notes | Key Points, Decisions, Action Items (owner + deadline), Risks/Follow-ups |
| **Plan** | Daily/weekly task planning | Eisenhower matrix (urgent/important), time blocks, optimization tips |
| **Research** | Simplify research | TL;DR, Key Insights, Recommendations, Verify checklist |

### Email Customization
- **Tone**: Formal, Informal, Persuasive
- **Audience**: Client, Manager, Team

---

## What I Built

### 1. Multi-Mode Chat Interface
A clean, mobile-friendly chat UI with switchable productivity modes. Each mode shows a tailored placeholder, icon, and empty-state message so users instantly understand what the assistant can do.

### 2. Streaming AI Responses
Responses stream in real time from the Lovable AI Gateway (Google Gemini), giving an interactive, ChatGPT-style feel rather than waiting for a full response.

### 3. Prompt Engineering for Each Mode
A central system prompt enforces the assistant's role, plus per-mode hints that lock in output structure (Eisenhower matrix for tasks, TL;DR + Verify for research, etc.) so results stay consistent and action-oriented.

### 4. Email Tone & Audience Controls
UI selectors let the user choose tone (formal / informal / persuasive) and audience (client / manager / team). These flow into the backend prompt to shape the final email.

### 5. Markdown Rendering
Assistant replies render with `react-markdown` — headings, bullets, bolded deadlines/owners, and lists all display properly.

### 6. Copy-to-Clipboard
Every assistant message has a one-click copy button with visual feedback, so users can quickly paste output into their email client, doc, or task tracker.

### 7. Responsible AI Practices
- A persistent footer reminds users that AI responses can be inaccurate and to verify important info.
- The system prompt instructs the model to state limitations, avoid assumptions, and stay unbiased.

### 8. Neon Mint Design System
Custom dark theme using OKLCH color tokens defined in `src/styles.css` — gradients, glow effects, and semantic tokens (no hardcoded colors in components).

---

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite 7)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **AI**: Lovable AI Gateway (`google/gemini-3-flash-preview`) with streaming
- **Backend**: Lovable Cloud (Supabase) + TanStack server routes
- **Markdown**: `react-markdown`
- **Icons**: `lucide-react`
- **Notifications**: `sonner`

---

## Project Structure

```
src/
├── routes/
│   ├── index.tsx          # Main chat UI with mode switching
│   ├── api/chat.ts        # Server route — streams AI responses
│   └── __root.tsx         # Root layout
├── styles.css             # Neon Mint theme tokens (OKLCH)
├── components/ui/         # shadcn UI components
└── integrations/supabase/ # Backend client
```

---

## How It Works

1. User picks a mode and types a prompt.
2. Frontend POSTs `messages`, `mode`, `tone`, and `audience` to `/api/chat`.
3. Server route builds a system prompt = base prompt + mode hint + tone/audience hints.
4. Request is sent to the Lovable AI Gateway with `stream: true`.
5. The response stream is piped back to the browser and parsed token-by-token.
6. Markdown renders progressively as text arrives.

---

## Alignment with Project Brief

| Requirement | Implementation |
|-------------|----------------|
| Generate context-aware emails | Email mode + tone/audience controls |
| Summarize meeting notes | Meeting mode with structured sections |
| Daily/weekly task plans | Plan mode using Eisenhower matrix |
| Simplify research | Research mode with TL;DR + Verify |
| Conversational interaction | Chat mode + persistent message history |
| Adapt tone (formal/informal/persuasive) | Tone selector wired to prompt |
| Tailor to audience | Audience selector wired to prompt |
| Clear headings & bullets | Markdown rendering |
| State limitations / encourage verification | System prompt + UI footer |

---

## Running Locally

The app runs in the Lovable preview automatically. To work on it locally:

```bash
bun install
bun run dev
```

Make sure Lovable Cloud is connected so the AI Gateway key is available to the server route.
