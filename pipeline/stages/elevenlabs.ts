/**
 * Pipeline Stage 2A: ElevenLabs Text-to-Speech
 * ──────────────────────────────────────────────
 * Generates full narration audio via ElevenLabs TTS API.
 * This replaces HeyGen for audio generation (much cheaper, faster).
 *
 * Output: public/{slug}_narration.mp3  — full narration audio
 *         public/{slug}_avatar_clip.mp3 — trimmed ~8s clip for HeyGen lip-sync
 *
 * The avatar_clip.mp3 is a short segment (first ~8s) that HeyGen will
 * lip-sync to the Brandon avatar for the PhantomHost windows.
 */

import { writeFileSync, existsSync, statSync } from "fs";
import { execSync } from "child_process";
import https from "https";
import { URL } from "url";
import { getTopicPaths } from "../paths";

const ELEVENLABS_BASE = "https://api.elevenlabs.io";
const MIN_AUDIO_SIZE = 10_000; // 10KB minimum — anything smaller is likely an error response

interface ElevenLabsConfig {
    apiKey: string;
    voiceId: string;
    modelId?: string;
}

interface ElevenLabsResult {
    narrationPath: string;     // Full narration audio
    avatarClipPath: string;    // Short clip for HeyGen lip-sync
    clipDurationSeconds: number;
}

/**
 * Generate speech from text via ElevenLabs TTS API.
 * Returns raw audio bytes (mp3).
 */
function generateSpeech(
    text: string,
    config: ElevenLabsConfig,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const url = new URL(`/v1/text-to-speech/${config.voiceId}`, ELEVENLABS_BASE);

        const body = JSON.stringify({
            text,
            model_id: config.modelId || "eleven_multilingual_v2",
            output_format: "mp3_44100_128",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.3,
                use_speaker_boost: true,
            },
        });

        const options = {
            method: "POST",
            hostname: url.hostname,
            path: url.pathname,
            headers: {
                "xi-api-key": config.apiKey,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
                "Content-Length": Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            if (res.statusCode && res.statusCode >= 400) {
                let errData = "";
                res.on("data", (chunk) => (errData += chunk));
                res.on("end", () => {
                    reject(new Error(`ElevenLabs API error ${res.statusCode}: ${errData}`));
                });
                return;
            }

            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
                const buffer = Buffer.concat(chunks);
                if (buffer.length < MIN_AUDIO_SIZE) {
                    reject(new Error(`ElevenLabs audio too small (${buffer.length} bytes) — likely an error`));
                    return;
                }
                resolve(buffer);
            });
            res.on("error", reject);
        });

        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

/**
 * Trim audio to a specific duration using ffmpeg.
 * Creates a short clip for HeyGen avatar lip-sync.
 */
function trimAudio(inputPath: string, outputPath: string, durationSeconds: number): void {
    const cmd = `ffmpeg -y -i "${inputPath}" -t ${durationSeconds} -c copy "${outputPath}"`;
    try {
        execSync(cmd, { stdio: "pipe", timeout: 30_000 });
    } catch (err) {
        throw new Error(`ffmpeg trim failed: ${(err as Error).message}`);
    }
}

/**
 * Get audio duration in seconds using ffprobe.
 */
function getAudioDuration(filePath: string): number {
    try {
        const result = execSync(
            `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
            { stdio: "pipe", timeout: 10_000 },
        );
        return parseFloat(result.toString().trim());
    } catch {
        return 0;
    }
}

/**
 * Main entry point: Generate narration audio via ElevenLabs.
 *
 * Produces:
 *   1. Full narration MP3 (for Whisper + composition audio)
 *   2. Short avatar clip MP3 (~8s for HeyGen lip-sync)
 *
 * The avatar clip duration is calculated from PhantomHost windows:
 *   HOOK (0-45 frames = 1.5s) + BRIDGE (~2s) + VERDICT (~3s) + buffer = ~8s
 */
export async function generateNarrationAudio(
    narrationText: string,
    slug: string,
    config: ElevenLabsConfig,
    avatarClipDuration: number = 8,
): Promise<ElevenLabsResult> {
    const paths = getTopicPaths(slug);
    const narrationPath = paths.narration;
    const avatarClipPath = paths.avatarClip;

    // Cache: skip if narration already exists AND is valid size
    if (existsSync(narrationPath)) {
        const size = statSync(narrationPath).size;
        if (size >= MIN_AUDIO_SIZE) {
            console.log(`  ⏭️  Narration audio exists: ${narrationPath} (${(size / 1024).toFixed(0)}KB)`);

            // Still generate clip if missing
            if (!existsSync(avatarClipPath)) {
                console.log(`  ✂️  Trimming avatar clip (${avatarClipDuration}s)...`);
                trimAudio(narrationPath, avatarClipPath, avatarClipDuration);
            }

            const clipDuration = getAudioDuration(avatarClipPath);
            return { narrationPath, avatarClipPath, clipDurationSeconds: clipDuration };
        } else {
            console.log(`  ⚠️  Existing narration too small (${size}B) — regenerating`);
        }
    }

    // Generate full narration
    console.log("  🎙️  Generating narration via ElevenLabs...");
    console.log(`  📝 Text: ${narrationText.length} chars`);
    console.log(`  🎤 Voice: ${config.voiceId}`);
    console.log(`  🧠 Model: ${config.modelId || "eleven_multilingual_v2"}`);

    const audioBuffer = await generateSpeech(narrationText, config);
    writeFileSync(narrationPath, audioBuffer);

    const fullDuration = getAudioDuration(narrationPath);
    const fileSize = statSync(narrationPath).size;
    console.log(`  ✅ Narration saved: ${narrationPath} (${(fileSize / 1024).toFixed(0)}KB, ${fullDuration.toFixed(1)}s)`);

    // Trim short clip for HeyGen avatar lip-sync
    console.log(`  ✂️  Trimming avatar clip (${avatarClipDuration}s)...`);
    trimAudio(narrationPath, avatarClipPath, avatarClipDuration);

    const clipDuration = getAudioDuration(avatarClipPath);
    console.log(`  ✅ Avatar clip: ${avatarClipPath} (${clipDuration.toFixed(1)}s)`);

    return {
        narrationPath,
        avatarClipPath,
        clipDurationSeconds: clipDuration,
    };
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("elevenlabs.ts") || process.argv[1]?.endsWith("elevenlabs.js")) {
    const dotenv = require("dotenv");
    dotenv.config();

    const text = process.argv[2] || "Hello, this is a test narration for the video pipeline.";
    const slug = process.argv[3] || "test";

    const config: ElevenLabsConfig = {
        apiKey: process.env.ELEVENLABS_API_KEY || "",
        voiceId: process.env.ELEVENLABS_VOICE_ID || "",
    };

    if (!config.apiKey || !config.voiceId) {
        console.error("❌ Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env");
        process.exit(1);
    }

    console.log("🎙️  ElevenLabs TTS Generator");
    generateNarrationAudio(text, slug, config)
        .then((result) => {
            console.log("\n✅ Done!");
            console.log(`  Narration: ${result.narrationPath}`);
            console.log(`  Avatar clip: ${result.avatarClipPath}`);
            console.log(`  Clip duration: ${result.clipDurationSeconds}s`);
        })
        .catch((err) => {
            console.error("\n❌ Failed:", err.message);
            process.exit(1);
        });
}
