/**
 * Pipeline Stage 3: Whisper Transcription
 * ────────────────────────────────────────
 * Runs OpenAI Whisper on the avatar video to get word-level timestamps.
 * Maps words to scenes and assigns cue events (HERO_WORD, HARD_CUT, etc.)
 * based on the topic JSON scene boundaries and hero word annotations.
 *
 * Output: Scene durations and per-scene cue point arrays.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import type { TopicJSON } from "../schema";

const FPS = 30;

// ── Types ────────────────────────────────────────────────────────────────────

export interface WhisperWord {
    word: string;
    start: number;  // seconds
    end: number;    // seconds
}

export interface WhisperSegment {
    id: number;
    text: string;
    start: number;
    end: number;
    words?: WhisperWord[];
}

export interface WhisperOutput {
    text: string;
    segments: WhisperSegment[];
    language: string;
}

export type CueEvent =
    | "SCENE_START"
    | "HERO_WORD"
    | "HARD_CUT"
    | "SOFT_PAUSE"
    | "CHART_DRAW_START"
    | "DATA_STAMP"
    | "EMPHASIS";

export interface SyncCue {
    word: string;
    frameOffset: number;  // Local frame within scene
    event: CueEvent;
}

export interface SceneTiming {
    sceneIndex: number;
    startSeconds: number;
    endSeconds: number;
    durationFrames: number;
    startFrame: number;
    cuePoints: SyncCue[];
}

export interface TranscriptionResult {
    totalFrames: number;
    totalSeconds: number;
    sceneTimings: SceneTiming[];
    whisperOutput: WhisperOutput;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const toFrame = (seconds: number) => Math.round(seconds * FPS);

/**
 * Find the Whisper word that best matches a target word in a text region.
 */
function findWordInRange(
    words: WhisperWord[],
    targetWord: string,
    rangeStart: number,
    rangeEnd: number,
): WhisperWord | null {
    const target = targetWord.toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const w of words) {
        if (w.start < rangeStart - 0.5 || w.start > rangeEnd + 0.5) continue;
        const cleaned = w.word.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleaned === target || cleaned.startsWith(target) || target.startsWith(cleaned)) {
            return w;
        }
    }
    return null;
}

/**
 * Normalize a word for fuzzy matching: lowercase, strip punctuation.
 */
const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9%]/g, "");

/**
 * Check if two words are a fuzzy match.
 *
 * Rules:
 *   - Short words (≤3 chars) require EXACT match — prevents false positives
 *     like "to" matching "totals", "the" matching "then"/"they"
 *   - Words 4+ chars: allow prefix match (either direction) with a minimum
 *     overlap of 4 characters — "branch" matches "branches" but "to" won't
 *     match "totals"
 *   - Also allows Levenshtein distance ≤ 2 for 5+ char words to handle
 *     spelling variations like "drowned"/"drowning" → both stem "drown"
 */
function fuzzyMatch(target: string, whisper: string): boolean {
    // Exact match — always accepted
    if (target === whisper) return true;

    // Short words: exact only
    if (target.length <= 3 || whisper.length <= 3) return false;

    // Prefix matching with minimum overlap of 4 chars
    const minOverlap = 4;
    if (whisper.length >= minOverlap && target.length >= minOverlap) {
        if (whisper.startsWith(target.slice(0, minOverlap)) && (whisper.startsWith(target) || target.startsWith(whisper))) {
            return true;
        }
    }

    // Stem matching: check if both words share a common stem of 4+ chars
    const shorter = target.length < whisper.length ? target : whisper;
    const longer = target.length < whisper.length ? whisper : target;
    if (shorter.length >= 4 && longer.startsWith(shorter.slice(0, 4))) {
        // Check that the shared prefix is at least 70% of the shorter word
        let shared = 0;
        for (let k = 0; k < shorter.length && k < longer.length; k++) {
            if (shorter[k] === longer[k]) shared++;
            else break;
        }
        if (shared >= Math.ceil(shorter.length * 0.7)) return true;
    }

    return false;
}

