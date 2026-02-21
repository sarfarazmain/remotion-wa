import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { FONTS } from "../fonts";

// ══════════════════════════════════════════════
// ANIMATED FLOW DIAGRAM (Nodes + Animated Connections)
// ══════════════════════════════════════════════
interface FlowNode {
    id: string;
    x: number;
    y: number;
    label: string;
    sublabel?: string;
    color: string;
    delay: number;
    disabled?: boolean;     // greyed-out with ✕ overlay (S6 bank bypass)
    icon?: string;          // emoji icon instead of first char
}

interface FlowEdge {
    from: string;
    to: string;
    label?: string;
    color?: string;
    delay: number;
    strikethrough?: boolean; // animated cross-out (bypassed connection)
}

export const FlowDiagram: React.FC<{
    nodes: FlowNode[];
    edges: FlowEdge[];
    width?: number;
    height?: number;
}> = ({ nodes, edges, width = 800, height = 500 }) => {
    const frame = useCurrentFrame();
    const getNode = (id: string) => nodes.find((n) => n.id === id)!;

    return (
        <div style={{ position: "relative", width, height }}>
            <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
                {/* Edges */}
                {edges.map((edge, i) => {
                    const fromN = getNode(edge.from);
                    const toN = getNode(edge.to);
                    const progress = interpolate(frame, [edge.delay, edge.delay + 50], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.inOut(Easing.cubic),
                    });

                    const dx = toN.x - fromN.x;
                    const dy = toN.y - fromN.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const eColor = edge.strikethrough ? "rgba(255,58,94,0.35)" : (edge.color || "rgba(255,255,255,0.3)");

                    // Strikethrough: red diagonal X drawn over the edge at a  delay
                    const strikeP = edge.strikethrough
                        ? interpolate(frame, [edge.delay + 35, edge.delay + 55], [0, 1], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.out(Easing.exp),
                        })
                        : 0;

                    const midX = fromN.x + dx * 0.5;
                    const midY = fromN.y + dy * 0.5;

                    return (
                        <g key={i}>
                            {/* Line */}
                            <line
                                x1={fromN.x} y1={fromN.y}
                                x2={fromN.x + dx * progress}
                                y2={fromN.y + dy * progress}
                                stroke={eColor} strokeWidth={edge.strikethrough ? 2.5 : 3}
                                strokeDasharray="8,5" opacity={edge.strikethrough ? 0.3 : 0.6}
                            />
                            {/* Arrowhead */}
                            {!edge.strikethrough && progress > 0.9 && (
                                <polygon
                                    points={`0,-8 16,0 0,8`}
                                    fill={eColor}
                                    transform={`translate(${toN.x}, ${toN.y}) rotate(${Math.atan2(dy, dx) * (180 / Math.PI)})`}
                                    opacity={0.8}
                                />
                            )}
                            {/* Strikethrough X over midpoint */}
                            {edge.strikethrough && strikeP > 0 && (() => {
                                const xs = 28 * strikeP;
                                return (
                                    <g opacity={strikeP}>
                                        <line x1={midX - xs} y1={midY - xs} x2={midX + xs} y2={midY + xs} stroke="#ff3a5e" strokeWidth={3.5} strokeLinecap="round"
                                            style={{ filter: "drop-shadow(0 0 6px #ff3a5e)" }} />
                                        <line x1={midX + xs} y1={midY - xs} x2={midX - xs} y2={midY + xs} stroke="#ff3a5e" strokeWidth={3.5} strokeLinecap="round"
                                            style={{ filter: "drop-shadow(0 0 6px #ff3a5e)" }} />
                                    </g>
                                );
                            })()}
                            {/* Edge label */}
                            {edge.label && progress > 0.5 && (
                                <text x={midX} y={midY - 14} textAnchor="middle" fill="rgba(238,244,255,0.55)"
                                    fontSize={15} fontFamily={FONTS.mono} fontWeight={600}>
                                    {edge.label}
                                </text>
                            )}
                            {/* Flowing particle — frame-driven, render-safe (no animateMotion) */}
                            {!edge.strikethrough && progress >= 1 && (() => {
                                // Cycle: particle travels from->to over cycleDuration frames, then loops
                                const cycleDuration = Math.max(18, Math.round(len / 5));
                                const t = (frame % cycleDuration) / cycleDuration;
                                const px = fromN.x + (toN.x - fromN.x) * t;
                                const py = fromN.y + (toN.y - fromN.y) * t;
                                // Fade in/out at endpoints so the loop is seamless
                                const edgeOpacity = t < 0.1
                                    ? t / 0.1
                                    : t > 0.9
                                        ? (1 - t) / 0.1
                                        : 1;
                                return (
                                    <circle
                                        cx={px} cy={py} r={6}
                                        fill={eColor}
                                        opacity={0.85 * edgeOpacity}
                                        style={{ filter: `drop-shadow(0 0 5px ${eColor})` }}
                                    />
                                );
                            })()}

                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
                const opacity = interpolate(frame, [node.delay, node.delay + 14], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.out(Easing.exp),
                });

                // Disabled nodes: red ✕ appears after core animation completes
                const disabledP = node.disabled
                    ? interpolate(frame, [node.delay + 25, node.delay + 40], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.out(Easing.exp),
                    })
                    : 0;

                const effectiveColor = node.disabled ? "rgba(255,255,255,0.22)" : node.color;

                return (
                    <div
                        key={node.id}
                        style={{
                            position: "absolute",
                            left: node.x, top: node.y,
                            transform: `translate(-50%, -50%) scale(${opacity})`,
                            opacity,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        }}
                    >
                        <div style={{ position: "relative" }}>
                            <div
                                style={{
                                    width: 130, height: 130, borderRadius: "50%",
                                    border: `3px solid ${effectiveColor}`,
                                    backgroundColor: "rgba(4,7,14,0.9)",
                                    boxShadow: node.disabled
                                        ? "none"
                                        : `0 0 22px ${node.color}66, 0 0 55px ${node.color}22`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: FONTS.mono, fontSize: node.icon ? 46 : 42,
                                    fontWeight: 700, color: effectiveColor,
                                    transition: "all 0.3s",
                                }}
                            >
                                {node.icon ?? node.label.charAt(0)}
                            </div>
                            {/* Disabled overlay ✕ */}
                            {node.disabled && disabledP > 0 && (
                                <div style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    opacity: disabledP,
                                }}>
                                    <span style={{
                                        fontSize: 64, color: "#ff3a5e", fontWeight: 700,
                                        textShadow: "0 0 20px #ff3a5e, 0 0 40px #ff3a5e",
                                        lineHeight: 1,
                                    }}>✕</span>
                                </div>
                            )}
                        </div>
                        <div style={{
                            color: node.disabled ? "rgba(238,244,255,0.35)" : "#eef4ff",
                            fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700,
                            textShadow: node.disabled ? "none" : `0 0 8px ${node.color}88`,
                            letterSpacing: 1,
                        }}>
                            {node.label}
                        </div>
                        {node.sublabel && (
                            <div style={{ color: "rgba(238,244,255,0.5)", fontFamily: FONTS.mono, fontSize: 14 }}>
                                {node.sublabel}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ══════════════════════════════════════════════
// EQUATION ANIMATION (A = B)
// ══════════════════════════════════════════════
export const EquationAnim: React.FC<{
    left: string;
    right: string;
    leftColor?: string;
    rightColor?: string;
    subtitle?: string;
}> = ({ left, right, leftColor = "#1de4ff", rightColor = "#f5c518", subtitle }) => {
    const frame = useCurrentFrame();
    const leftP = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
    const eqP = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
    const rightP = interpolate(frame, [80, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
    const leftX = (1 - leftP) * -100;
    const rightX = (1 - rightP) * 100;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                <div
                    style={{
                        opacity: leftP,
                        transform: `translateX(${leftX}px)`,
                        fontFamily: FONTS.title,
                        fontSize: 80,
                        fontWeight: 400,
                        color: leftColor,
                        textShadow: `0 0 20px ${leftColor}66`,
                    }}
                >
                    {left}
                </div>
                <div
                    style={{
                        opacity: eqP,
                        fontFamily: FONTS.title,
                        fontSize: 80,
                        fontWeight: 400,
                        color: "#eef4ff",
                    }}
                >
                    =
                </div>
                <div
                    style={{
                        opacity: rightP,
                        transform: `translateX(${rightX}px)`,
                        fontFamily: FONTS.title,
                        fontSize: 80,
                        fontWeight: 400,
                        color: rightColor,
                        textShadow: `0 0 20px ${rightColor}66`,
                    }}
                >
                    {right}
                </div>
            </div>
            {subtitle && (
                <div
                    style={{
                        opacity: rightP,
                        fontFamily: FONTS.mono,
                        fontSize: 16,
                        color: "rgba(238,244,255,0.5)",
                        letterSpacing: 3,
                        textTransform: "uppercase",
                    }}
                >
                    {subtitle}
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════
// SPLIT COMPARISON (Before / After)
// ══════════════════════════════════════════════
export const SplitComparison: React.FC<{
    leftLabel: string;
    leftValue: string;
    rightLabel: string;
    rightValue: string;
    leftColor?: string;
    rightColor?: string;
}> = ({ leftLabel, leftValue, rightLabel, rightValue, leftColor = "#1de4ff", rightColor = "#ff3a5e" }) => {
    const frame = useCurrentFrame();
    const dividerP = interpolate(frame, [20, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.exp) });
    const dividerX = 100 - dividerP * 50;
    const leftOp = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
    const rightOp = interpolate(frame, [55, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });

    return (
        <div style={{ position: "relative", width: 800, height: 400, overflow: "hidden" }}>
            {/* Divider */}
            <div
                style={{
                    position: "absolute",
                    left: `${dividerX}%`,
                    top: 0,
                    height: "100%",
                    width: 2,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    boxShadow: "0 0 10px rgba(255,255,255,0.1)",
                }}
            />

            {/* Left side */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "50%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: leftOp,
                }}
            >
                <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: "rgba(238,244,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                    {leftLabel}
                </div>
                <div style={{ fontFamily: FONTS.title, fontSize: 88, fontWeight: 400, color: leftColor, textShadow: `0 0 20px ${leftColor}44` }}>
                    {leftValue}
                </div>
            </div>

            {/* Right side */}
            <div
                style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "50%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: rightOp,
                }}
            >
                <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: "rgba(238,244,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                    {rightLabel}
                </div>
                <div style={{ fontFamily: FONTS.title, fontSize: 88, fontWeight: 400, color: rightColor, textShadow: `0 0 20px ${rightColor}44` }}>
                    {rightValue}
                </div>
            </div>
        </div>
    );
};
