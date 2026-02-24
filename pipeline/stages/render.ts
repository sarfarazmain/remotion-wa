/**
 * Pipeline Stage 6: Remotion Render
 * ──────────────────────────────────
 * Renders the WealthArchive composition to an MP4 file using Remotion CLI.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";

interface RenderConfig {
    compositionId?: string;
    entryPoint?: string;
    codec?: string;
    concurrency?: number;
}

interface RenderResult {
    outputPath: string;
    durationMs: number;
}

/**
 * Render the composition to video.
 */
export function renderVideo(
    slug: string,
    config: RenderConfig = {},
): RenderResult {
    const {
        compositionId = "WealthArchive",
        entryPoint = "src/index.ts",
        codec = "h264",
        concurrency = 4,  // 50% of M3's 8 cores — balanced for 8GB RAM
    } = config;

    const outputDir = "out";
    const outputPath = `${outputDir}/${slug}.mp4`;

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    const cmd = [
        "npx remotion render",
        entryPoint,
        compositionId,
        outputPath,
        `--codec ${codec}`,
        `--concurrency ${concurrency}`,
        "--timeout=120000",    // 120s per-frame timeout (aligned with dashboard)
        "--gl=angle",          // GPU-accelerated rendering via Metal/ANGLE on Apple Silicon
        "--log=verbose",
    ].join(" ");

    console.log(`  🎬 Rendering: ${compositionId} → ${outputPath}`);
    console.log(`  📐 Command: ${cmd}`);

    const startTime = Date.now();

    try {
        execSync(cmd, {
            stdio: "inherit",
            timeout: 3_600_000, // 60 minute hard cap
            env: {
                ...process.env,
                NODE_OPTIONS: "--max-old-space-size=8192",
            },
        });
    } catch (err) {
        throw new Error(`Remotion render failed: ${(err as Error).message}`);
    }

    const durationMs = Date.now() - startTime;

    if (!existsSync(outputPath)) {
        throw new Error(`Render completed but output file not found: ${outputPath}`);
    }

    console.log(`  ✅ Render complete in ${(durationMs / 1000).toFixed(1)}s`);

    return { outputPath, durationMs };
}
