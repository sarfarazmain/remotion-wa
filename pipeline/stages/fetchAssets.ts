/**
 * Pipeline Stage 4: Fetch Assets from Pexels + OpenAI GPT-4o-mini Batch Selection
 * ─────────────────────────────────────────────────────────────────────────────────
 * For each scene, fetches multiple candidates from Pexels, then uses
 * GPT-4o-mini to select the best match in a single BATCHED call (all scenes
 * at once), instead of one API call per scene.
 *
 * Flow:
 *   Pass 1 — Search Pexels for ALL scenes (videos + photos), collect candidates
 *   Pass 2 — ONE batch LLM call for all video selections
 *   Pass 3 — ONE batch LLM call for all photo selections
 *   Pass 4 — Download all winners
 *
 * Previous: 20-28 sequential LLM calls per video
 * Now:      2 LLM calls per video (10-14x reduction, no quality loss)
 *
 * SOP Rule: Stock Video = Atmosphere (Layer 2), Stock Image = Evidence (Layer 4)
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import https from "https";
import type { TopicJSON } from "../schema";

const PEXELS_API_BASE = "https://api.pexels.com";
const OPENAI_API_BASE = "https://api.openai.com";
const RATE_LIMIT_MS = 800; // Pexels rate limit
const CANDIDATES_PER_QUERY = 8; // Fetch 8 candidates per search

interface AssetManifest {
    [key: string]: string;
}

interface PexelsVideoCandidate {
    id: number;
    url: string;
    duration: number;
    width: number;
    height: number;
    downloadUrl: string;
    user: string;
}

interface PexelsPhotoCandidate {
    id: number;
    url: string;
    alt: string;
    width: number;
    height: number;
    downloadUrl: string;
    photographer: string;
}

interface SceneVideoData {
    sceneIndex: number;
    query: string;
    narration: string;
    heroType: string;
    candidates: PexelsVideoCandidate[];
}

interface ScenePhotoData {
    sceneIndex: number;
    query: string;
    narration: string;
    heroType: string;
    candidates: PexelsPhotoCandidate[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: string,
): Promise<{ status: number; data: string }> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method,
            headers,
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve({ status: res.statusCode || 0, data }));
        });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}

// ── Pexels Search (Multiple Candidates) ─────────────────────────────────────

async function searchPexelsVideos(
    query: string,
    apiKey: string,
): Promise<PexelsVideoCandidate[]> {
    const url = `${PEXELS_API_BASE}/videos/search?query=${encodeURIComponent(query)}&per_page=${CANDIDATES_PER_QUERY}&orientation=portrait&size=medium`;
    const resp = await httpsRequest("GET", url, { Authorization: apiKey });

    try {
        const json = JSON.parse(resp.data);
        if (!json.videos || json.videos.length === 0) return [];

        return json.videos.map((v: any) => {
            // Prefer HD portrait, then HD any, then first available
            const files = v.video_files || [];
            const portrait = files.find((f: any) => f.quality === "hd" && f.height > f.width);
            const hd = files.find((f: any) => f.quality === "hd");
            const best = portrait || hd || files[0];

            return {
                id: v.id,
                url: v.url,
                duration: v.duration,
                width: best?.width || 0,
                height: best?.height || 0,
                downloadUrl: best?.link || "",
                user: v.user?.name || "unknown",
            };
        });
    } catch {
        return [];
    }
}

async function searchPexelsPhotos(
    query: string,
    apiKey: string,
): Promise<PexelsPhotoCandidate[]> {
    const url = `${PEXELS_API_BASE}/v1/search?query=${encodeURIComponent(query)}&per_page=${CANDIDATES_PER_QUERY}&orientation=portrait&size=large`;
    const resp = await httpsRequest("GET", url, { Authorization: apiKey });

    try {
        const json = JSON.parse(resp.data);
        if (!json.photos || json.photos.length === 0) return [];

        return json.photos.map((p: any) => ({
            id: p.id,
            url: p.url,
            alt: p.alt || "",
            width: p.width,
            height: p.height,
            downloadUrl: p.src?.large2x || p.src?.large || p.src?.original,
            photographer: p.photographer || "unknown",
        }));
    } catch {
        return [];
    }
}

// ── OpenAI Batch LLM Selection ───────────────────────────────────────────────

/**
 * Select the best video for ALL scenes in a single GPT-4o-mini call.
 * Returns a map of sceneIndex → 0-based candidate index.
 */
