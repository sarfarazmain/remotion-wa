/**
 * Pipeline Stage 2: HeyGen Avatar Video (Manual Web + Auto-Resume)
 * ─────────────────────────────────────────────────────────────────
 * HeyGen web generates the FULL narration video + audio in one step.
 * No separate TTS needed — the avatar video IS the audio source.
 *
 * Manual workflow optimized for minimum friction:
 *   1. Pipeline prints the FULL narration script to paste into HeyGen web
 *   2. You generate on HeyGen web → download MP4
 *   3. Pipeline detects the NEW .mp4 in ~/Downloads automatically
 *   4. Copies it to public/topics/{slug}/avatar.mp4 and resumes
 *
 * The avatar.mp4 provides:
 *   - Lip-synced avatar video for PhantomHost windows
 *   - Full narration audio track for the entire composition
 *
 * Drop zone: public/topics/{slug}/avatar.mp4
 * Auto-scan: ~/Downloads/*.mp4 (newest file after pipeline start)
 */

import { existsSync, statSync, copyFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { getTopicPaths, getDownloadsDir } from "../paths";

const MIN_VIDEO_SIZE = 50_000;  // 50KB minimum
const POLL_INTERVAL_MS = 3_000; // Check every 3 seconds
const MAX_WAIT_MINUTES = 30;

interface HeyGenConfig {
    apiKey: string;
    avatarId: string;
    voiceId: string;
}

interface HeyGenResult {
    videoPath: string;
    videoId: string;
    durationSeconds: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getVideoDuration(filePath: string): number {
    try {
        const { execSync } = require("child_process");
        const result = execSync(
            `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
            { stdio: "pipe", timeout: 10_000 },
        );
        return parseFloat(result.toString().trim()) || 0;
    } catch {
        return 0;
    }
}

/**
 * Format narration text for clipboard-ready display.
 * Wraps at ~70 chars per line for terminal readability.
 */
function formatNarrationForDisplay(narration: string, indent: string = "  "): string {
    const words = narration.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        if (currentLine.length + word.length + 1 > 70) {
            lines.push(`${indent}${currentLine.trim()}`);
            currentLine = word;
        } else {
            currentLine += (currentLine ? " " : "") + word;
        }
    }
    if (currentLine) lines.push(`${indent}${currentLine.trim()}`);

    return lines.join("\n");
}

/**
 * Find the newest .mp4 file in ~/Downloads that was created/modified
 * AFTER `afterTimestamp`. Returns null if none found.
 */
function findNewestDownload(afterTimestamp: number): string | null {
    const downloadsDir = getDownloadsDir();
    if (!existsSync(downloadsDir)) return null;

    try {
        const files = readdirSync(downloadsDir)
            .filter((f) => f.endsWith(".mp4") && !f.startsWith("."))
            .map((f) => {
                const fullPath = join(downloadsDir, f);
                try {
                    const stats = statSync(fullPath);
                    return { path: fullPath, name: f, mtime: stats.mtimeMs, size: stats.size };
                } catch {
                    return null;
                }
            })
            .filter((f): f is NonNullable<typeof f> =>
                f !== null && f.mtime > afterTimestamp && f.size >= MIN_VIDEO_SIZE
            )
            .sort((a, b) => b.mtime - a.mtime); // Newest first

        return files.length > 0 ? files[0].path : null;
    } catch {
        return null;
    }
}

/**
 * Print clipboard-ready instructions with FULL narration text.
 * HeyGen web handles both video + audio — no separate TTS needed.
 */
function printManualInstructions(
    narrationText: string,
    config: HeyGenConfig,
    outputPath: string,
) {
    const absPath = resolve(outputPath);
    const wordCount = narrationText.split(/\s+/).length;
    const estDuration = Math.round(wordCount / 2.5); // ~2.5 words/sec

    console.log("");
    console.log("  ┌──────────────────────────────────────────────────────────────┐");
    console.log("  │  🎬  HEYGEN WEB — FULL NARRATION VIDEO                       │");
    console.log("  ├──────────────────────────────────────────────────────────────┤");
    console.log("  │                                                              │");
    console.log("  │  1. Go to: https://app.heygen.com/create/avatar-video       │");
    console.log(`  │  2. Avatar: ${config.avatarId.padEnd(47)}│`);
    console.log("  │  3. Paste the FULL script below                             │");
    console.log("  │  4. Generate → Download MP4                                 │");
    console.log("  │                                                              │");
    console.log(`  │  📝 ${wordCount} words · ~${estDuration}s estimated duration${" ".repeat(Math.max(0, 28 - String(wordCount).length - String(estDuration).length))}│`);
    console.log("  │                                                              │");
    console.log("  │  Pipeline will AUTO-DETECT your download. No renaming.      │");
    console.log("  └──────────────────────────────────────────────────────────────┘");
    console.log("");
    console.log("  ══ FULL SCRIPT — COPY EVERYTHING BELOW ═══════════════════════");
    console.log("");
    console.log(formatNarrationForDisplay(narrationText));
    console.log("");
    console.log("  ══════════════════════════════════════════════════════════════");
    console.log("");
    console.log(`  📁 Or manually place file at:`);
    console.log(`     ${absPath}`);
    console.log("");
}

/**
 * Watch for the avatar file — either directly placed or auto-detected
 * from ~/Downloads.
 */
async function waitForAvatarFile(
    outputPath: string,
    watchStartTime: number,
): Promise<void> {
    const maxWaitMs = MAX_WAIT_MINUTES * 60 * 1000;
    let lastLog = Date.now();

    while (Date.now() - watchStartTime < maxWaitMs) {
        // Check 1: Did user place file directly?
        if (existsSync(outputPath)) {
            const size = statSync(outputPath).size;
            if (size >= MIN_VIDEO_SIZE) return;
        }

        // Check 2: New .mp4 in ~/Downloads since we started waiting?
        const newestDownload = findNewestDownload(watchStartTime);
        if (newestDownload) {
            const name = newestDownload.split("/").pop() || "";
            const size = statSync(newestDownload).size;
            console.log(`\n  📥 Detected new download: ${name} (${(size / 1024 / 1024).toFixed(1)}MB)`);
            console.log(`  📦 Copying to ${outputPath}...`);
            copyFileSync(newestDownload, outputPath);
            return;
        }

        // Status update every 15s
        if (Date.now() - lastLog > 15_000) {
            const elapsed = Math.floor((Date.now() - watchStartTime) / 1000);
            const min = Math.floor(elapsed / 60);
            const sec = elapsed % 60;
            process.stdout.write(`\r  ⏳ Watching ~/Downloads for new .mp4... (${min}m${sec}s)   `);
            lastLog = Date.now();
        }

        await sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`Timed out after ${MAX_WAIT_MINUTES} minutes waiting for avatar file`);
}

/**
 * Main entry point.
 *
 * Output: public/topics/{slug}/avatar.mp4
 */
export async function generateAvatarVideo(
    fullNarration: string,
    slug: string,
    config: HeyGenConfig,
): Promise<HeyGenResult> {
    const paths = getTopicPaths(slug);
    const outputPath = paths.avatar;

    // Cache: skip if valid file exists
    if (existsSync(outputPath)) {
        const size = statSync(outputPath).size;
        if (size >= MIN_VIDEO_SIZE) {
            const duration = getVideoDuration(outputPath);
            console.log(`  ⏭️  Avatar exists: ${outputPath} (${(size / 1024).toFixed(0)}KB, ${duration.toFixed(1)}s)`);
            return {
                videoPath: outputPath,
                videoId: "cached",
                durationSeconds: duration,
            };
        }
    }

    // Print instructions and wait
    printManualInstructions(fullNarration, config, outputPath);

    const watchStart = Date.now();
    console.log("  👀 Watching for file...\n");

    await waitForAvatarFile(outputPath, watchStart);

    // File found
    const size = statSync(outputPath).size;
    const duration = getVideoDuration(outputPath);
    const waitSec = Math.floor((Date.now() - watchStart) / 1000);
    console.log(`\n  ✅ Avatar ready! (${(size / 1024 / 1024).toFixed(1)}MB, ${duration.toFixed(1)}s, waited ${waitSec}s)`);
    console.log("  ▶️  Resuming pipeline...\n");

    return {
        videoPath: outputPath,
        videoId: "manual",
        durationSeconds: duration,
    };
}
