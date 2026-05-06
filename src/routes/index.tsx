import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Mail, FileText, ListChecks, Sparkles, Send, Bot, User, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workmate AI — Your Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Draft emails, summarize meetings, plan your day, and research faster with an AI workplace assistant.",
      },
    ],
  }),
  component: Index,
});

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "email" | "meeting" | "tasks" | "research";

const MODES: { id: Mode; label: string; icon: typeof Mail; placeholder: string }[] = [
  { id: "chat", label: "Chat", icon: Sparkles, placeholder: "Ask me anything about your work…" },
  { id: "email", label: "Email", icon: Mail, placeholder: "Draft a follow-up to the client about the proposal…" },
  { id: "meeting", label: "Meeting", icon: FileText, placeholder: "Paste meeting notes to summarize…" },
  { id: "tasks", label: "Plan", icon: ListChecks, placeholder: "List my goals for today: ship report, 3 calls…" },
  { id: "research", label: "Research", icon: Sparkles, placeholder: "Explain the basics of OKRs…" },
];

function Index() {
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<"formal" | "informal" | "persuasive">("formal");
  const [audience, setAudience] = useState<"client" | "manager" | "team">("client");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copyMsg = async (idx: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode, tone, audience }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let done = false;

      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistant } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const ActiveIcon = MODES.find((m) => m.id === mode)!.icon;

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--gradient-bg)" }}>
      <Toaster />
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Workmate AI</h1>
            <p className="text-xs text-muted-foreground">Your workplace productivity assistant</p>
          </div>
        </header>

        {/* Mode tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Email tone & audience controls */}
        {mode === "email" && (
          <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card/40 p-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {(["formal", "informal", "persuasive"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-all ${
                      tone === t
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Audience</label>
              <div className="flex flex-wrap gap-1.5">
                {(["client", "manager", "team"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-all ${
                      audience === a
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card/40 p-4 backdrop-blur"
          style={{ minHeight: "50vh" }}
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <ActiveIcon className="mb-4 h-12 w-12 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {mode === "chat" ? "How can I help today?" : `${MODES.find((x) => x.id === mode)!.label} mode`}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {MODES.find((x) => x.id === mode)!.placeholder}
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  m.role === "user" ? "bg-secondary" : ""
                }`}
                style={m.role === "assistant" ? { background: "var(--gradient-primary)" } : undefined}
              >
                {m.role === "user" ? (
                  <User className="h-4 w-4 text-secondary-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div>
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                    {m.content && (
                      <button
                        onClick={() => copyMsg(i, m.content)}
                        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedIdx === i ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="mt-4 flex gap-2 rounded-2xl border border-border bg-card p-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={MODES.find((x) => x.id === mode)!.placeholder}
            className="min-h-[52px] resize-none border-0 bg-transparent focus-visible:ring-0"
            rows={2}
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-[52px] w-[52px] flex-shrink-0 rounded-xl"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          AI responses can be inaccurate. Verify important information.
        </p>
      </div>
    </div>
  );
}
