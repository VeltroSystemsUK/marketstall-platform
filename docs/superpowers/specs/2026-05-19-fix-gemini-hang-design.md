# Fix: pulse-lead-scout Gemini Hang

**Date:** 2026-05-19  
**Scope:** `pulse-lead-scout/server.ts`, `pulse-lead-scout/src/App.tsx`

## Problem

The app hangs indefinitely on "Evaluating..." when a search is triggered. No error is ever returned to the user.

**Root cause:** Gemini 3 models default to `thinking_level: "high"` — maximum-depth reasoning before producing any output. The default model `gemini-3-flash-preview` silently enters deep thinking mode on every request. There is no timeout anywhere in the request chain to break out of this.

Secondary issue: one of the four model dropdown options (`gemini-flash-latest`) is a stale Gemini 1.5-era alias not present in the Gemini 3 model table.

## Changes

### 1. Set `thinkingLevel: "low"` on all Gemini requests (`server.ts`)

Add `thinkingConfig` to the existing `config` block inside `generateContent`:

```ts
config: {
  thinkingConfig: { thinkingLevel: "low" },
  responseMimeType: "application/json",
  responseSchema: { ... },
  systemInstruction: SYSTEM_PROMPT,
}
```

**Why `"low"`:** Lead scoring is structured JSON extraction — it does not benefit from deep reasoning. `"low"` minimises latency and cost without affecting output quality for this task. `"minimal"` is also valid but not supported by `gemini-3.1-pro-preview`.

**Why not per-model:** All four selectable models are used for the same extraction task. A single setting applied server-side is simpler and correct for all of them.

### 2. Replace `gemini-flash-latest` in model dropdown (`App.tsx`)

| Slot    | Old ID                   | New ID                          | Display name   |
| ------- | ------------------------ | ------------------------------- | -------------- |
| Default | `gemini-3-flash-preview` | unchanged                       | Gemini 3 Flash |
| Pro     | `gemini-3.1-pro-preview` | unchanged                       | Gemini 3.1 Pro |
| Lite    | `gemini-3.1-flash-lite`  | unchanged                       | Flash Lite     |
| Stable  | `gemini-flash-latest`    | `gemini-3.1-flash-lite-preview` | Flash Stable   |

Also update the `useState` default if it referenced the old ID (it references `gemini-3-flash-preview`, which is unchanged — no update needed).

### 3. Add 60-second `Promise.race()` timeout (`server.ts`)

Wrap the `generateContent` call in a race so future configuration issues cannot cause silent hangs:

```ts
const timeoutMs = 60_000;
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), timeoutMs)
);
const response = await Promise.race([
  ai.models.generateContent({ ... }),
  timeoutPromise,
]);
```

The `GEMINI_TIMEOUT` error propagates to the existing `catch` block, which returns a 500 with the message. The existing frontend error state surfaces this to the user. No additional client-side changes needed.

The existing retry logic (5 attempts, exponential backoff) is left unchanged — it handles 503/UNAVAILABLE separately and is unaffected.

## Files Changed

- `pulse-lead-scout/server.ts` — add `thinkingConfig`, wrap in `Promise.race` timeout
- `pulse-lead-scout/src/App.tsx` — replace `gemini-flash-latest` with `gemini-3.1-flash-lite-preview`

## Out of Scope

- Client-side fetch timeout (server timeout makes this redundant for the primary failure mode)
- Changes to retry logic
- UI changes