/**
 * Find scene boundaries by sequentially matching each scene's narration
 * words against the Whisper word list. Uses a sliding cursor so each
 * scene picks up exactly where the previous one left off.
 *
 * v2: Stricter fuzzy matching prevents false positives on short words
 *     ("to" matching "totals", "the" matching "then"/"they"). Also caps
 *     the maximum cursor jump per word to prevent one bad match from
 *     absorbing many subsequent scenes.
 */
function findSceneBoundaries(
    topic: TopicJSON,
    words: WhisperWord[],
): { startSeconds: number; endSeconds: number }[] {
    const boundaries: { startSeconds: number; endSeconds: number }[] = [];
    let cursor = 0; // position in Whisper words array

    for (let i = 0; i < topic.scenes.length; i++) {
        const scene = topic.scenes[i];
        const narrationWords = scene.narration
            .split(/\s+/)
            .map((w) => cleanWord(w))
            .filter(Boolean);

        if (narrationWords.length === 0) {
            const prevEnd = boundaries.length > 0 ? boundaries[boundaries.length - 1].endSeconds : 0;
            boundaries.push({ startSeconds: prevEnd, endSeconds: prevEnd + 1 });
            continue;
        }

        const sceneCursorStart = cursor;
        let firstMatchIdx = -1;
        let lastMatchIdx = -1;
        let matchCount = 0;

        for (const target of narrationWords) {
            // Search forward from cursor — narrow window first
            let found = false;
            for (let j = cursor; j < words.length && j < cursor + 15; j++) {
                const whisperClean = cleanWord(words[j].word);
                if (fuzzyMatch(target, whisperClean)) {
                    if (firstMatchIdx === -1) firstMatchIdx = j;
                    lastMatchIdx = j;
                    cursor = j + 1;
                    matchCount++;
                    found = true;
                    break;
                }
            }
            // Wider search only if we haven't matched anything yet for this scene
            // This prevents the cursor from jumping ahead when most words already matched
            if (!found && matchCount < 2) {
                for (let j = cursor; j < words.length && j < cursor + 30; j++) {
                    const whisperClean = cleanWord(words[j].word);
                    if (fuzzyMatch(target, whisperClean)) {
                        if (firstMatchIdx === -1) firstMatchIdx = j;
                        lastMatchIdx = j;
                        cursor = j + 1;
                        matchCount++;
                        break;
                    }
                }
            }
        }

        // Sanity check: if the cursor jumped more than expected (>2x narration word count),
        // something went wrong — revert to a conservative boundary
        const cursorJump = cursor - sceneCursorStart;
        const maxReasonableJump = narrationWords.length * 3; // generous 3x factor
        if (cursorJump > maxReasonableJump && matchCount < narrationWords.length / 2) {
            // Too few matches and cursor jumped too far — likely false positives
            // Revert cursor and use time-based estimation
            console.warn(`  ⚠️  Scene ${i + 1}: cursor jumped ${cursorJump} words but only ${matchCount}/${narrationWords.length} matched — using time estimation`);
            cursor = sceneCursorStart;
            firstMatchIdx = -1;
            lastMatchIdx = -1;
        }

        // Determine timing from matched word indices
        const startSeconds = firstMatchIdx >= 0
            ? words[firstMatchIdx].start
            : (boundaries.length > 0 ? boundaries[boundaries.length - 1].endSeconds : 0);

        const endSeconds = lastMatchIdx >= 0
            ? words[lastMatchIdx].end
            : startSeconds + 3;

        boundaries.push({ startSeconds, endSeconds });
    }

    // Smooth boundaries: each scene starts where the previous ends (midpoint of gap)
    for (let i = 1; i < boundaries.length; i++) {
        const prevEnd = boundaries[i - 1].endSeconds;
        const thisStart = boundaries[i].startSeconds;
        const midpoint = (prevEnd + thisStart) / 2;
        boundaries[i - 1].endSeconds = midpoint;
        boundaries[i].startSeconds = midpoint;
    }

    // First scene starts at 0, last scene ends at last word
    boundaries[0].startSeconds = 0;
    if (words.length > 0) {
        boundaries[boundaries.length - 1].endSeconds = words[words.length - 1].end;
    }

    // Validate: no scene should have negative or zero duration
    for (let i = 0; i < boundaries.length; i++) {
        if (boundaries[i].endSeconds <= boundaries[i].startSeconds) {
            console.warn(`  ⚠️  Scene ${i + 1}: invalid boundary (${boundaries[i].startSeconds.toFixed(2)}s → ${boundaries[i].endSeconds.toFixed(2)}s) — adjusting`);
            boundaries[i].endSeconds = boundaries[i].startSeconds + 1.0; // minimum 1s
            // Push subsequent scenes forward
            for (let k = i + 1; k < boundaries.length; k++) {
                if (boundaries[k].startSeconds < boundaries[k - 1].endSeconds) {
                    boundaries[k].startSeconds = boundaries[k - 1].endSeconds;
                    if (boundaries[k].endSeconds <= boundaries[k].startSeconds) {
                        boundaries[k].endSeconds = boundaries[k].startSeconds + 1.0;
                    }
                }
            }
        }
    }

    return boundaries;
}

