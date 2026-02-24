/**
 * Pipeline Stage 4.7: Optimize Video Assets for Render Performance
 * ─────────────────────────────────────────────────────────────────
 * Re-encodes all scene videos + avatar for maximum Remotion render speed:
 *   - fps=30 (match composition, eliminate per-frame ffmpeg resample)
 *   - keyframe every 1s (instant random-access seeks vs 3-10s decodes)
 *   - strip audio tracks (scene videos are always muted)
 *   - trim to scene duration + 1s buffer (reduce file size)
 *   - normalize resolution to 1080x1920
 *   - faststart moov atom for instant seeking
 *
 * Runs ONCE after fetchAssets. Skippable with --skip-optimize.
 * Optimized files are written in-place (overwriting the originals).
 * A `.optimized` marker file is written to skip re-optimization on re-runs.
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync, readFileSync } from "fs";
import path from "path";

interface OptimizeConfig {
    slug: string;
    sceneDurationsSeconds: number[];  // Duration of each scene in seconds
    fps?: number;
    sceneCrf?: number;
    avatarCrf?: number;
}

/**
 * Check if a video needs optimization by examining its properties.
 */
function getVideoInfo(videoPath: string): { fps: number; keyframeCount: number; duration: number; hasAudio: boolean; width: number; height: number } | null {
    try {
        const fpsRaw = execSync(
            `ffprobe -v quiet -show_entries stream=r_frame_rate -select_streams v -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
            { encoding: "utf-8", timeout: 10_000 }
        ).trim();

        const [num, den] = fpsRaw.split("/").map(Number);
        const fps = den ? num / den : num;

        const duration = parseFloat(
            execSync(
                `ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
                { encoding: "utf-8", timeout: 10_000 }
            ).trim()
        );

        const streams = execSync(
            `ffprobe -v quiet -show_entries stream=codec_type -of csv=p=0 "${videoPath}"`,
            { encoding: "utf-8", timeout: 10_000 }
        ).trim();
        const hasAudio = streams.split("\n").some(s => s.trim() === "audio");

        const resolution = execSync(
            `ffprobe -v quiet -show_entries stream=width,height -select_streams v -of csv=p=0 "${videoPath}"`,
            { encoding: "utf-8", timeout: 10_000 }
        ).trim();
        const [width, height] = resolution.split(",").map(Number);

        const keyframeLines = execSync(
            `ffprobe -v quiet -select_streams v -show_entries packet=flags -of csv=p=0 "${videoPath}"`,
            { encoding: "utf-8", timeout: 30_000 }
        ).trim();
        const keyframeCount = keyframeLines.split("\n").filter(l => l.includes("K")).length;

        return { fps, keyframeCount, duration, hasAudio, width, height };
    } catch {
        return null;
    }
}

/**
 * Re-encode a single video for optimal render performance.
 */
function optimizeVideo(
    inputPath: string,
    opts: {
        fps: number;
        crf: number;
        maxDuration?: number;
        stripAudio: boolean;
        normalizeResolution: boolean;
    }
): boolean {
    const tmpPath = inputPath + ".tmp.mp4";

    const vfFilters: string[] = [];
    vfFilters.push(`fps=${opts.fps}`);

    if (opts.normalizeResolution) {
        // Scale to 1080x1920, preserving aspect ratio with padding
        vfFilters.push("scale=1080:1920:force_original_aspect_ratio=decrease");
        vfFilters.push("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black");
    }

    const cmd = [
        `ffmpeg -i "${inputPath}"`,
        `-vf "${vfFilters.join(",")}"`,
        `-c:v libx264 -preset fast -crf ${opts.crf}`,
        `-g ${opts.fps} -keyint_min ${Math.floor(opts.fps / 2)}`,  // Keyframe every 1s
        opts.stripAudio ? "-an" : "",
        opts.maxDuration ? `-t ${opts.maxDuration}` : "",
        "-movflags +faststart",
        "-y",
        `"${tmpPath}"`,
    ].filter(Boolean).join(" ");

    try {
        execSync(cmd, { stdio: "pipe", timeout: 120_000 });

        // Verify the output exists and is valid
        if (!existsSync(tmpPath)) {
            console.warn(`    ⚠️  Output not created for ${path.basename(inputPath)}`);
            return false;
        }

        // Replace original with optimized
        execSync(`mv "${tmpPath}" "${inputPath}"`, { stdio: "pipe" });
        return true;
    } catch (err) {
        // Clean up tmp file if it exists
        try { execSync(`rm -f "${tmpPath}"`, { stdio: "pipe" }); } catch {}
        console.warn(`    ⚠️  Failed to optimize ${path.basename(inputPath)}: ${(err as Error).message}`);
        return false;
    }
}

/**
 * Main optimization function. Processes all videos for a topic.
 */
