# Nexa

> An AI operating system for the rest of us.

Nexa is a web-based AI automation workspace. The user types a task in plain English; the agent plans, picks the right tools, executes them, and shows every step. Not a chatbot — an agent with hands.

This repo is the **demo MVP**: a runnable, investor-ready scaffold that communicates the product direction and ships a clean architecture you can extend toward production.

---

## What's inside

- **Agent chat** — streaming responses with a visible plan, live tool-execution cards, and expandable input / logs / output per tool call.
- **Tool system** — typed, modular `ToolDefinition` contracts. Five demo tools (Web Search, Notes, Calendar, Email Draft, Task Creator) registered through a single registry.
- **Workflow history** — every agent run is persisted with its plan, tool calls, durations, and outcome.
- **Tasks** — quick-add, status toggles, filters; agent-created tasks land here automatically.
- **Integrations** — visual catalog of every registered tool with parameter schemas.
- **Command palette** — ⌘K everywhere, with quick nav and tool jumping.
- **Auth** — email/password mock + guest mode (no backend required); Supabase service is pre-wired for when you bring keys.
- **Settings** — profile, theme, API keys, workspace reset.

---

## Stack

| Layer            | Choice                                    |
| ---------------- | ----------------------------------------- |
| Framework        | Next.js 15 (App Router) + React 19        |
| Language         | TypeScript (strict)                       |
| Styling          | TailwindCSS + custom design tokens        |
| Primitives       | Radix UI (shadcn-style local components)  |
| State            | Zustand (per-domain stores, persisted)    |
| Data fetching    | TanStack Query                            |
| Animation        | Framer Motion                             |
| Command palette  | cmdk                                      |
| Auth & DB        | Supabase (optional)                       |
| LLM              | OpenAI SDK (optional — falls back to mock)|
| Fonts            | Geist Sans / Geist Mono / Instrument Serif|

---

## Getting started

```bash
git clone <this-repo> nexa
cd nexa
npm install
cp .env.local.example .env.local   # optional — demo runs without it
npm run dev
```

Open <http://localhost:3000>. Click **Continue as guest** to skip auth. The agent works fully without any API keys — it uses a deterministic mock orchestrator that streams realistic plans and tool executions.

### Going live

The architecture is built for graceful upgrade. Each subsystem swaps independently:

| Demo mode (default)                  | Production                                     |
| ------------------------------------ | ---------------------------------------------- |
| Mock orchestrator in `services/agent.service.ts` | Set `OPENROUTER_API_KEY` and route through `/api/agent` |
| `localStorage` auth via Zustand      | Set `NEXT_PUBLIC_SUPABASE_*`, use `lib/supabase.ts`  |
| Tool `execute()` returns fake data   | Replace per-tool `execute()` with real API calls    |

---

## Architecture

```
nexa/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Public routes (login, signup)
│   ├── (dashboard)/            # Authed routes (chat, tasks, …)
│   ├── api/                    # Server endpoints (optional live agent)
│   ├── onboarding/             # First-run flow
│   ├── layout.tsx              # Root layout — fonts & providers
│   └── page.tsx                # Landing
├── components/
│   ├── chat/                   # Message bubble, composer, tool card, empty state
│   ├── layout/                 # Sidebar, top bar, command palette
│   ├── common/                 # Logo, providers, auth gate, theme
│   └── ui/                     # shadcn-style Radix primitives
├── features/
│   └── tools/                  # One file per tool (typed, self-contained)
├── services/
│   ├── tool-registry.ts        # Central catalog + OpenAI function schemas
│   └── agent.service.ts        # Orchestrator: plan → execute → stream reply
├── store/                      # Zustand stores (auth, chat, tasks, workflows, ui)
├── lib/                        # utils, supabase, openai, config, seed data
├── types/                      # Core contracts: agent, tools, workflow, user
└── hooks/                      # useAgent, useTools
```

### Separation of concerns

- **UI** never imports services directly. It talks to stores.
- **Stores** orchestrate by calling services (`agent.service`) and routing side-effects (a task created by the agent appears in the task store automatically).
- **Services** are pure: they don't know about React, the DOM, or persistence.
- **Tools** are leaves. Each is a `ToolDefinition` with a single `execute()` function and zero external dependencies.

### How the agent works

```
User input
   │
   ▼
runAgent(request) — async generator emitting typed events
   │
   ├── plan                  → store sets currentPlan
   ├── tool_call.queued      → UI renders ToolExecutionCard (running)
   ├── tool_call.result      → UI updates card (succeeded / failed)
   ├── assistant_delta       → UI streams text into message bubble
   └── done                  → store finalizes message; workflow saved
```

This same shape will hold when you swap the mock for a real LLM tool-calling loop — the UI doesn't need to change.

### Adding a new tool

1. Drop a file in `features/tools/<name>.tool.ts` implementing `ToolDefinition`.
2. Register it in `services/tool-registry.ts`.
3. That's it. The agent's planner sees it. The integrations page lists it. The command palette indexes it.

```ts
// features/tools/slack.tool.ts
export const slackTool: ToolDefinition<SlackInput, SlackResult> = {
  id: "slack",
  name: "Slack",
  description: "Post a message to a Slack channel.",
  icon: "MessageSquare",
  category: "communication",
  connected: false,
  parameters: [
    { name: "channel", type: "string", description: "Channel name.", required: true },
    { name: "text",    type: "string", description: "Message body.",   required: true },
  ],
  async execute(input, ctx) {
    ctx.log({ level: "info", message: `Posting to #${input.channel}` });
    // …call real Slack API here
    return { ts: Date.now(), ok: true };
  },
};
```

---

## Design system

Nexa's visual identity is a deliberate departure from the purple/blue gradient aesthetic most AI products share:

- **Palette** — warm near-black (`hsl(0 0% 4%)`) with a signature amber accent (`hsl(28 100% 64%)`). Status colors (emerald for success, red for failure) appear sparingly.
- **Type** — Geist Sans for UI, Geist Mono for terminal/log surfaces, **Instrument Serif italic** for editorial display moments (the wordmark, hero lines, empty states). The serif italic is intentional — it gives the product a human voice in a category that overwhelmingly defaults to neutral grotesks.
- **Motion** — 200–400ms eases with `[0.22, 1, 0.36, 1]` for entrances. Tool cards glow at the border while executing, then settle.
- **Surfaces** — every elevated surface uses a 1px hairline border, a subtle inset highlight, and a downward shadow that grounds it on the dark canvas.

---

## Scripts

```bash
npm run dev          # Start the dev server
npm run build        # Production build
npm run start        # Run the production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

---

## Status

This is an early-access scaffold (v0.1). The mock orchestrator is deterministic, the persistence layer is `localStorage`, and the agent doesn't yet talk to real APIs. The contracts are stable, though — the goal is that swapping in production services is a file-by-file upgrade, not a rewrite.

---

## License

Proprietary — Nexa Labs, 2026.
