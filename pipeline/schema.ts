/**
 * Pipeline Schema — Zod validation for topic.json
 * ─────────────────────────────────────────────────
 * Defines the full creative JSON structure that Gemini produces.
 * Every visual parameter is typed and validated here.
 */

import { z } from "zod";

// ── Enums ────────────────────────────────────────────────────────────────────

export const ArchetypeEnum = z.enum([
    "HIDDEN_MECHANISM",
    "TIMELINE_EVOLUTION",
    "GREAT_MAN",
]);

export const HeroTypeEnum = z.enum([
    "DATA_STATE",
    "EVIDENCE_STATE",
    "STATEMENT_STATE",
    "HERO_VIDEO",
]);

export const EnvironmentEnum = z.enum([
    "VOID",
    "IMMERSIVE_BLEED",
    "SIGNAL_GRID",
]);

export const LayoutEnum = z.enum([
    "OFFSET_STACK",
    "DATA_VICE",
    "FULL_BLEED",
]);

export const PhysicsEnum = z.enum([
    "SLAM",
    "GLIDE",
    "STOP_MOTION",
]);

export const AnimationEnum = z.enum([
    "SLIDE",
    "STOMP",
    "REDACTION",
]);

export const TextTypeEnum = z.enum([
    "HERO",
    "CONNECTIVE",
]);

export const WeightEnum = z.enum([
    "LIGHT",
    "REGULAR",
    "BOLD",
    "BLACK",
]);

export const ColorEnum = z.enum([
    "GOLD",
    "OXBLOOD",
    "CREAM",
    "CREAM_DIM",
    "CREAM_FAINT",
    "GOLD_DIM",
    "NAVY",
]);

export const AlignEnum = z.enum([
    "flex-start",
    "center",
    "flex-end",
    "baseline",
]);

export const ChartTypeEnum = z.enum([
    "LINE",
    "BAR",
]);

export const TransitionTypeEnum = z.enum([
    "Z_AXIS_PORTAL",
    "INFINITE_DESK_LEFT",
    "INFINITE_DESK_RIGHT",
    "INFINITE_DESK_DOWN",
    "INK_BLEED",
    "FLASHBULB",
]);

export const MicroResetTypeEnum = z.enum([
    "Z_PUNCH_IN",
    "REDACTION_REVEAL",
    "HIGHLIGHTER",
]);

export const EvidenceTypeEnum = z.enum([
    "VERDICT_CARD",
    "EVIDENCE_CARD",
    "STAT_LINES",
    "FLOW_ARROW",
]);

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const TypographyLineSchema = z.object({
    text: z.string().max(18, "Text must be ≤18 characters (SOP textShatter rule)"),
    type: TextTypeEnum,
    animation: AnimationEnum,
    weight: WeightEnum.optional().default("BOLD"),
    color: ColorEnum.optional(),
    extraTracking: z.number().optional(),
});

const TypographySchema = z.object({
    lines: z.array(TypographyLineSchema).min(1).max(5),
    align: AlignEnum.optional().default("flex-start"),
    stagger: z.number().optional().default(8),
});

const DeclarationLineSchema = z.object({
    text: z.string().max(18, "Declaration line must be ≤18 characters"),
    size: z.number().optional().default(100),
    color: ColorEnum.optional().default("CREAM"),
});

const DeclarationSchema = z.object({
    lines: z.array(DeclarationLineSchema).min(1).max(3),
    lineStagger: z.number().optional().default(10),
});

const ChartDataPointSchema = z.object({
    label: z.string(),
    value: z.number(),
    sublabel: z.string().optional(),
});

const SecondLineSchema = z.object({
    data: z.array(ChartDataPointSchema).min(2),
    color: ColorEnum.optional().default("OXBLOOD"),
    label: z.string(),
});

const ChartSchema = z.object({
    type: ChartTypeEnum,
    title: z.string(),
    yUnit: z.string().optional().default(""),
    color: ColorEnum.optional().default("GOLD"),
    highlightLast: z.boolean().optional().default(false),
    data: z.array(ChartDataPointSchema).min(2).max(12),
    secondLine: SecondLineSchema.optional(),
    lineLabel: z.string().optional(),
});

const DataTickerSchema = z.object({
    from: z.number().optional().default(0),
    to: z.number(),
    prefix: z.string().optional().default(""),
    suffix: z.string().optional().default(""),
    decimals: z.number().min(0).max(2).optional().default(1),
    label: z.string(),
    color: ColorEnum.optional().default("GOLD"),
});

