# Fix Gemini Hang Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop pulse-lead-scout from hanging indefinitely on "Evaluating..." by fixing the Gemini 3 thinking-level default and adding a timeout.

**Architecture:** Two surgical edits to existing files. `server.ts` gets `thinkingLevel: "low"` added to the `generateContent` config block and a `Promise.race` timeout wrapping the call. `App.tsx` gets one stale model ID replaced in the dropdown array.

**Tech Stack:** TypeScript, Express, `@google/genai` SDK v1.29+, React 19

---

## File Map

| File                           | Change                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `pulse-lead-scout/server.ts`   | Add `thinkingConfig`, wrap `generateContent` in `Promise.race` |
| `pulse-lead-scout/src/App.tsx` | Replace stale `gemini-flash-latest` model ID                   |

---

### Task 1: Replace stale model ID in App.tsx

**Files:**

- Modify: `pulse-lead-scout/src/App.tsx:300`

The `models` array in `SearchInterface` (line 281) contains a stale Gemini 1.5-era alias as its fourth entry. Replace it with a valid Gemini 3.1 model ID.

- [ ] **Step 1: Edit the stale model entry**

Find this block in `App.tsx` (around line 296–301):

```ts
    {
      id: "gemini-flash-latest",
      name: "Flash Stable",
      desc: "Baseline Reliability",
      color: "text-purple-400",
    },
```

Replace it with:

```ts
    {
      id: "gemini-3.1-flash-lite-preview",
      name: "Flash Stable",
      desc: "Baseline Reliability",
      color: "text-purple-400",
    },
```

- [ ] **Step 2: Verify no other references to the old ID**

```bash
grep -n "gemini-flash-latest" pulse-lead-scout/src/App.tsx
```

Expected output: no matches.

- [ ] **Step 3: Commit**

```bash
git add pulse-lead-scout/src/App.tsx
git commit -m "fix: replace stale gemini-flash-latest with gemini-3.1-flash-lite-preview"
```

---

### Task 2: Add thinkingConfig and timeout to server.ts

**Files:**

- Modify: `pulse-lead-scout/server.ts:84–139`

Two changes in `generateWithRetry`. Both go inside the `try` block. The thinking config stops the model defaulting to `high` reasoning. The `Promise.race` ensures the call can never hang forever.

- [ ] **Step 1: Add `thinkingConfig` to the `generateContent` config block**

Find this line in `server.ts` (around line 87–88, inside the `config` object passed to `generateContent`):

```ts
          config: {
            responseMimeType: "application/json",
```

Replace it with:

```ts
          config: {
            thinkingConfig: { thinkingLevel: "low" },
            responseMimeType: "application/json",
```

- [ ] **Step 2: Wrap `generateContent` in a `Promise.race` timeout**

Find the return statement inside `generateWithRetry`'s `try` block (around line 84–139). It currently reads:

```ts
        return await ai.models.generateContent({
          model: selectedModel,
          contents: JSON.stringify({ places: placesInput }),
          config: {
            thinkingConfig: { thinkingLevel: "low" },
            responseMimeType: "application/json",
```

Replace the entire `return await ai.models.generateContent({...});` statement with a `Promise.race`. The full replacement for the `try` block body is:

```ts
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 60_000),
);
return await Promise.race([
  ai.models.generateContent({
    model: selectedModel,
    contents: JSON.stringify({ places: placesInput }),
    config: {
      thinkingConfig: { thinkingLevel: "low" },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            lead_id: { type: Type.STRING },
            business_name: { type: Type.STRING },
            lead_score: { type: Type.NUMBER },
            current_digital_status: { type: Type.STRING },
            contact_details: {
              type: Type.OBJECT,
              properties: {
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                email: { type: Type.STRING },
              },
              required: ["address"],
            },
            pitch_hook_angle: { type: Type.STRING },
            website_url: { type: Type.STRING },
            ai_demo_generation_parameters: {
              type: Type.OBJECT,
              properties: {
                framework_type: { type: Type.STRING },
                suggested_primary_keyword: { type: Type.STRING },
                recommended_placeholders: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "framework_type",
                "suggested_primary_keyword",
                "recommended_placeholders",
              ],
            },
          },
          required: [
            "lead_id",
            "business_name",
            "lead_score",
            "current_digital_status",
            "contact_details",
            "pitch_hook_angle",
            "ai_demo_generation_parameters",
          ],
        },
      },
      systemInstruction: SYSTEM_PROMPT,
    },
  }),
  timeoutPromise,
]);
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd pulse-lead-scout && npm run lint
```

Expected output: no errors.

- [ ] **Step 4: Commit**

```bash
git add pulse-lead-scout/server.ts
git commit -m "fix: set thinkingLevel:low and add 60s timeout to Gemini requests"
```

---

### Task 3: Manual verification

**Files:** none (runtime test only)

- [ ] **Step 1: Start the dev server**

```bash
cd pulse-lead-scout && npm run dev
```

Expected: server starts on `http://localhost:3001`

- [ ] **Step 2: Run a search and confirm it completes**

Open `http://localhost:3001` in a browser. Enter a sector (e.g. "Pubs") and location (e.g. "London"). Click "Scan Leads".

Expected: the spinner resolves within ~10–20 seconds and a lead list appears. It must **not** hang indefinitely.

- [ ] **Step 3: Confirm the Flash Stable model option works**

Select "Flash Stable" from the Intelligence Engine dropdown. Run the same search.

Expected: completes without hanging. This confirms `gemini-3.1-flash-lite-preview` is accepted by the API.

- [ ] **Step 4: Confirm timeout fires if needed (optional smoke test)**

To verify the timeout path, temporarily change `60_000` to `1` in `server.ts`, run a search, and confirm the error state shows `"GEMINI_TIMEOUT"` instead of hanging. Revert the value to `60_000` and save.
