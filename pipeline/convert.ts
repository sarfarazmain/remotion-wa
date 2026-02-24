#!/usr/bin/env tsx
/**
 * pipeline/convert.ts — Slot Script → topic.json Converter
 * ──────────────────────────────────────────────────────────
 * Takes a slot-based cinematic script (HOOK / VISIBLE_WORLD / MECHANISM / VERDICT)
 * and uses Claude claude-sonnet-4-5 (with extended thinking) to apply the full WARP v2.0 SOP,
 * producing a valid topic.json ready for the pipeline.
 *
 * Usage:
 *   npx tsx pipeline/convert.ts scripts/financial-repression.json
 *   npx tsx pipeline/convert.ts scripts/financial-repression.json --title "Financial Repression" --slug financial-repression
 *   cat script.json | npx tsx pipeline/convert.ts
 *
 * Output: topics/{slug}.json
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { mkdirSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";

dotenv.config();

// ── Types ────────────────────────────────────────────────────────────────────

interface Slot {
    slot_order: number;
    slot_type: "HOOK" | "VISIBLE_WORLD" | "MECHANISM" | "VERDICT";
    duration_seconds: number;
    narration: string;
    visual_strategy: string;
    ai_visual_intent: string;
}

// ── Load SOP prompt from file ─────────────────────────────────────────────────

function loadSOP(): string {
    const sopPath = "sop/GEMINI_PROMPT.md";
    if (!existsSync(sopPath)) {
        throw new Error(`SOP prompt not found at ${sopPath}. Run from project root.`);
    }
    return readFileSync(sopPath, "utf-8");
}

// ── Build Claude prompt ───────────────────────────────────────────────────────

function buildPrompt(slots: Slot[], title: string, slug: string, sop: string): string {
    const narrationFull = slots.map((s) => s.narration).join(" ");

    const slotSummary = slots
        .map((s) =>
            `[Slot ${s.slot_order} — ${s.slot_type}]
Narration: "${s.narration}"
Visual intent: ${s.ai_visual_intent}`
        )
        .join("\n\n");

    return `You are applying WARP v2.0 SOP to convert a slot-based cinematic script into a topic.json for a video production pipeline.

## The SOP You Must Follow

${sop}

---

## The Input Script

This script has ${slots.length} slots. Each slot is already assigned a narrative role (HOOK / VISIBLE_WORLD / MECHANISM / VERDICT) and a cinematic visual intent.

Your job:
1. Map each slot to the correct WARP heroType (DATA_STATE / EVIDENCE_STATE / STATEMENT_STATE / HERO_VIDEO)
2. Use the ai_visual_intent to derive Pexels search queries (extract subject + motion/texture keywords, strip camera brand/shot type labels/framerate)
3. Create declaration or typography lines from the narration (≤18 chars per line, max 3 lines)
4. Add appropriate evidence, dataTicker, or chart where the slot_type warrants it
5. Assign transitions following the grid rules (S4→S5 and S8→S9 MUST be INFINITE_DESK_DOWN)
6. Select BGM from the catalogue
7. Output ONLY valid JSON — no markdown, no explanation, no code fences

## Slot Mapping Guide (apply these)
- HOOK → heroType: HERO_VIDEO, physics: GLIDE, layout: FULL_BLEED
- VISIBLE_WORLD → heroType: STATEMENT_STATE, physics: SLAM, layout: FULL_BLEED
- MECHANISM → heroType: STATEMENT_STATE (use DATA_STATE if data fits), physics: SLAM
- VERDICT → heroType: EVIDENCE_STATE or STATEMENT_STATE, physics: STOP_MOTION

## Script Title & Slug
- title: "${title}"
- slug: "${slug}"

## Full Narration (for the narration field)
"${narrationFull}"

## Slots
${slotSummary}

---

IMPORTANT RULES:
- Every scene MUST have at least one of: typography OR declaration
- Every text line MUST be ≤18 characters
- DATA_STATE scenes MUST have a chart
- Transitions S4→S5 and S8→S9 MUST be INFINITE_DESK_DOWN
- Output ONLY the raw JSON object. No markdown fences. No explanation.

Output the complete topic.json now:`;
}

// ── Call Claude ───────────────────────────────────────────────────────────────

async function callClaude(prompt: string, sop: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error(
            "ANTHROPIC_API_KEY not set. Add it to .env or export it:\n  export ANTHROPIC_API_KEY=sk-ant-..."
        );
    }

    const client = new Anthropic({ apiKey });

    console.log("  🤖 Calling Claude claude-sonnet-4-5 (extended thinking)...");

    const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 16000,
        thinking: {
            type: "enabled",
            budget_tokens: 10000,
        },
        system: `You are a video production creative director. You apply the WARP v2.0 SOP rigorously to produce structured JSON. You output ONLY valid JSON with no markdown fences, no explanation, no comments.`,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    } as Parameters<typeof client.messages.create>[0]);

    // Extract text content (skip thinking blocks)
    let jsonText = "";
    for (const block of response.content) {
        if (block.type === "text") {
            jsonText += block.text;
        }
    }

    return jsonText.trim();
}

// ── Strip markdown fences if present ────────────────────────────────────────

function stripFences(text: string): string {
    // Strip ```json ... ``` or ``` ... ```
    const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
    if (fenceMatch) return fenceMatch[1].trim();
    return text;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const filePath = args.find((a) => !a.startsWith("--"));

    // Parse optional flags
    const titleFlag = args.find((a) => a.startsWith("--title="))?.split("=").slice(1).join("=");
    const slugFlag = args.find((a) => a.startsWith("--slug="))?.split("=").slice(1).join("=");

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║     🎬  SLOT SCRIPT → TOPIC JSON CONVERTER             ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    // ── Read input ──────────────────────────────────────────────────────────
    let rawInput: string;
    if (filePath) {
        if (!existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }
        rawInput = readFileSync(filePath, "utf-8");
        console.log(`  📄 Input: ${filePath}`);
    } else {
        // Read from stdin
        rawInput = "";
        for await (const chunk of process.stdin) rawInput += chunk;
        console.log("  📄 Input: stdin");
    }

    // ── Parse input ─────────────────────────────────────────────────────────
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawInput);
    } catch {
        console.error("❌ Invalid JSON input");
        process.exit(1);
    }

    // Accept flat array or { slots: [...] } wrapper
    let slots: Slot[];
    if (Array.isArray(parsed)) {
        slots = parsed as Slot[];
    } else if (
        typeof parsed === "object" &&
        parsed !== null &&
        "slots" in parsed &&
        Array.isArray((parsed as { slots: unknown }).slots)
    ) {
        slots = (parsed as { slots: Slot[] }).slots;
    } else {
        console.error("❌ Input must be an array of slots or { slots: [...] }");
        process.exit(1);
    }

    if (slots.length < 10 || slots.length > 14) {
        console.error(`❌ Expected 10-14 slots, got ${slots.length}`);
        process.exit(1);
    }

    // ── Derive title + slug ─────────────────────────────────────────────────
    // Auto-derive from file path if not provided via flags
    let title = titleFlag || "";
    let slug = slugFlag || "";

    if (filePath && !slug) {
        const fileName = filePath.split("/").pop()?.replace(".json", "") || "video";
        slug = fileName;
    }
    if (!slug) slug = "video";

    if (!title) {
        // Derive title from slug: financial-repression → Financial Repression
        title = slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }

    console.log(`  📌 Title: "${title}"`);
    console.log(`  📌 Slug: "${slug}"`);
    console.log(`  📌 Scenes: ${slots.length}\n`);

    // ── Load SOP ─────────────────────────────────────────────────────────────
    let sop: string;
    try {
        sop = loadSOP();
        console.log("  ✅ SOP loaded (sop/GEMINI_PROMPT.md)\n");
    } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(1);
    }

    // ── Build prompt + call Claude ───────────────────────────────────────────
    const prompt = buildPrompt(slots, title, slug, sop);
    let rawJson: string;
    try {
        rawJson = await callClaude(prompt, sop);
    } catch (err) {
        console.error(`❌ Claude API error: ${(err as Error).message}`);
        process.exit(1);
    }

    // ── Strip fences + parse ─────────────────────────────────────────────────
    const cleanJson = stripFences(rawJson);
    let topicJson: unknown;
    try {
        topicJson = JSON.parse(cleanJson);
    } catch {
        console.error("❌ Claude returned invalid JSON. Raw output saved to topics/_raw_output.txt");
        mkdirSync("topics", { recursive: true });
        writeFileSync("topics/_raw_output.txt", rawJson);
        process.exit(1);
    }

    // ── Write output ─────────────────────────────────────────────────────────
    mkdirSync("topics", { recursive: true });
    const outPath = `topics/${slug}.json`;
    writeFileSync(outPath, JSON.stringify(topicJson, null, 2));

    console.log(`\n  ✅ Written: ${outPath}`);
    console.log("\n  Next steps:");
    console.log(`  1. Validate:  npx tsx pipeline/stages/validate.ts ${outPath}`);
    console.log(`  2. Run:       npx tsx pipeline/run.ts ${outPath} --skip-heygen\n`);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