const StatLineSchema = z.object({
    label: z.string(),
    value: z.string(),
    color: ColorEnum.optional().default("GOLD"),
});

const EvidenceSchema = z.object({
    type: EvidenceTypeEnum,
    // VerdictCard fields
    leftLabel: z.string().optional(),
    leftItems: z.array(z.string()).optional(),
    rightLabel: z.string().optional(),
    rightItems: z.array(z.string()).optional(),
    // StatLines fields
    stats: z.array(StatLineSchema).optional(),
    // FlowArrow fields
    fromLabel: z.string().optional(),
    toLabel: z.string().optional(),
    throughLabel: z.string().optional(),
    // EvidenceCard fields
    cardLabel: z.string().optional(),
});

const MicroResetSchema = z.object({
    type: MicroResetTypeEnum,
    label: z.string().optional(),       // For REDACTION_REVEAL
    targetElement: z.string().optional(), // For HIGHLIGHTER
});

const SourceSchema = z.object({
    classification: z.string(),
    citation: z.string(),
});

// ── Scene Schema ─────────────────────────────────────────────────────────────

const SceneSchema = z.object({
    index: z.number().int().min(1).max(14),
    narration: z.string().min(1),

    // Visual identity
    heroType: HeroTypeEnum,
    environment: EnvironmentEnum.optional().default("VOID"),
    layout: LayoutEnum.optional().default("FULL_BLEED"),
    physics: PhysicsEnum.optional().default("SLAM"),

    // Content components (at least one of typography or declaration required)
    typography: TypographySchema.optional(),
    declaration: DeclarationSchema.optional(),
    chart: ChartSchema.optional(),
    dataTicker: DataTickerSchema.optional(),
    evidence: EvidenceSchema.optional(),

    // Assets
    pexelsVideoQuery: z.string().min(1),
    pexelsImageQuery: z.string().min(1),

    // Audio sync
    heroWord: z.string().min(1),
    connectiveWord: z.string().optional(),

    // Micro-reset (Hold & Evolve)
    microReset: MicroResetSchema.optional().default({ type: "Z_PUNCH_IN" }),

    // Source attribution
    source: SourceSchema.optional(),
});

// ── Transition Schema ────────────────────────────────────────────────────────

const TransitionSchema = z.object({
    from: z.number().int().min(1).max(14),
    to: z.number().int().min(1).max(14),
    type: TransitionTypeEnum,
});

// ── BGM Schema ───────────────────────────────────────────────────────────────

const BgmSchema = z.object({
    trackId: z.string().min(1),
});

// ── Meta Schema ──────────────────────────────────────────────────────────────

const MetaSchema = z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    archetype: ArchetypeEnum.optional().default("HIDDEN_MECHANISM"),
});

// ── Root Topic JSON Schema ───────────────────────────────────────────────────

export const TopicJSONSchema = z.object({
    meta: MetaSchema,
    narration: z.string().min(10, "Narration must be at least 10 characters"),
    bgm: BgmSchema,
    scenes: z.array(SceneSchema).min(10).max(14),
    transitions: z.array(TransitionSchema).min(9).max(13),
}).refine(
    (data) => data.scenes.length === data.transitions.length + 1,
    { message: "Transitions count must be exactly scenes count - 1" },
).refine(
    (data) => {
        // Every scene must have at least typography or declaration
        return data.scenes.every(s => s.typography || s.declaration);
    },
    { message: "Every scene must have at least typography or declaration" },
).refine(
    (data) => {
        // DATA_STATE scenes must have chart
        return data.scenes.filter(s => s.heroType === "DATA_STATE").every(s => s.chart);
    },
    { message: "DATA_STATE scenes must have a chart configuration" },
);

// ── Inferred Types ───────────────────────────────────────────────────────────

export type TopicJSON = z.infer<typeof TopicJSONSchema>;
export type SceneJSON = z.infer<typeof SceneSchema>;
export type TransitionJSON = z.infer<typeof TransitionSchema>;
export type TypographyJSON = z.infer<typeof TypographySchema>;
export type DeclarationJSON = z.infer<typeof DeclarationSchema>;
export type ChartJSON = z.infer<typeof ChartSchema>;
export type DataTickerJSON = z.infer<typeof DataTickerSchema>;
export type EvidenceJSON = z.infer<typeof EvidenceSchema>;
export type MicroResetJSON = z.infer<typeof MicroResetSchema>;
