import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useSceneFrame } from "./SceneContext";
import { ArchiveScene } from "./ArchiveScene";
import { KineticTypography } from "./KineticTypography";
import { Declaration, DataTicker, GoldHighlight, SourceStamp } from "./Typography";
import { PhysicalLineChart, PhysicalBarChart, EvidenceCard } from "./Charts";
import { C, ARCHIVE_FONTS } from "./fonts";
import { generateSceneVariant } from "./SceneGenerator";
import { getCueFrame } from "./AudioSyncMap";
import type { TopicScene } from "./topicTypes";
import type { MicroResetType } from "./MicroAnimationReset";

/**
 * SCENE RENDERER — Data-Driven Scene Dispatch
 * ─────────────────────────────────────────────
 * Given a TopicScene config, renders the correct visual combination:
 *   DATA_STATE     → chart + declaration/typography + dataTicker
 *   EVIDENCE_STATE → evidence component + declaration + source
 *   STATEMENT_STATE → typography/declaration + dataTicker + evidence
 *   HERO_VIDEO     → video + declaration
 *
 * All styling params (animation, weight, color, align, layout, physics)
 * are read from the scene data — no hardcoding.
 */

// ─── Helper: Map heroType string to content hints for SceneGenerator ─────────
function getContentHints(scene: TopicScene) {
    switch (scene.heroType) {
        case "DATA_STATE":
            return { hasChart: true };
        case "EVIDENCE_STATE":
            return { hasImage: true };
        case "HERO_VIDEO":
            return { heroVideo: true };
        default:
            return {};
    }
}

