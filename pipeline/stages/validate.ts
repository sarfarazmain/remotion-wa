/**
 * Pipeline Stage 1: Validate
 * ──────────────────────────
 * Parses and validates topic.json against the Zod schema.
 * Enforces SOP constraints beyond basic type checking.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";
import { TopicJSONSchema, type TopicJSON } from "../schema";

interface ValidationResult {
    success: boolean;
    data?: TopicJSON;
    errors?: string[];
}

/**
 * Additional SOP constraint checks beyond Zod schema validation.
 * Returns { errors, warnings } — errors are hard failures, warnings are informational.
 */
function sopChecks(data: TopicJSON): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ── Scene type distribution ──
    // SOP: Must mix scene types (no more than 3 consecutive same heroType)
    for (let i = 0; i < data.scenes.length - 2; i++) {
        const a = data.scenes[i].heroType;
        const b = data.scenes[i + 1].heroType;
        const c = data.scenes[i + 2].heroType;
        if (a === b && b === c) {
            warnings.push(
                `SOP Warning: 3 consecutive ${a} scenes at index ${i + 1}-${i + 3}. ` +
                `Vary scene types for visual rhythm.`
            );
        }
    }

    // ── Transition variety ──
    // SOP: No more than 3 consecutive same transition type
    for (let i = 0; i < data.transitions.length - 2; i++) {
        const a = data.transitions[i].type;
        const b = data.transitions[i + 1].type;
        const c = data.transitions[i + 2].type;
        if (a === b && b === c) {
            warnings.push(
                `SOP Warning: 3 consecutive ${a} transitions at index ${i + 1}-${i + 3}.`
            );
        }
    }

    // ── Row breaks ──
    // SOP: Transitions at row boundaries (every 4 scenes) should use INFINITE_DESK_DOWN
    const sceneCount = data.scenes.length;
    const cols = 4;
    for (let i = cols; i < sceneCount; i += cols) {
        const transIdx = i - 1; // Transition from scene i to i+1 (0-indexed in transitions)
        if (transIdx < data.transitions.length) {
            const trans = data.transitions[transIdx];
            if (trans.type !== "INFINITE_DESK_DOWN") {
                warnings.push(
                    `SOP Info: Transition ${trans.from}→${trans.to} crosses a grid row. ` +
                    `Consider INFINITE_DESK_DOWN (currently ${trans.type}).`
                );
            }
        }
    }

    // ── BGM file must exist on disk ──
    // Hard error: render WILL fail if BGM file is missing
    const bgmPath = resolve(process.cwd(), "public", "bgm", `${data.bgm.trackId}.mp3`);
    if (!existsSync(bgmPath)) {
        // List available files for helpful error message
        const bgmDir = resolve(process.cwd(), "public", "bgm");
        let available: string[] = [];
        try {
            available = readdirSync(bgmDir)
                .filter((f) => f.endsWith(".mp3"))
                .map((f) => f.replace(".mp3", ""));
        } catch { /* dir may not exist */ }
        const hint = available.length > 0
            ? ` Available: ${available.join(", ")}`
            : "";
        errors.push(
            `BGM file not found: public/bgm/${data.bgm.trackId}.mp3. ` +
            `Render will fail without this file.${hint}`
        );
    }

    if (!data.bgm.trackId.startsWith("bgm_")) {
        warnings.push(`BGM Warning: trackId "${data.bgm.trackId}" doesn't match catalogue naming convention (bgm_*).`);
    }

    // ── Text length enforcement ──
    for (const scene of data.scenes) {
        if (scene.typography) {
            for (const line of scene.typography.lines) {
                if (line.text.length > 18) {
                    warnings.push(
                        `SOP Violation: Scene ${scene.index} typography line "${line.text}" ` +
                        `exceeds 18-char limit (${line.text.length} chars).`
                    );
                }
            }
        }
        if (scene.declaration) {
            for (const line of scene.declaration.lines) {
                if (line.text.length > 18) {
                    warnings.push(
                        `SOP Violation: Scene ${scene.index} declaration line "${line.text}" ` +
                        `exceeds 18-char limit (${line.text.length} chars).`
                    );
                }
            }
        }
    }

    return { errors, warnings };
}

/**
 * Validate a topic JSON file.
 */
export function validateTopicJSON(filePath: string): ValidationResult {
    // Read file
    let raw: string;
    try {
        raw = readFileSync(filePath, "utf-8");
    } catch (err) {
        return {
            success: false,
            errors: [`Failed to read file: ${filePath} — ${(err as Error).message}`],
        };
    }

    // Parse JSON
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        return {
            success: false,
            errors: [`Invalid JSON: ${(err as Error).message}`],
        };
    }

    // Zod validation
    const result = TopicJSONSchema.safeParse(parsed);

    if (!result.success) {
        const errors = result.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        return { success: false, errors };
    }

    // SOP checks — errors are hard failures, warnings are informational
    const sop = sopChecks(result.data);
    if (sop.warnings.length > 0) {
        console.warn("\n⚠️  SOP Warnings:");
        for (const w of sop.warnings) {
            console.warn(`   ${w}`);
        }
        console.warn("");
    }

    if (sop.errors.length > 0) {
        console.error("\n❌  Asset Errors:");
        for (const e of sop.errors) {
            console.error(`   ${e}`);
        }
        console.error("");
        return { success: false, errors: sop.errors };
    }

    return { success: true, data: result.data };
}

// ── CLI entry point ──────────────────────────────────────────────────────────

if (process.argv[1]?.endsWith("validate.ts") || process.argv[1]?.endsWith("validate.js")) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: npx tsx pipeline/stages/validate.ts <topic.json>");
        process.exit(1);
    }

    console.log(`📋 Validating ${filePath}...`);
    const result = validateTopicJSON(filePath);

    if (result.success) {
        console.log(`✅ Valid! ${result.data!.scenes.length} scenes, ${result.data!.transitions.length} transitions.`);
        console.log(`   Title: "${result.data!.meta.title}" (${result.data!.meta.slug})`);
        console.log(`   BGM: ${result.data!.bgm.trackId}`);
        console.log(`   Archetype: ${result.data!.meta.archetype}`);
    } else {
        console.error("❌ Validation failed:");
        for (const err of result.errors!) {
            console.error(`   ${err}`);
        }
        process.exit(1);
    }
}
