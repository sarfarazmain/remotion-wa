/**
 * Pipeline Path Resolver
 * ──────────────────────
 * Central source of truth for all file paths in the pipeline.
 * Every stage imports from here — no hardcoded paths anywhere else.
 *
 * Folder structure:
 *   public/topics/{slug}/
 *     ├── avatar.mp4         ← HeyGen web video (audio + video source)
 *     ├── avatar.json        ← Whisper word-level timestamps
 *     └── assets/            ← Pexels media per scene
 *         ├── manifest.json
 *         ├── s1_video.mp4
 *         ├── s1_image.jpg
 *         └── ...
 *
 *   out/{slug}.mp4            ← Final rendered video
 *   out/{slug}.json           ← Copy of topic JSON
 *   out/{slug}.meta.json      ← Render metadata
 */

import { mkdirSync } from "fs";
import { resolve } from "path";

export interface TopicPaths {
    slug: string;

    /** Root folder: public/topics/{slug}/ */
    topicDir: string;

    /** HeyGen avatar video (audio + video source): public/topics/{slug}/avatar.mp4 */
    avatar: string;

    /** Whisper transcript: public/topics/{slug}/avatar.json */
    transcript: string;

    /** Per-scene assets folder: public/topics/{slug}/assets/ */
    assetsDir: string;

    /** Asset manifest: public/topics/{slug}/assets/manifest.json */
    assetManifest: string;

    /** Final render output: out/{slug}.mp4 */
    renderOutput: string;

    /**
     * Remotion-relative path to avatar (for staticFile()).
     * This is relative to public/ — e.g. "topics/financial-repression/avatar.mp4"
     */
    avatarStaticPath: string;
}

/**
 * Build all paths for a given topic slug.
 * Also ensures the topic directory exists.
 */
export function getTopicPaths(slug: string): TopicPaths {
    const topicDir = `public/topics/${slug}`;
    const assetsDir = `${topicDir}/assets`;

    // Ensure directories exist
    mkdirSync(topicDir, { recursive: true });
    mkdirSync(assetsDir, { recursive: true });

    return {
        slug,
        topicDir,
        avatar: `${topicDir}/avatar.mp4`,
        transcript: `${topicDir}/avatar.json`,
        assetsDir,
        assetManifest: `${assetsDir}/manifest.json`,
        renderOutput: `out/${slug}.mp4`,

        // Remotion staticFile paths (relative to public/)
        avatarStaticPath: `topics/${slug}/avatar.mp4`,
    };
}

/**
 * Get absolute path for display in terminal instructions.
 */
export function getAbsolutePath(relativePath: string): string {
    return resolve(relativePath);
}

/**
 * Get the user's Downloads folder path.
 */
export function getDownloadsDir(): string {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return `${home}/Downloads`;
}
