/**
 * Topic Types — Runtime Type Definitions
 * ───────────────────────────────────────
 * Shared types between the pipeline (generate.ts) and the
 * Remotion composition (SceneRenderer.tsx, index.tsx).
 *
 * These mirror the Zod schema in pipeline/schema.ts but are
 * plain TypeScript interfaces for runtime use — no Zod dependency.
 */

// ── String literal unions (matching pipeline enums) ──────────────────────────

export type HeroTypeId = "DATA_STATE" | "EVIDENCE_STATE" | "STATEMENT_STATE" | "HERO_VIDEO";
export type EnvironmentId = "VOID" | "IMMERSIVE_BLEED" | "SIGNAL_GRID";
export type LayoutId = "OFFSET_STACK" | "DATA_VICE" | "FULL_BLEED";
export type PhysicsId = "SLAM" | "GLIDE" | "STOP_MOTION";
export type AnimationId = "SLIDE" | "STOMP" | "REDACTION";
export type TextTypeId = "HERO" | "CONNECTIVE";
export type WeightId = "LIGHT" | "REGULAR" | "BOLD" | "BLACK";
export type AlignId = "flex-start" | "center" | "flex-end" | "baseline";
export type ChartTypeId = "LINE" | "BAR";
export type TransitionTypeId = "Z_AXIS_PORTAL" | "INFINITE_DESK_LEFT" | "INFINITE_DESK_RIGHT" | "INFINITE_DESK_DOWN" | "INK_BLEED" | "FLASHBULB";
export type MicroResetTypeId = "Z_PUNCH_IN" | "REDACTION_REVEAL" | "HIGHLIGHTER";
export type EvidenceTypeId = "VERDICT_CARD" | "EVIDENCE_CARD" | "STAT_LINES" | "FLOW_ARROW";
export type ArchetypeId = "HIDDEN_MECHANISM" | "TIMELINE_EVOLUTION" | "GREAT_MAN";

// ── Sub-types ────────────────────────────────────────────────────────────────

export interface TypographyLine {
    text: string;
    type: TextTypeId;
    animation: AnimationId;
    weight?: WeightId;
    color?: string;        // Resolved color (C.GOLD, etc.) at runtime
    extraTracking?: number;
}

export interface TypographyConfig {
    lines: TypographyLine[];
    align?: AlignId;
    stagger?: number;
}

export interface DeclarationLine {
    text: string;
    size?: number;
    color?: string;        // Resolved color at runtime
}

export interface DeclarationConfig {
    lines: DeclarationLine[];
    lineStagger?: number;
}

export interface ChartDataPoint {
    label: string;
    value: number;
    sublabel?: string;
}

export interface SecondLineConfig {
    data: ChartDataPoint[];
    color?: string;
    label: string;
}

export interface ChartConfig {
    type: ChartTypeId;
    title: string;
    yUnit?: string;
    color?: string;            // Resolved color at runtime
    highlightLast?: boolean;
    data: ChartDataPoint[];
    secondLine?: SecondLineConfig;
    lineLabel?: string;
}

export interface DataTickerConfig {
    from?: number;
    to: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    label: string;
    color?: string;
}

export interface StatLineData {
    label: string;
    value: string;
    color?: string;
}

export interface EvidenceConfig {
    type: EvidenceTypeId;
    // VerdictCard fields
    leftLabel?: string;
    leftItems?: string[];
    rightLabel?: string;
    rightItems?: string[];
    // StatLines fields
    stats?: StatLineData[];
    // FlowArrow fields
    fromLabel?: string;
    toLabel?: string;
    throughLabel?: string;
    // EvidenceCard fields
    cardLabel?: string;
}

export interface MicroResetConfig {
    type: MicroResetTypeId;
    label?: string;
    targetElement?: string;
}

export interface SourceConfig {
    classification: string;
    citation: string;
}

// ── Scene Data (runtime representation of a scene from topicData.ts) ─────────

export interface TopicScene {
    index: number;
    heroType: HeroTypeId;
    environment: EnvironmentId;
    layout: LayoutId;
    physics: PhysicsId;
    narration: string;
    heroWord: string;
    connectiveWord?: string;

    // Asset paths (resolved from Pexels at pipeline time)
    videoSrc: string;
    imageSrc: string;

    // Visual components (at least one of typography or declaration)
    typography?: TypographyConfig;
    declaration?: DeclarationConfig;
    chart?: ChartConfig;
    dataTicker?: DataTickerConfig;
    evidence?: EvidenceConfig;

    // Micro-reset
    microReset?: MicroResetConfig;

    // Source
    source?: SourceConfig;
}

// ── Transition Data ──────────────────────────────────────────────────────────

export interface TopicTransition {
    from: number;
    to: number;
    type: TransitionTypeId;
}

// ── Meta ─────────────────────────────────────────────────────────────────────

export interface TopicMeta {
    title: string;
    slug: string;
    archetype: ArchetypeId;
}
