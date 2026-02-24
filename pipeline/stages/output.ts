/**
 * Pipeline Stage 7: Output
 * ────────────────────────
 * Final stage: logs results, copies topic JSON alongside video,
 * and writes render metadata.
 */

import { copyFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "fs";

interface OutputConfig {
    videoPath: string;
    topicJsonPath: string;
    slug: string;
    totalFrames: number;
    totalSeconds: number;
    sceneCount: number;
    renderDurationMs: number;
}

interface RenderMeta {
    slug: string;
    renderedAt: string;
    videoFile: string;
    fileSize: string;
    duration: string;
    frames: number;
    fps: number;
    resolution: string;
    sceneCount: number;
    renderTimeSeconds: number;
}

/**
 * Finalize pipeline output.
 */
export function finalizeOutput(config: OutputConfig): RenderMeta {
    const { videoPath, topicJsonPath, slug, totalFrames, totalSeconds, sceneCount, renderDurationMs } = config;

    const outDir = "out";
    mkdirSync(outDir, { recursive: true });

    // Copy topic JSON alongside video for composition tracking
    const jsonDest = `${outDir}/${slug}.json`;
    copyFileSync(topicJsonPath, jsonDest);

    // Get file size (handle skip-render case where video doesn't exist yet)
    const videoExists = existsSync(videoPath);
    const fileSizeMB = videoExists
        ? (statSync(videoPath).size / (1024 * 1024)).toFixed(1)
        : "0";

    // Write render metadata
    const meta: RenderMeta = {
        slug,
        renderedAt: new Date().toISOString(),
        videoFile: videoPath,
        fileSize: `${fileSizeMB}MB`,
        duration: `${totalSeconds.toFixed(1)}s`,
        frames: totalFrames,
        fps: 30,
        resolution: "1080x1920",
        sceneCount,
        renderTimeSeconds: Math.round(renderDurationMs / 1000),
    };

    const metaPath = `${outDir}/${slug}.meta.json`;
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    // Log results
    console.log("\n" + "═".repeat(60));
    console.log("  ✅ PIPELINE COMPLETE");
    console.log("═".repeat(60));
    console.log(`  📽️  Video:    ${videoPath}`);
    console.log(`  📋 JSON:     ${jsonDest}`);
    console.log(`  📊 Meta:     ${metaPath}`);
    console.log(`  📐 Duration: ${totalSeconds.toFixed(1)}s (${totalFrames} frames @ 30fps)`);
    console.log(`  📦 Size:     ${fileSizeMB}MB`);
    console.log(`  🎬 Scenes:   ${sceneCount}`);
    console.log(`  ⏱️  Render:   ${(renderDurationMs / 1000).toFixed(1)}s`);
    console.log("═".repeat(60));

    return meta;
}