export function optimizeTopicAssets(config: OptimizeConfig): void {
    const { slug, sceneDurationsSeconds, fps = 30, sceneCrf = 23, avatarCrf = 20 } = config;

    const topicDir = `public/topics/${slug}`;
    const assetsDir = `${topicDir}/assets`;
    const markerFile = `${assetsDir}/.optimized`;

    // Check if already optimized
    if (existsSync(markerFile)) {
        const marker = readFileSync(markerFile, "utf-8").trim();
        console.log(`  ⏭️  Assets already optimized (${marker})`);
        return;
    }

    console.log(`  🎬 Optimizing video assets for render performance...`);
    console.log(`     Target: ${fps}fps, keyframe@1s, strip audio, trim to scene duration`);

    let optimized = 0;
    let skipped = 0;

    // ── Optimize scene videos ────────────────────────────────────────────────
    for (let i = 0; i < sceneDurationsSeconds.length; i++) {
        const sceneNum = i + 1;
        const videoPath = `${assetsDir}/scene${sceneNum}_video.mp4`;

        if (!existsSync(videoPath)) {
            continue;
        }

        const info = getVideoInfo(videoPath);
        if (!info) {
            console.log(`    S${sceneNum}: ⚠️  Could not read video info, skipping`);
            skipped++;
            continue;
        }

        const sceneDur = sceneDurationsSeconds[i];
        const maxDuration = sceneDur + 1; // 1s buffer

        // Check if optimization is needed
        const needsOptimization =
            Math.abs(info.fps - fps) > 0.5 ||         // Wrong FPS
            info.hasAudio ||                            // Has unnecessary audio
            info.duration > maxDuration + 2 ||          // Way longer than needed
            info.keyframeCount < info.duration * 0.8 || // Less than ~1 keyframe/sec
            (info.width !== 1080 && info.height !== 1920); // Wrong resolution

        if (!needsOptimization) {
            console.log(`    S${sceneNum}: ✓ Already optimal (${info.fps}fps, ${info.duration.toFixed(1)}s, ${info.keyframeCount} keyframes)`);
            skipped++;
            continue;
        }

        const sizeBefore = Math.round(parseInt(execSync(`stat -f%z "${videoPath}"`, { encoding: "utf-8" }).trim()) / 1024);
        console.log(`    S${sceneNum}: ${info.fps}fps→${fps}fps, ${info.duration.toFixed(1)}s→${maxDuration.toFixed(1)}s, ${info.keyframeCount} kf→~${Math.ceil(maxDuration)} kf`);

        const success = optimizeVideo(videoPath, {
            fps,
            crf: sceneCrf,
            maxDuration,
            stripAudio: true,
            normalizeResolution: true,
        });

        if (success) {
            const sizeAfter = Math.round(parseInt(execSync(`stat -f%z "${videoPath}"`, { encoding: "utf-8" }).trim()) / 1024);
            console.log(`         ${sizeBefore}KB → ${sizeAfter}KB (${Math.round((1 - sizeAfter / sizeBefore) * 100)}% smaller)`);
            optimized++;
        } else {
            skipped++;
        }
    }

    // ── Optimize avatar ─────────────────────────────────────────────────────
    const avatarPath = `${topicDir}/avatar.mp4`;
    if (existsSync(avatarPath)) {
        const info = getVideoInfo(avatarPath);
        if (info) {
            const needsOptimization =
                Math.abs(info.fps - fps) > 0.5 ||
                info.keyframeCount < info.duration * 0.8;

            if (needsOptimization) {
                console.log(`    Avatar: ${info.fps}fps→${fps}fps, ${info.keyframeCount} kf→~${Math.ceil(info.duration)} kf`);
                const sizeBefore = Math.round(parseInt(execSync(`stat -f%z "${avatarPath}"`, { encoding: "utf-8" }).trim()) / 1024);

                const success = optimizeVideo(avatarPath, {
                    fps,
                    crf: avatarCrf,
                    stripAudio: false, // Keep audio — narration.mp3 is extracted separately but avatar audio is used by PhantomHost
                    normalizeResolution: false, // Keep 720x1280 — correct size
                });

                if (success) {
                    const sizeAfter = Math.round(parseInt(execSync(`stat -f%z "${avatarPath}"`, { encoding: "utf-8" }).trim()) / 1024);
                    console.log(`         ${sizeBefore}KB → ${sizeAfter}KB`);
                    optimized++;
                }
            } else {
                console.log(`    Avatar: ✓ Already optimal`);
            }
        }
    }

    // Write marker
    const timestamp = new Date().toISOString();
    writeFileSync(markerFile, `optimized at ${timestamp}, fps=${fps}, sceneCrf=${sceneCrf}, avatarCrf=${avatarCrf}\n`);

    console.log(`  ✅ Optimization complete: ${optimized} re-encoded, ${skipped} already optimal`);
}
