/**
 * Stage 4.5: Freesound SFX Fetcher
 * ──────────────────────────────────
 * Searches Freesound.org for foley sound effects matching each visual event
 * type, downloads HQ preview MP3s (no OAuth2 needed), and saves them to
 * public/topics/{slug}/sfx/
 *
 * Uses the SFX catalogue (pipeline/sfx-catalogue.json) to map event types
 * to search queries and volume levels.
 *
 * API Docs: https://freesound.org/docs/api/
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";

// ── Types ────────────────────────────────────────────────────────────────────

interface SfxCatalogueEntry {
    query: string;
    filter: string;
    volume: number;
    description: string;
}

interface SfxCatalogue {
    sfx_events: Record<string, SfxCatalogueEntry>;
}

interface FreesoundResult {
    id: number;
    name: string;
    duration: number;
    avg_rating: number;
    license: string;
    previews: {
        "preview-hq-mp3": string;
        "preview-lq-mp3": string;
        "preview-hq-ogg": string;
        "preview-lq-ogg": string;
    };
}

interface FreesoundSearchResponse {
    count: number;
    results: FreesoundResult[];
}

export type SfxEventType =
    | "STOMP_IMPACT"
    | "HIGHLIGHTER_CIRCLE"
    | "Z_AXIS_SWOOSH"
    | "FLASHBULB_SHUTTER"
    | "REDACTION_REVEAL"
    | "INK_BLEED"
    | "CHART_DRAW";

export interface SfxManifestEntry {
    file: string;             // relative path from public/
    freesoundId: number;
    name: string;
    duration: number;
    license: string;
    volume: number;
    onsetSec: number;         // seconds of silence before first audible content
}

export interface SfxManifest {
    [eventType: string]: SfxManifestEntry;
}

// ── Freesound API ────────────────────────────────────────────────────────────

const FREESOUND_BASE = "https://freesound.org/apiv2";

async function searchFreesound(
    query: string,
    filter: string,
    apiKey: string,
): Promise<FreesoundResult | null> {
    const params = new URLSearchParams({
        query,
        filter: `${filter} license:("Attribution" OR "Creative Commons 0")`,
        fields: "id,name,duration,avg_rating,license,previews",
        sort: "rating_desc",
        page_size: "5",
        token: apiKey,
    });

    const url = `${FREESOUND_BASE}/search/text/?${params.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`    ⚠️  Freesound API error: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = (await res.json()) as FreesoundSearchResponse;
        if (data.count === 0 || data.results.length === 0) {
            console.warn(`    ⚠️  No results for query: "${query}"`);
            return null;
        }

        // Pick the top-rated result
        return data.results[0];
    } catch (err) {
        console.warn(`    ⚠️  Freesound fetch failed: ${(err as Error).message}`);
        return null;
    }
}

async function downloadPreview(url: string, outputPath: string): Promise<boolean> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`    ⚠️  Preview download failed: ${res.status}`);
            return false;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const dir = dirname(outputPath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(outputPath, buffer);
        return true;
    } catch (err) {
        console.warn(`    ⚠️  Download error: ${(err as Error).message}`);
        return false;
    }
}

// ── Onset detection — find where the actual sound starts ─────────────────────

/**
 * Uses ffmpeg silencedetect to find the first audible content in an audio file.
 * Returns the onset time in seconds (i.e. how much silence to skip).
 * Threshold: -25dB, minimum silence duration 0.03s.
 * If detection fails or no silence is found, returns 0.
 */
function detectOnset(filePath: string): number {
    try {
        const result = execSync(
            `ffmpeg -i "${filePath}" -af "silencedetect=noise=-25dB:d=0.03" -f null - 2>&1`,
            { encoding: "utf-8", timeout: 10_000 },
        );
        // Find the first "silence_end" line — that's where audio actually begins
        const match = result.match(/silence_end:\s*([\d.]+)/);
        if (match) {
            const onset = parseFloat(match[1]);
            // Only return meaningful onsets (> 30ms). Tiny gaps are irrelevant.
            return onset > 0.03 ? onset : 0;
        }
        return 0;
    } catch {
        // ffmpeg silencedetect runs via stderr, execSync may "fail" but output is in stdout
        // Try parsing from the error output
        try {
            const errResult = execSync(
                `ffmpeg -i "${filePath}" -af "silencedetect=noise=-25dB:d=0.03" -f null /dev/null 2>&1 || true`,
                { encoding: "utf-8", timeout: 10_000 },
            );
            const match = errResult.match(/silence_end:\s*([\d.]+)/);
            if (match) {
                const onset = parseFloat(match[1]);
                return onset > 0.03 ? onset : 0;
            }
        } catch {
            // give up
        }
        return 0;
    }
}

// ── Determine which SFX events a topic needs ─────────────────────────────────

interface TopicJSON {
    meta: { slug: string };
    scenes: Array<{
        index: number;
        heroType: string;
        typography?: { lines: Array<{ animation?: string }> };
        microReset?: { type: string };
        chart?: { type: string };
    }>;
    transitions: Array<{ from: number; to: number; type: string }>;
}