async function llmSelectBestVideosBatch(
    scenes: SceneVideoData[],
    openaiKey: string,
): Promise<Record<number, number>> {
    // Only send scenes with >1 candidate (single candidate = auto-pick)
    const toSelect = scenes.filter((s) => s.candidates.length > 1);
    if (toSelect.length === 0) return {};

    const sceneSections = toSelect.map((s) => {
        const candidateLines = s.candidates.map((c, i) =>
            `  ${i + 1}. [ID:${c.id}] ${c.url} — ${c.duration}s, ${c.width}x${c.height}, by ${c.user}`
        ).join("\n");

        return `=== SCENE ${s.sceneIndex} ===
Narration: "${s.narration}"
Type: ${s.heroType}
Query: "${s.query}"
Candidates:
${candidateLines}`;
    }).join("\n\n");

    const prompt = `You are selecting the best stock video for each scene in a dark, cinematic documentary about economics and finance.

For each scene below, select the best candidate video. Reply with ONLY a JSON object mapping scene index (as string) to the selected candidate number (1-based integer).
Example: {"1": 3, "4": 1, "7": 5}

SELECTION CRITERIA:
- Prefer dark, moody, cinematic footage
- Abstract/textural backgrounds are better than literal depictions
- Portrait orientation strongly preferred (height > width)
- Longer duration preferred (loops better)
- Avoid faces, text overlays, or bright/cheerful content

SCENES TO SELECT FOR:
${sceneSections}

Reply with ONLY the JSON object. Nothing else.`;

    try {
        const body = JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        const resp = await httpsRequest(
            "POST",
            `${OPENAI_API_BASE}/v1/chat/completions`,
            {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body,
        );

        const json = JSON.parse(resp.data);
        const content = json.choices?.[0]?.message?.content?.trim() || "{}";
        const selections: Record<string, number> = JSON.parse(content);

        // Convert to sceneIndex → 0-based index
        const result: Record<number, number> = {};
        for (const [sceneStr, num] of Object.entries(selections)) {
            const sceneIdx = parseInt(sceneStr, 10);
            const candidateNum = typeof num === "number" ? num : parseInt(String(num), 10);
            const scene = toSelect.find((s) => s.sceneIndex === sceneIdx);
            if (scene && candidateNum >= 1 && candidateNum <= scene.candidates.length) {
                result[sceneIdx] = candidateNum - 1; // 0-indexed
            }
        }

        return result;
    } catch (err) {
        console.warn(`  ⚠️  Batch video LLM selection failed: ${(err as Error).message} — using first candidates`);
        return {};
    }
}

/**
 * Select the best photo for ALL scenes in a single GPT-4o-mini call.
 * Returns a map of sceneIndex → 0-based candidate index.
 */
async function llmSelectBestPhotosBatch(
    scenes: ScenePhotoData[],
    openaiKey: string,
): Promise<Record<number, number>> {
    const toSelect = scenes.filter((s) => s.candidates.length > 1);
    if (toSelect.length === 0) return {};

    const sceneSections = toSelect.map((s) => {
        const candidateLines = s.candidates.map((c, i) =>
            `  ${i + 1}. [ID:${c.id}] ${c.url} — "${c.alt?.substring(0, 60)}", ${c.width}x${c.height}, by ${c.photographer}`
        ).join("\n");

        return `=== SCENE ${s.sceneIndex} ===
Narration: "${s.narration}"
Type: ${s.heroType}
Query: "${s.query}"
Candidates:
${candidateLines}`;
    }).join("\n\n");

    const prompt = `You are selecting the best stock photo for each scene in a dark, cinematic documentary about economics and finance.

For each scene below, select the best candidate photo. Reply with ONLY a JSON object mapping scene index (as string) to the selected candidate number (1-based integer).
Example: {"2": 2, "5": 4, "9": 1}

SELECTION CRITERIA:
- Prefer sharp, documentary-grade imagery
- Specific and literal over abstract (evidence/exhibit material)
- Avoid stock photo clichés (handshakes, thumbs up, forced smiles)
- Portrait or square orientation preferred
- Should feel like archival evidence or serious journalism

SCENES TO SELECT FOR:
${sceneSections}

Reply with ONLY the JSON object. Nothing else.`;

    try {
        const body = JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        const resp = await httpsRequest(
            "POST",
            `${OPENAI_API_BASE}/v1/chat/completions`,
            {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body,
        );

        const json = JSON.parse(resp.data);
        const content = json.choices?.[0]?.message?.content?.trim() || "{}";
        const selections: Record<string, number> = JSON.parse(content);

        const result: Record<number, number> = {};
        for (const [sceneStr, num] of Object.entries(selections)) {
            const sceneIdx = parseInt(sceneStr, 10);
            const candidateNum = typeof num === "number" ? num : parseInt(String(num), 10);
            const scene = toSelect.find((s) => s.sceneIndex === sceneIdx);
            if (scene && candidateNum >= 1 && candidateNum <= scene.candidates.length) {
                result[sceneIdx] = candidateNum - 1; // 0-indexed
            }
        }

        return result;
    } catch (err) {
        console.warn(`  ⚠️  Batch photo LLM selection failed: ${(err as Error).message} — using first candidates`);
        return {};
    }
}

// ── Download ────────────────────────────────────────────────────────────────

function downloadFile(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const get = url.startsWith("https") ? https.get : require("http").get;
        get(url, (res: any) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                downloadFile(res.headers.location!, outputPath).then(resolve).catch(reject);
                return;
            }
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
                writeFileSync(outputPath, Buffer.concat(chunks));
                resolve();
            });
            res.on("error", reject);
        }).on("error", reject);
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all Pexels assets for a topic with batched LLM selection.
 *
 * Flow:
 *   Pass 1 — Search all Pexels queries (videos + photos), collecting candidates
 *   Pass 2 — ONE batch LLM call: select best video for all scenes
 *   Pass 3 — ONE batch LLM call: select best photo for all scenes
 *   Pass 4 — Download all selected assets
 */
