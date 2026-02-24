/**
 * WARP v2.0 SOP Part V: 18-Character Shatter Limit
 * ─────────────────────────────────────────────────
 * No single line of kinetic text may exceed 18 characters.
 * The pipeline MUST force a line break at the nearest space.
 * Words exceeding 18 characters on their own are exempt
 * but MUST be the only word on their line.
 */

const DEFAULT_MAX_CHARS = 18;

/**
 * Validate that a single line of text fits within the shatter limit.
 */
export function validateShatter(
    text: string,
    maxChars: number = DEFAULT_MAX_CHARS,
): boolean {
    return text.length <= maxChars;
}

/**
 * Warn in dev mode if a text line exceeds the shatter limit.
 */
export function warnShatter(text: string, context?: string): void {
    if (text.length > DEFAULT_MAX_CHARS) {
        console.warn(
            `[WARP v2.0 SHATTER] Line exceeds ${DEFAULT_MAX_CHARS} chars (${text.length}): "${text}"` +
                (context ? ` in ${context}` : ""),
        );
    }
}

/**
 * Split a long string into lines that each fit within the shatter limit.
 * Splits on word boundaries only. Single words exceeding the limit
 * are placed alone on their line (exempt from the limit).
 */
export function shatterText(
    text: string,
    maxChars: number = DEFAULT_MAX_CHARS,
): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxChars && current) {
            lines.push(current);
            current = word; // Start new line with this word (may exceed limit — exempt)
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);

    return lines;
}
