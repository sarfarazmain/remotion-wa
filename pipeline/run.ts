#!/usr/bin/env npx tsx
/**
 * Pipeline Master Orchestrator
 * ─────────────────────────────
 * Runs the full video production pipeline:
 *   1. Validate topic JSON
 *   2. Generate avatar video via HeyGen web (manual — prints full script)
 *   3. Transcribe avatar video with Whisper
 *   4. Fetch Pexels assets
 *   5. Generate code files
 *   6. Render with Remotion
 *   7. Output final video
 *
 * HeyGen web is used for BOTH video and audio — the avatar video
 * is the single source of truth for narration audio + lip-synced visuals.
 * No separate TTS step needed.
 *
 * Usage:
 *   npx tsx pipeline/run.ts topics/financial-repression.json
 *   npx tsx pipeline/run.ts topics/financial-repression.json --skip-heygen
 *   npx tsx pipeline/run.ts topics/financial-repression.json --skip-render
 */

import dotenv from "dotenv";
dotenv.config();

import { validateTopicJSON } from "./stages/validate";
import { generateAvatarVideo } from "./stages/heygen";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { transcribeAvatar } from "./stages/transcribe";
import { fetchAssets } from "./stages/fetchAssets";
import { fetchSfx } from "./stages/fetchSfx";
import { generateAllFiles } from "./stages/generate";
import { renderVideo } from "./stages/render";
import { finalizeOutput } from "./stages/output";
import { optimizeTopicAssets } from "./stages/optimizeAssets";

// ── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const topicJsonPathRaw = args.find((a) => !a.startsWith("--"));
const skipHeygen = args.includes("--skip-heygen");
const skipRender = args.includes("--skip-render");
const skipAssets = args.includes("--skip-assets");
const skipSfx = args.includes("--skip-sfx");
const skipOptimize = args.includes("--skip-optimize");
const urlOnlyAssets = args.includes("--url-only");

if (!topicJsonPathRaw) {
    console.error("Usage: npx tsx pipeline/run.ts <topic.json> [--skip-heygen] [--skip-render] [--skip-assets] [--skip-optimize] [--skip-sfx] [--url-only]");
    process.exit(1);
}
const topicJsonPath: string = topicJsonPathRaw;

// ── Environment checks ──────────────────────────────────────────────────────