/**
 * Assign cue events to Whisper words within a scene.
 */
function assignCuePoints(
    words: WhisperWord[],
    scene: TopicJSON["scenes"][number],
    sceneStartSeconds: number,
    sceneEndSeconds: number,
    sceneStartFrame: number,
): SyncCue[] {
    const cues: SyncCue[] = [];
    const sceneWords = words.filter(
        (w) => w.start >= sceneStartSeconds - 0.1 && w.start <= sceneEndSeconds + 0.1,
    );

    if (sceneWords.length === 0) return cues;

    // SCENE_START — first word
    const firstWord = sceneWords[0];
    cues.push({
        word: firstWord.word,
        frameOffset: toFrame(firstWord.start) - sceneStartFrame,
        event: "SCENE_START",
    });

    // HERO_WORD — the word that triggers the main visual event
    const heroWord = findWordInRange(words, scene.heroWord, sceneStartSeconds, sceneEndSeconds);
    if (heroWord) {
        cues.push({
            word: heroWord.word,
            frameOffset: toFrame(heroWord.start) - sceneStartFrame,
            event: "HERO_WORD",
        });

        // For DATA_STATE / chart scenes, start chart draw early (SCENE_START + 15f)
        // NOT at hero word — hero word often comes late, leaving insufficient
        // frames for the chart draw animation before the exit transition.
        if (scene.heroType === "DATA_STATE" || scene.chart) {
            cues.push({
                word: firstWord.word,
                frameOffset: 15,
                event: "CHART_DRAW_START",
            });
        }
    }

    // HARD_CUT — words ending with period
    for (const w of sceneWords) {
        if (w.word.endsWith(".") || w.word.endsWith("!") || w.word.endsWith("?")) {
            cues.push({
                word: w.word,
                frameOffset: toFrame(w.start) - sceneStartFrame,
                event: "HARD_CUT",
            });
        }
    }

    // SOFT_PAUSE — words ending with comma or dash
    for (const w of sceneWords) {
        if (w.word.endsWith(",") || w.word.endsWith("—") || w.word.endsWith("-")) {
            cues.push({
                word: w.word,
                frameOffset: toFrame(w.start) - sceneStartFrame,
                event: "SOFT_PAUSE",
            });
        }
    }

    // EMPHASIS — connective word if specified
    if (scene.connectiveWord) {
        const connective = findWordInRange(words, scene.connectiveWord, sceneStartSeconds, sceneEndSeconds);
        if (connective) {
            cues.push({
                word: connective.word,
                frameOffset: toFrame(connective.start) - sceneStartFrame,
                event: "EMPHASIS",
            });
        }
    }

    // Deduplicate and sort by frameOffset
    const seen = new Set<string>();
    return cues
        .filter((c) => {
            const key = `${c.event}:${c.frameOffset}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => a.frameOffset - b.frameOffset);
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Run Whisper on an avatar video and produce scene-level timing + cue points.
 */
export async function transcribeAvatar(
    avatarPath: string,
    topic: TopicJSON,
): Promise<TranscriptionResult> {
    const jsonPath = avatarPath.replace(/\.\w+$/, ".json");

    // Check for existing Whisper output
    let whisperOutput: WhisperOutput;

    if (existsSync(jsonPath)) {
        console.log(`  ⏭️  Whisper output exists: ${jsonPath}`);
        whisperOutput = JSON.parse(readFileSync(jsonPath, "utf-8"));
    } else {
        // Run Whisper
        console.log(`  🎙️  Running Whisper on ${avatarPath}...`);
        const outputDir = avatarPath.replace(/\/[^/]+$/, "");
        const cmd = `whisper "${avatarPath}" --model base --language en --word_timestamps True --output_format json --output_dir "${outputDir}"`;

        try {
            execSync(cmd, { stdio: "pipe", timeout: 300_000 }); // 5 min timeout
        } catch (err) {
            throw new Error(`Whisper failed: ${(err as Error).message}`);
        }

        if (!existsSync(jsonPath)) {
            throw new Error(`Whisper did not produce expected output: ${jsonPath}`);
        }

        whisperOutput = JSON.parse(readFileSync(jsonPath, "utf-8"));
        console.log(`  ✅ Whisper complete: ${whisperOutput.segments.length} segments`);
    }

    // Flatten all words from segments
    const allWords: WhisperWord[] = [];
    for (const seg of whisperOutput.segments) {
        if (seg.words) {
            allWords.push(...seg.words);
        }
    }

    if (allWords.length === 0) {
        throw new Error("Whisper produced no word-level timestamps. Check audio quality.");
    }

    // Find scene boundaries
    console.log("  📐 Computing scene boundaries...");
    const boundaries = findSceneBoundaries(topic, allWords);

    // Total duration
    const lastWord = allWords[allWords.length - 1];
    const totalSeconds = lastWord.end;
    const totalFrames = toFrame(totalSeconds);

    // Build scene timings with cue points
    const sceneTimings: SceneTiming[] = [];
    let cumulativeFrame = 0;

    for (let i = 0; i < topic.scenes.length; i++) {
        const { startSeconds, endSeconds } = boundaries[i];
        const durationFrames = toFrame(endSeconds) - toFrame(startSeconds);
        const startFrame = cumulativeFrame;

        const cuePoints = assignCuePoints(
            allWords,
            topic.scenes[i],
            startSeconds,
            endSeconds,
            toFrame(startSeconds),
        );

        sceneTimings.push({
            sceneIndex: i,
            startSeconds,
            endSeconds,
            durationFrames,
            startFrame,
            cuePoints,
        });

        cumulativeFrame += durationFrames;
    }

    console.log(`  ✅ ${sceneTimings.length} scenes mapped, ${totalFrames} total frames (${totalSeconds.toFixed(1)}s)`);

    return {
        totalFrames: cumulativeFrame,
        totalSeconds,
        sceneTimings,
        whisperOutput,
    };
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("transcribe.ts") || process.argv[1]?.endsWith("transcribe.js")) {
    const { readFileSync: readFile } = require("fs");
    const { TopicJSONSchema } = require("../schema");

    const avatarPath = process.argv[2];
    const topicPath = process.argv[3];

    if (!avatarPath || !topicPath) {
        console.error("Usage: npx tsx pipeline/stages/transcribe.ts <avatar.mp4> <topic.json>");
        process.exit(1);
    }

    const topic = TopicJSONSchema.parse(JSON.parse(readFile(topicPath, "utf-8")));

    console.log("🎙️  Whisper Transcription");
    transcribeAvatar(avatarPath, topic)
        .then((result) => {
            console.log("\n📊 Scene Timings:");
            for (const st of result.sceneTimings) {
                console.log(`  S${st.sceneIndex + 1}: ${st.startSeconds.toFixed(2)}s → ${st.endSeconds.toFixed(2)}s (${st.durationFrames}f, ${st.cuePoints.length} cues)`);
            }
            console.log(`\n  Total: ${result.totalFrames} frames (${result.totalSeconds.toFixed(1)}s)`);
        })
        .catch((err) => {
            console.error("❌ Failed:", err.message);
            process.exit(1);
        });
}