export async function fetchAssets(
    topic: TopicJSON,
    pexelsApiKey: string,
    downloadLocally: boolean = true,
    openaiApiKey?: string,
): Promise<AssetManifest> {
    const slug = topic.meta.slug;
    const { getTopicPaths } = require("../paths");
    const paths = getTopicPaths(slug);
    const assetDir = paths.assetsDir;
    const manifest: AssetManifest = {};
    const useLLM = !!openaiApiKey;

    if (downloadLocally) {
        mkdirSync(assetDir, { recursive: true });
    }

    console.log(`  📦 Fetching assets for ${topic.scenes.length} scenes...`);
    if (useLLM) {
        console.log(`  🧠 GPT-4o-mini batch selection: ENABLED (${CANDIDATES_PER_QUERY} candidates/query → 2 LLM calls total)`);
    } else {
        console.log(`  ⚡ LLM selection: DISABLED (using first result)`);
    }

    // ── Pass 1: Search Pexels for all scenes ────────────────────────────────
    const videoScenes: SceneVideoData[] = [];
    const photoScenes: ScenePhotoData[] = [];
    const existingVideos: Set<number> = new Set();
    const existingPhotos: Set<number> = new Set();

    console.log(`\n  🔍 Pass 1: Searching Pexels for all ${topic.scenes.length} scenes...`);

    for (const scene of topic.scenes) {
        const i = scene.index;
        const videoPath = `${assetDir}/scene${i}_video.mp4`;
        const imagePath = `${assetDir}/scene${i}_image.jpg`;

        // ── Video ──
        if (downloadLocally && existsSync(videoPath)) {
            console.log(`  ⏭️  S${i} video exists — skipping search`);
            manifest[`scene${i}_video`] = `/topics/${slug}/assets/scene${i}_video.mp4`;
            existingVideos.add(i);
        } else if (scene.pexelsVideoQuery) {
            console.log(`  🔍 S${i} video: "${scene.pexelsVideoQuery}"`);
            const candidates = await searchPexelsVideos(scene.pexelsVideoQuery, pexelsApiKey);
            console.log(`     → ${candidates.length} candidates found`);
            videoScenes.push({
                sceneIndex: i,
                query: scene.pexelsVideoQuery,
                narration: scene.narration,
                heroType: scene.heroType,
                candidates,
            });
            await sleep(RATE_LIMIT_MS);
        }

        // ── Photo ──
        if (downloadLocally && existsSync(imagePath)) {
            console.log(`  ⏭️  S${i} image exists — skipping search`);
            manifest[`scene${i}_image`] = `/topics/${slug}/assets/scene${i}_image.jpg`;
            existingPhotos.add(i);
        } else if (scene.pexelsImageQuery) {
            console.log(`  🔍 S${i} image: "${scene.pexelsImageQuery}"`);
            const candidates = await searchPexelsPhotos(scene.pexelsImageQuery, pexelsApiKey);
            console.log(`     → ${candidates.length} candidates found`);
            photoScenes.push({
                sceneIndex: i,
                query: scene.pexelsImageQuery,
                narration: scene.narration,
                heroType: scene.heroType,
                candidates,
            });
            await sleep(RATE_LIMIT_MS);
        }
    }

    // ── Pass 2 & 3: Batch LLM selection ─────────────────────────────────────
    let videoSelections: Record<number, number> = {};
    let photoSelections: Record<number, number> = {};

    if (useLLM) {
        const videoScenesWithMultiple = videoScenes.filter((s) => s.candidates.length > 1);
        const photoScenesWithMultiple = photoScenes.filter((s) => s.candidates.length > 1);

        if (videoScenesWithMultiple.length > 0) {
            console.log(`\n  🧠 Pass 2: Batch video selection (${videoScenesWithMultiple.length} scenes → 1 LLM call)...`);
            videoSelections = await llmSelectBestVideosBatch(videoScenes, openaiApiKey!);
            console.log(`     → Selections: ${JSON.stringify(videoSelections)}`);
        } else {
            console.log(`\n  ⚡ Pass 2: No video scenes need LLM selection (all have ≤1 candidate)`);
        }

        if (photoScenesWithMultiple.length > 0) {
            console.log(`  🧠 Pass 3: Batch photo selection (${photoScenesWithMultiple.length} scenes → 1 LLM call)...`);
            photoSelections = await llmSelectBestPhotosBatch(photoScenes, openaiApiKey!);
            console.log(`     → Selections: ${JSON.stringify(photoSelections)}`);
        } else {
            console.log(`  ⚡ Pass 3: No photo scenes need LLM selection (all have ≤1 candidate)`);
        }
    }

    // ── Pass 4: Download winners ─────────────────────────────────────────────
    console.log(`\n  📥 Pass 4: Downloading selected assets...`);

    for (const sceneData of videoScenes) {
        const { sceneIndex, candidates } = sceneData;
        if (candidates.length === 0) {
            console.warn(`  ⚠️  S${sceneIndex} video: No candidates — skipping`);
            manifest[`scene${sceneIndex}_video`] = "";
            continue;
        }

        // Use LLM selection if available, else first candidate
        const bestIdx = videoSelections[sceneIndex] ?? 0;
        const winner = candidates[bestIdx];
        const selectedBy = useLLM && candidates.length > 1
            ? `LLM pick #${bestIdx + 1}`
            : candidates.length === 1 ? "only candidate" : "first (LLM off)";

        console.log(`  ✅ S${sceneIndex} video [${selectedBy}]: ${winner.url} (${winner.duration}s, ${winner.width}x${winner.height})`);

        if (downloadLocally && winner.downloadUrl) {
            const videoPath = `${assetDir}/scene${sceneIndex}_video.mp4`;
            await downloadFile(winner.downloadUrl, videoPath);
            manifest[`scene${sceneIndex}_video`] = `/topics/${slug}/assets/scene${sceneIndex}_video.mp4`;
            console.log(`     📥 Downloaded`);
        } else {
            manifest[`scene${sceneIndex}_video`] = winner.downloadUrl || "";
        }
    }

    for (const sceneData of photoScenes) {
        const { sceneIndex, candidates } = sceneData;
        if (candidates.length === 0) {
            console.warn(`  ⚠️  S${sceneIndex} image: No candidates — skipping`);
            manifest[`scene${sceneIndex}_image`] = "";
            continue;
        }

        const bestIdx = photoSelections[sceneIndex] ?? 0;
        const winner = candidates[bestIdx] as PexelsPhotoCandidate;
        const selectedBy = useLLM && candidates.length > 1
            ? `LLM pick #${bestIdx + 1}`
            : candidates.length === 1 ? "only candidate" : "first (LLM off)";

        console.log(`  ✅ S${sceneIndex} image [${selectedBy}]: "${winner.alt?.substring(0, 50)}" by ${winner.photographer}`);

        if (downloadLocally && winner.downloadUrl) {
            const imagePath = `${assetDir}/scene${sceneIndex}_image.jpg`;
            await downloadFile(winner.downloadUrl, imagePath);
            manifest[`scene${sceneIndex}_image`] = `/topics/${slug}/assets/scene${sceneIndex}_image.jpg`;
            console.log(`     📥 Downloaded`);
        } else {
            manifest[`scene${sceneIndex}_image`] = winner.downloadUrl || "";
        }
    }

    // Save manifest
    const manifestPath = `${assetDir}/manifest.json`;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`  📋 Manifest saved: ${manifestPath}`);

    const total = Object.keys(manifest).length;
    const found = Object.values(manifest).filter(Boolean).length;
    console.log(`  📊 Assets: ${found}/${total} fetched successfully`);

    return manifest;
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("fetchAssets.ts") || process.argv[1]?.endsWith("fetchAssets.js")) {
    const dotenv = require("dotenv");
    dotenv.config();
    const { readFileSync } = require("fs");
    const { TopicJSONSchema } = require("../schema");

    const topicPath = process.argv[2];
    const urlOnly = process.argv.includes("--url-only");

    if (!topicPath) {
        console.error("Usage: npx tsx pipeline/stages/fetchAssets.ts <topic.json> [--url-only]");
        process.exit(1);
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
        console.error("❌ Missing PEXELS_API_KEY in .env");
        process.exit(1);
    }

    const openaiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;
    const topic = TopicJSONSchema.parse(JSON.parse(readFileSync(topicPath, "utf-8")));

    console.log("📦 Pexels Asset Fetcher" + (openaiKey ? " + GPT-4o-mini Batch LLM" : ""));
    fetchAssets(topic, apiKey, !urlOnly, openaiKey)
        .then((manifest) => {
            const total = Object.keys(manifest).length;
            const found = Object.values(manifest).filter(Boolean).length;
            console.log(`\n✅ Done! ${found}/${total} assets fetched.`);
        })
        .catch((err) => {
            console.error("❌ Failed:", err.message);
            process.exit(1);
        });
}