function requireEnv(key: string): string {
    const val = process.env[key];
    if (!val) {
        console.error(`❌ Missing environment variable: ${key}`);
        console.error("   Check your .env file");
        process.exit(1);
    }
    return val;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const startTime = Date.now();

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║     🎬  VIDEO PRODUCTION PIPELINE                       ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    // ── Stage 1: Validate ────────────────────────────────────────────────────
    console.log("━━━ STAGE 1: VALIDATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const validation = validateTopicJSON(topicJsonPath);
    if (!validation.success || !validation.data) {
        console.error("❌ Validation failed. Fix topic JSON and retry.");
        process.exit(1);
    }
    const topic = validation.data;
    const slug = topic.meta.slug;
    console.log(`  ✅ "${topic.meta.title}" — ${topic.scenes.length} scenes\n`);

    // ── Stage 2: HeyGen Avatar (manual web generation) ─────────────────────
    console.log("━━━ STAGE 2: HEYGEN AVATAR (FULL VIDEO + AUDIO) ━━━━━━━━━━");
    let avatarVideoPath: string;
    if (skipHeygen) {
        avatarVideoPath = `public/topics/${slug}/avatar.mp4`;
        console.log(`  ⏭️  Skipped (--skip-heygen). Using: ${avatarVideoPath}\n`);
    } else {
        const heygenConfig = {
            apiKey: process.env.HEYGEN_API_KEY || "",
            avatarId: process.env.HEYGEN_AVATAR_ID || "Brandon_expressive3_public",
            voiceId: process.env.HEYGEN_VOICE_ID || "",
        };
        const heygenResult = await generateAvatarVideo(topic.narration, slug, heygenConfig);
        avatarVideoPath = heygenResult.videoPath;
        console.log("");
    }

    // ── Stage 2.5: Extract audio MP3 from avatar.mp4 (for fast <Audio> playback) ─
    console.log("━━━ STAGE 2.5: AUDIO EXTRACTION (ffmpeg) ━━━━━━━━━━━━━━━━━");
    const narrationMp3Path = `public/topics/${slug}/narration.mp3`;
    if (existsSync(narrationMp3Path)) {
        console.log(`  ⏭️  Narration MP3 exists: ${narrationMp3Path}\n`);
    } else {
        console.log(`  🔊 Extracting audio from ${avatarVideoPath}...`);
        try {
            execSync(
                `ffmpeg -i "${avatarVideoPath}" -vn -acodec libmp3lame -q:a 2 "${narrationMp3Path}" -y`,
                { stdio: "pipe", timeout: 60_000 }
            );
            console.log(`  ✅ Narration MP3 saved: ${narrationMp3Path}\n`);
        } catch (err) {
            console.warn(`  ⚠️  ffmpeg failed, render will use avatar.mp4 for audio: ${(err as Error).message}`);
        }
    }

    // ── Stage 3: Transcribe avatar video (source of both audio + video) ──────
    console.log("━━━ STAGE 3: WHISPER TRANSCRIPTION ━━━━━━━━━━━━━━━━━━━━━━━");
    const transcription = await transcribeAvatar(avatarVideoPath, topic);
    console.log("");

    // ── Stage 4: Fetch Assets ────────────────────────────────────────────────
    console.log("━━━ STAGE 4: PEXELS ASSETS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    let assetManifest: Record<string, string>;
    if (skipAssets) {
        console.log("  ⏭️  Skipped (--skip-assets)\n");
        assetManifest = {};
    } else {
        const pexelsKey = requireEnv("PEXELS_API_KEY");
        const openaiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY; // Optional: enables batched LLM asset selection
        assetManifest = await fetchAssets(topic, pexelsKey, !urlOnlyAssets, openaiKey);
        console.log("");
    }

    // ── Stage 4.3: Optimize video assets for render performance ────────────
    console.log("━━━ STAGE 4.3: OPTIMIZE ASSETS ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (skipOptimize) {
        console.log("  ⏭️  Skipped (--skip-optimize)\n");
    } else {
        // Scene durations in seconds (from topic JSON word counts → estimated, or from transcription)
        const sceneDurations = transcription.sceneTimings.map(
            (t: { startSec: number; endSec: number }) => t.endSec - t.startSec
        );
        optimizeTopicAssets({
            slug,
            sceneDurationsSeconds: sceneDurations,
        });
        console.log("");
    }

    // ── Stage 4.5: Fetch SFX from Freesound ────────────────────────────────
    console.log("━━━ STAGE 4.5: FREESOUND SFX ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    let sfxManifest: Record<string, any> = {};
    if (skipSfx) {
        console.log("  ⏭️  Skipped (--skip-sfx)\n");
    } else {
        const freesoundKey = process.env.FREESOUND_API_KEY;
        if (!freesoundKey) {
            console.warn("  ⚠️  FREESOUND_API_KEY not set, skipping SFX\n");
        } else {
            sfxManifest = await fetchSfx(topic as any, freesoundKey);
            console.log("");
        }
    }

    // ── Stage 5: Generate Code ───────────────────────────────────────────────
    console.log("━━━ STAGE 5: CODE GENERATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    generateAllFiles(topic, transcription.sceneTimings, assetManifest, sfxManifest);
    console.log("");

    // ── Stage 6: Render ──────────────────────────────────────────────────────
    let renderResult = { outputPath: `out/${slug}.mp4`, durationMs: 0 };
    if (skipRender) {
        console.log("━━━ STAGE 6: RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("  ⏭️  Skipped (--skip-render)\n");
    } else {
        console.log("━━━ STAGE 6: REMOTION RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        renderResult = renderVideo(slug);
        console.log("");
    }

    // ── Stage 7: Output ──────────────────────────────────────────────────────
    finalizeOutput({
        videoPath: renderResult.outputPath,
        topicJsonPath,
        slug,
        totalFrames: transcription.totalFrames,
        totalSeconds: transcription.totalSeconds,
        sceneCount: topic.scenes.length,
        renderDurationMs: renderResult.durationMs,
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n  ⏱️  Total pipeline time: ${totalTime}s`);
}

main().catch((err) => {
    console.error("\n💥 Pipeline failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
});