// ─── Separator line between Declaration sections ─────────────────────────────
const Divider: React.FC<{ delay?: number }> = ({ delay = 20 }) => {
    const frame = useSceneFrame();
    const w = interpolate(frame, [delay, delay + 24], [0, 780], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    return (
        <div style={{ width: w, height: 1, background: `linear-gradient(to right, ${C.GOLD}44, transparent)`, margin: "18px 0" }} />
    );
};

// ─── Stat Row (archive style) ────────────────────────────────────────────────
const StatLine: React.FC<{
    label: string;
    value: string;
    color?: string;
    delay?: number;
}> = ({ label, value, color = C.GOLD, delay = 0 }) => {
    const frame = useSceneFrame();
    const p = interpolate(frame, [delay, delay + 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    return (
        <div style={{
            opacity: p,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "10px 0",
            borderBottom: `1px solid ${C.GOLD}1a`,
        }}>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 22, color: C.CREAM_DIM, letterSpacing: "0.05em", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{label}</span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 32, fontWeight: 700, color, letterSpacing: "-0.01em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{value}</span>
        </div>
    );
};

// ─── Two-column verdict card ─────────────────────────────────────────────────
const VerdictCard: React.FC<{
    leftLabel: string; leftItems: string[];
    rightLabel: string; rightItems: string[];
}> = ({ leftLabel, leftItems, rightLabel, rightItems }) => {
    const frame = useSceneFrame();
    const lp = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const rp = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const vp = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const driftY = Math.sin(frame * 0.02) * 3;

    const col = (p: number, borderColor: string): React.CSSProperties => ({
        opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
        flex: 1, padding: "24px 20px",
        background: `${borderColor}08`,
        border: `1px solid ${borderColor}30`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
    });

    return (
        <div style={{ display: "flex", gap: 20, width: "100%", transform: `translateY(${driftY}px)` }}>
            <div style={col(lp, C.OXBLOOD)}>
                <div style={{ fontFamily: ARCHIVE_FONTS.serif, fontSize: 26, color: C.CREAM, letterSpacing: "0.04em", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{leftLabel}</div>
                {leftItems.map((item, i) => (
                    <div key={i} style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 18, color: C.CREAM_DIM, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{item}</div>
                ))}
                <div style={{ fontSize: 72, opacity: vp, color: C.OXBLOOD, textShadow: "0 4px 8px rgba(0,0,0,0.5)" }}>✕</div>
            </div>
            <div style={col(rp, C.GOLD)}>
                <div style={{ fontFamily: ARCHIVE_FONTS.serif, fontSize: 26, color: C.CREAM, letterSpacing: "0.04em", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{rightLabel}</div>
                {rightItems.map((item, i) => (
                    <div key={i} style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 18, color: C.CREAM_DIM, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{item}</div>
                ))}
                <div style={{ fontSize: 72, opacity: vp, color: C.GOLD, textShadow: "0 4px 8px rgba(0,0,0,0.5)" }}>✓</div>
            </div>
        </div>
    );
};

// ─── FlowArrow — process flow (from → to) ───────────────────────────────────
const FlowArrow: React.FC<{
    from: string;
    to: string;
    label: string;
    color?: string;
    striked?: boolean;
    startFrame?: number;
}> = ({ from, to, label, color = C.NAVY, striked = false, startFrame = 0 }) => {
    const frame = useCurrentFrame();
    const p = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                opacity: p,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${C.GOLD}18`,
                position: "relative",
            }}
        >
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 20, color: C.NAVY }}>{from}</span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 24, color: C.OXBLOOD }}> → </span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 20, color: C.NAVY }}>{to}</span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 16, color: C.NAVY, marginLeft: "auto", letterSpacing: "0.06em", opacity: 0.7 }}>{label}</span>
            {striked && (
                <div style={{
                    position: "absolute", left: 0, top: "50%", right: 0, height: 2,
                    background: C.OXBLOOD, opacity: 0.7,
                    transform: "translateY(-50%)",
                }} />
            )}
        </div>
    );
};

// ── RESOLVE COLOR ────────────────────────────────────────────────────────────
// Maps color string references back to actual hex values
function resolveColor(color?: string): string | undefined {
    if (!color) return undefined;
    // Already a hex/rgba value
    if (color.startsWith("#") || color.startsWith("rgb")) return color;
    // Color constant references
    const map: Record<string, string> = {
        "C.GOLD": C.GOLD,
        "C.OXBLOOD": C.OXBLOOD,
        "C.CREAM": C.CREAM,
        "C.CREAM_DIM": C.CREAM_DIM,
        "C.CREAM_FAINT": C.CREAM_FAINT,
        "C.GOLD_DIM": C.GOLD_DIM,
        "C.NAVY": C.NAVY,
    };
    return map[color] || color;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SCENE RENDERER
// ═════════════════════════════════════════════════════════════════════════════

interface SceneRendererProps {
    scene: TopicScene;
    sceneIdx: number;
    localFrame: number;
    sceneDuration: number;
    assets: Record<string, string>;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({
    scene,
    sceneIdx,
    localFrame,
    sceneDuration,
    assets,
}) => {
    const sceneId = `s${scene.index}`;
    const sceneLabel = `${String(scene.index).padStart(2, "0")} · 12`;

    // Resolve variant from scene data
    const variant = generateSceneVariant(sceneId, getContentHints(scene));

    // Micro-reset type
    const microReset: MicroResetType = scene.microReset?.type || "Z_PUNCH_IN";
    const microResetLabel = scene.microReset?.label;
    const highlighterTarget = scene.microReset?.targetElement;

    // Asset resolution
    const videoSrc = scene.videoSrc || assets[`scene${scene.index}_video`] || "";
    const imageSrc = scene.imageSrc || assets[`scene${scene.index}_image`] || "";

    return (
        <ArchiveScene
            sceneId={sceneId}
            sceneLabel={sceneLabel}
            heroText={scene.heroWord?.toUpperCase()}
            localFrame={localFrame}
            videoSrc={videoSrc}
            imageSrc={imageSrc}
            variant={variant}
            renderBackground={false}
            sceneDuration={sceneDuration}
            microReset={microReset}
            microResetLabel={microResetLabel}
            highlighterTarget={highlighterTarget}
        >
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* ── TYPOGRAPHY (KineticTypography) ─────────────────────── */}
                {scene.typography && (
                    <KineticTypography
                        startFrame={getCueFrame(sceneIdx, "SCENE_START")}
                        lines={scene.typography.lines.map((line) => ({
                            units: [{
                                text: line.text,
                                type: line.type as "HERO" | "CONNECTIVE",
                                animation: line.animation as "SLIDE" | "STOMP" | "REDACTION",
                                weight: line.weight as "LIGHT" | "REGULAR" | "BOLD" | "BLACK" | undefined,
                                color: resolveColor(line.color),
                            }],
                            align: scene.typography!.align as "baseline" | "center" | undefined,
                        }))}
                    />
                )}

                {/* ── DECLARATION ────────────────────────────────────────── */}
                {scene.declaration && (
                    <>
                        <Declaration
                            lines={scene.declaration.lines.map((line) => ({
                                text: line.text,
                                size: line.size || 100,
                                color: resolveColor(line.color) || C.CREAM,
                            }))}
                            startDelay={getCueFrame(sceneIdx, "SCENE_START")}
                            lineStagger={scene.declaration.lineStagger || 10}
                        />
                    </>
                )}

                {/* ── DIVIDER (after typography or declaration, before data) ── */}
                {(scene.typography || scene.declaration) && (scene.dataTicker || scene.chart || scene.evidence) && (
                    <Divider delay={getCueFrame(sceneIdx, "HERO_WORD") + 4} />
                )}

                {/* ── DATA TICKER ───────────────────────────────────────── */}
                {scene.dataTicker && (
                    <>
                        <DataTicker
                            from={scene.dataTicker.from || 0}
                            to={scene.dataTicker.to}
                            prefix={scene.dataTicker.prefix || ""}
                            suffix={scene.dataTicker.suffix || ""}
                            decimals={scene.dataTicker.decimals}
                            label={scene.dataTicker.label}
                            startDelay={getCueFrame(sceneIdx, "HERO_WORD")}
                            duration={50}
                            color={resolveColor(scene.dataTicker.color) || C.GOLD}
                            size={96}
                        />
                        <GoldHighlight
                            width={380}
                            startFrame={getCueFrame(sceneIdx, "HERO_WORD") + 8}
                            filterId={`gh${scene.index}`}
                        />
                    </>
                )}

                {/* ── CHART (LINE or BAR) ───────────────────────────────── */}
                {scene.chart && (() => {
                    // Dynamic drawDuration: fill available frames between
                    // CHART_DRAW_START and scene end, minus 35f exit buffer
                    const chartStart = getCueFrame(sceneIdx, "CHART_DRAW_START");
                    const maxDraw = sceneDuration - chartStart - 35; // 35f = 5f gap + 30f exit transition
                    const idealDraw = scene.chart.type === "LINE" ? 80 : 50;
                    const drawDuration = Math.max(25, Math.min(maxDraw, idealDraw));
                    return (
                    <div style={{ marginTop: scene.declaration ? 28 : 0 }}>
                        {scene.chart.type === "LINE" ? (
                            <PhysicalLineChart
                                title={scene.chart.title}
                                data={scene.chart.data}
                                lineLabel={scene.chart.lineLabel}
                                color={resolveColor(scene.chart.color) || C.GOLD}
                                secondLine={scene.chart.secondLine ? {
                                    label: scene.chart.secondLine.label,
                                    color: resolveColor(scene.chart.secondLine.color) || C.OXBLOOD,
                                    data: scene.chart.secondLine.data,
                                } : undefined}
                                width={780}
                                height={460}
                                startFrame={chartStart}
                                drawDuration={drawDuration}
                                filterId={`lc${scene.index}`}
                            />
                        ) : (
                            <PhysicalBarChart
                                title={scene.chart.title}
                                data={scene.chart.data}
                                color={resolveColor(scene.chart.color) || C.GOLD}
                                highlightLast={scene.chart.highlightLast}
                                width={780}
                                height={460}
                                startFrame={chartStart}
                                drawDuration={drawDuration}
                            />
                        )}
                    </div>
                    );
                })()}

                {/* ── EVIDENCE COMPONENTS ────────────────────────────────── */}
                {scene.evidence && renderEvidence(scene, sceneIdx)}

                {/* ── SOURCE STAMP ──────────────────────────────────────── */}
                {scene.source && (
                    <div style={{ marginTop: "auto" }}>
                        <SourceStamp
                            classification={scene.source.classification}
                            source={scene.source.citation}
                            startDelay={getCueFrame(sceneIdx, "HARD_CUT")}
                        />
                    </div>
                )}
            </div>
        </ArchiveScene>
    );
};

// ── Evidence rendering sub-dispatch ──────────────────────────────────────────

function renderEvidence(scene: TopicScene, sceneIdx: number): React.ReactNode {
    if (!scene.evidence) return null;

    switch (scene.evidence.type) {
        case "VERDICT_CARD":
            return (
                <div style={{ marginTop: 8 }}>
                    <VerdictCard
                        leftLabel={scene.evidence.leftLabel || "Left"}
                        leftItems={scene.evidence.leftItems || []}
                        rightLabel={scene.evidence.rightLabel || "Right"}
                        rightItems={scene.evidence.rightItems || []}
                    />
                </div>
            );

        case "STAT_LINES":
            return (
                <div style={{ marginTop: 8 }}>
                    {scene.evidence.stats?.map((stat, i) => (
                        <StatLine
                            key={i}
                            label={stat.label}
                            value={stat.value}
                            color={resolveColor(stat.color) || C.GOLD}
                            delay={getCueFrame(sceneIdx, "HERO_WORD") + 8 + i * 8}
                        />
                    ))}
                </div>
            );

        case "FLOW_ARROW":
            return (
                <EvidenceCard
                    width={780}
                    startFrame={getCueFrame(sceneIdx, "HERO_WORD")}
                    label={scene.evidence.throughLabel || "Process"}
                >
                    {scene.evidence.throughLabel && (
                        <FlowArrow
                            from={`🏛 ${scene.evidence.fromLabel || ""}`}
                            to={`🏦 ${scene.evidence.throughLabel}`}
                            label="OLD ROUTE"
                            striked
                            startFrame={getCueFrame(sceneIdx, "HERO_WORD") + 6}
                        />
                    )}
                    <FlowArrow
                        from={`🏛 ${scene.evidence.fromLabel || ""}`}
                        to={`📈 ${scene.evidence.toLabel || ""}`}
                        label="DIRECT"
                        color={C.GOLD}
                        startFrame={getCueFrame(sceneIdx, "EMPHASIS")}
                    />
                </EvidenceCard>
            );

        case "EVIDENCE_CARD":
            return (
                <EvidenceCard
                    width={780}
                    startFrame={getCueFrame(sceneIdx, "HERO_WORD")}
                    label={scene.evidence.cardLabel || "Evidence"}
                >
                    <div style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 18, color: C.CREAM_DIM }}>
                        {scene.evidence.cardLabel}
                    </div>
                </EvidenceCard>
            );

        default:
            return null;
    }
}