export function determineNeededSfx(topic: TopicJSON): Set<SfxEventType> {
    const needed = new Set<SfxEventType>();

    for (const scene of topic.scenes) {
        // STOMP_IMPACT — STATEMENT_STATE scenes with STOMP animation
        if (scene.typography?.lines.some((l) => l.animation === "STOMP")) {
            needed.add("STOMP_IMPACT");
        }

        // CHART_DRAW — DATA_STATE scenes with charts
        if (scene.chart) {
            needed.add("CHART_DRAW");
        }

        // MicroReset SFX
        if (scene.microReset) {
            switch (scene.microReset.type) {
                case "HIGHLIGHTER":
                    needed.add("HIGHLIGHTER_CIRCLE");
                    break;
                case "REDACTION_REVEAL":
                    needed.add("REDACTION_REVEAL");
                    break;
            }
        }
    }

    // Transition SFX
    for (const t of topic.transitions) {
        switch (t.type) {
            case "Z_AXIS_PORTAL":
                needed.add("Z_AXIS_SWOOSH");
                break;
            case "FLASHBULB":
                needed.add("FLASHBULB_SHUTTER");
                break;
            case "INK_BLEED":
                needed.add("INK_BLEED");
                break;
        }
    }

    return needed;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function fetchSfx(
    topic: TopicJSON,
    apiKey: string,
): Promise<SfxManifest> {
    const slug = topic.meta.slug;
    const sfxDir = resolve(`public/topics/${slug}/sfx`);
    const manifestPath = resolve(`public/topics/${slug}/sfx/manifest.json`);

    // Cache check: if manifest exists with all needed SFX, skip
    if (existsSync(manifestPath)) {
        const cached = JSON.parse(readFileSync(manifestPath, "utf-8")) as SfxManifest;
        const needed = determineNeededSfx(topic);
        const allPresent = [...needed].every(
            (evt) => cached[evt] && existsSync(resolve("public", cached[evt].file)),
        );
        if (allPresent) {
            console.log(`  ⏭️  SFX cached (${Object.keys(cached).length} effects)`);
            return cached;
        }
    }

    // Load catalogue
    const cataloguePath = resolve("pipeline/sfx-catalogue.json");
    if (!existsSync(cataloguePath)) {
        throw new Error(`SFX catalogue not found: ${cataloguePath}`);
    }
    const catalogue: SfxCatalogue = JSON.parse(readFileSync(cataloguePath, "utf-8"));

    // Determine needed SFX
    const needed = determineNeededSfx(topic);
    console.log(`  🔍 Need ${needed.size} SFX types: ${[...needed].join(", ")}`);

    if (!existsSync(sfxDir)) mkdirSync(sfxDir, { recursive: true });

    const manifest: SfxManifest = {};

    for (const eventType of needed) {
        const entry = catalogue.sfx_events[eventType];
        if (!entry) {
            console.warn(`  ⚠️  No catalogue entry for ${eventType}, skipping`);
            continue;
        }

        const outputPath = resolve(sfxDir, `${eventType}.mp3`);
        const relativePath = `topics/${slug}/sfx/${eventType}.mp3`;

        // Check if already downloaded
        if (existsSync(outputPath)) {
            const onset = detectOnset(outputPath);
            console.log(`  ✅ ${eventType} — cached (onset: ${onset.toFixed(3)}s)`);
            manifest[eventType] = {
                file: relativePath,
                freesoundId: 0,
                name: "cached",
                duration: 0,
                license: "cached",
                volume: entry.volume,
                onsetSec: onset,
            };
            continue;
        }

        console.log(`  🔎 ${eventType}: "${entry.query}"`);

        // Search Freesound
        const result = await searchFreesound(entry.query, entry.filter, apiKey);
        if (!result) {
            console.warn(`    ⚠️  No suitable sound found for ${eventType}`);
            continue;
        }

        console.log(`    📥 Found: "${result.name}" (${result.duration.toFixed(1)}s, ★${result.avg_rating.toFixed(1)})`);

        // Download HQ preview
        const previewUrl = result.previews["preview-hq-mp3"];
        const success = await downloadPreview(previewUrl, outputPath);
        if (!success) {
            console.warn(`    ⚠️  Failed to download ${eventType}`);
            continue;
        }

        // Detect onset — how much leading silence to skip
        const onset = detectOnset(outputPath);

        manifest[eventType] = {
            file: relativePath,
            freesoundId: result.id,
            name: result.name,
            duration: result.duration,
            license: result.license,
            volume: entry.volume,
            onsetSec: onset,
        };

        console.log(`    ✅ Saved: ${relativePath} (onset: ${onset.toFixed(3)}s)`);

        // Rate limit: 100ms between requests
        await new Promise((r) => setTimeout(r, 100));
    }

    // Save manifest
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`  📋 SFX manifest: ${Object.keys(manifest).length} effects saved`);

    return manifest;
}
