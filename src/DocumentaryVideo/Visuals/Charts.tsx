import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { evolvePath } from "@remotion/paths";
import { FONTS } from "../fonts";

/*
 * CHARTS — Senior Editor SOP
 * ────────────────────────────
 * ✅ evolvePath() for SVG line draw-on
 * ✅ interpolate() + Easing — no bounce, no overshoot
 * ✅ Linear for data updates (SOP rule)
 * ✅ FONTS from @remotion/google-fonts
 */

// ══════════════════════════════════════════════
// 1. ANIMATED LINE CHART (with labeled axes + optional second line)
// ══════════════════════════════════════════════
export const LabeledLineChart: React.FC<{
    data: { label: string; value: number }[];
    secondLine?: { data: { label: string; value: number }[]; label: string; color: string };
    title: string;
    yUnit?: string;
    color?: string;
    lineLabel?: string;
    width?: number;
    height?: number;
    startFrame?: number;
}> = ({ data, secondLine, title, yUnit = "", color = "#1de4ff", lineLabel, width = 960, height = 520, startFrame = 20 }) => {
    const frame = useCurrentFrame();
    const padL = 120;
    const padB = 80;
    const padT = 70;
    const padR = secondLine ? 60 : 30;

    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    // Compute shared min/max across both lines
    const allValues = [
        ...data.map((d) => d.value),
        ...(secondLine ? secondLine.data.map((d) => d.value) : []),
    ];
    const maxVal = Math.max(...allValues);
    const minVal = Math.min(...allValues);
    const range = maxVal - minVal || 1;

    const drawProgress = interpolate(frame, [startFrame, startFrame + 120], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
    });

    const titleOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
    const labelOpacity = interpolate(frame, [startFrame + 100, startFrame + 120], [0, 1], { extrapolateRight: "clamp" });

    // Build SVG paths
    const toPoints = (lineData: { label: string; value: number }[]) =>
        lineData.map((d, i) => ({
            x: padL + (i / (lineData.length - 1)) * chartW,
            y: padT + chartH - ((d.value - minVal) / range) * chartH,
        }));

    const points1 = toPoints(data);
    const pathD1 = points1.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD1 = `${pathD1} L ${points1[points1.length - 1].x} ${padT + chartH} L ${points1[0].x} ${padT + chartH} Z`;
    const evolved1 = evolvePath(drawProgress, pathD1);

    let pathD2 = "", areaD2 = "", evolved2 = evolved1, points2: { x: number; y: number }[] = [];
    if (secondLine) {
        points2 = toPoints(secondLine.data);
        pathD2 = points2.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        areaD2 = `${pathD2} L ${points2[points2.length - 1].x} ${padT + chartH} L ${points2[0].x} ${padT + chartH} Z`;
        evolved2 = evolvePath(drawProgress, pathD2);
    }

    const yTicks = 5;

    return (
        <div style={{ position: "relative", width, height }}>
            <div
                style={{
                    position: "absolute", top: 8, left: padL,
                    fontFamily: FONTS.mono, fontSize: 28,
                    color: "rgba(238,244,255,0.55)",
                    letterSpacing: 2, textTransform: "uppercase" as const,
                    opacity: titleOpacity,
                }}
            >
                {title}
            </div>

            <svg width={width} height={height}>
                {/* Y Axis gridlines + labels */}
                {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const val = minVal + (range / yTicks) * i;
                    const y = padT + chartH - (i / yTicks) * chartH;
                    const op = interpolate(frame, [startFrame + i * 4, startFrame + i * 4 + 20], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return (
                        <g key={i}>
                            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
                            <text x={padL - 10} y={y + 4} textAnchor="end" fill="rgba(238,244,255,0.45)" fontSize={24} fontFamily={FONTS.mono} opacity={op}>
                                {yUnit}{val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                            </text>
                        </g>
                    );
                })}

                {/* X Axis labels */}
                {data.map((d, i) => {
                    const x = padL + (i / (data.length - 1)) * chartW;
                    const op = interpolate(frame, [startFrame + i * 6, startFrame + i * 6 + 18], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return (
                        <text key={i} x={x} y={padT + chartH + 28} textAnchor="middle" fill="rgba(238,244,255,0.45)" fontSize={24} fontFamily={FONTS.mono} opacity={op}>
                            {d.label}
                        </text>
                    );
                })}

                {/* Axis lines */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />

                {/* Second line area + path (drawn BEHIND primary) */}
                {secondLine && (
                    <>
                        <path d={areaD2} fill={secondLine.color} opacity={0.06 * drawProgress} />
                        <path
                            d={pathD2} fill="none"
                            stroke={secondLine.color} strokeWidth={3.5} strokeLinecap="round"
                            strokeDasharray={evolved2.strokeDasharray}
                            strokeDashoffset={evolved2.strokeDashoffset}
                            style={{ filter: `drop-shadow(0 0 10px ${secondLine.color}) drop-shadow(0 0 22px ${secondLine.color}44)` }}
                        />
                        {/* Second line end label */}
                        {points2.length > 0 && (
                            <text
                                x={points2[points2.length - 1].x + 10}
                                y={points2[points2.length - 1].y}
                                fill={secondLine.color} fontSize={24} fontFamily={FONTS.mono}
                                fontWeight={700} opacity={labelOpacity}
                            >
                                {secondLine.label}
                            </text>
                        )}
                    </>
                )}

                {/* Primary area + path */}
                <path d={areaD1} fill={color} opacity={0.09 * drawProgress} />
                <path
                    d={pathD1} fill="none"
                    stroke={color} strokeWidth={4} strokeLinecap="round"
                    strokeDasharray={evolved1.strokeDasharray}
                    strokeDashoffset={evolved1.strokeDashoffset}
                    style={{ filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 28px ${color}44)` }}
                />

                {/* Primary line end label */}
                {lineLabel && points1.length > 0 && (
                    <text
                        x={points1[points1.length - 1].x + 10}
                        y={points1[points1.length - 1].y}
                        fill={color} fontSize={24} fontFamily={FONTS.mono}
                        fontWeight={700} opacity={labelOpacity}
                    >
                        {lineLabel}
                    </text>
                )}

                {/* Hot dot at draw tip */}
                {drawProgress > 0.05 && drawProgress < 0.99 && (() => {
                    const idx = Math.min(Math.floor(drawProgress * (points1.length - 1)), points1.length - 1);
                    // Interpolate between points for smooth position
                    const frac = drawProgress * (points1.length - 1) - Math.floor(drawProgress * (points1.length - 1));
                    const nextIdx = Math.min(idx + 1, points1.length - 1);
                    const cx = points1[idx].x + (points1[nextIdx].x - points1[idx].x) * frac;
                    const cy = points1[idx].y + (points1[nextIdx].y - points1[idx].y) * frac;
                    return (
                        <circle cx={cx} cy={cy} r={5} fill={color}
                            style={{ filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})` }}
                        />
                    );
                })()}
            </svg>
        </div>
    );
};

// ══════════════════════════════════════════════
// 2. LABELED BAR CHART (with Y-axis, melt option)
// ══════════════════════════════════════════════
export const LabeledBarChart: React.FC<{
    data: { label: string; value: number; sublabel?: string }[];
    title: string;
    yUnit?: string;
    color?: string;
    highlightLast?: boolean;
    meltFrameStart?: number; // frame at which bars start collapsing (S8 zombie effect)
    width?: number;
    height?: number;
}> = ({ data, title, yUnit = "", color = "#ff3a5e", highlightLast = false, meltFrameStart, width = 900, height = 500 }) => {
    const frame = useCurrentFrame();
    const padL = 80;
    const padB = 70;
    const padT = 70;
    const padR = 30;

    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const maxVal = Math.max(...data.map((d) => d.value));
    const barW = (chartW / data.length) * 0.58;
    const gap = (chartW / data.length) * 0.42;
    const titleOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });

    return (
        <div style={{ position: "relative", width, height }}>
            <div
                style={{
                    position: "absolute", top: 8, left: padL,
                    fontFamily: FONTS.mono, fontSize: 28,
                    color: "rgba(238,244,255,0.55)",
                    letterSpacing: 2, textTransform: "uppercase" as const,
                    opacity: titleOpacity,
                }}
            >
                {title}
            </div>

            <svg width={width} height={height}>
                {/* Y gridlines */}
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = padT + (i / 4) * chartH;
                    const val = maxVal - (i / 4) * maxVal;
                    return (
                        <g key={i}>
                            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="rgba(255,255,255,0.06)" />
                            <text x={padL - 10} y={y + 4} textAnchor="end" fill="rgba(238,244,255,0.4)" fontSize={24} fontFamily={FONTS.mono}>
                                {yUnit}{val >= 1000 ? `${(val / 1000).toFixed(1)}T` : val.toFixed(0)}
                            </text>
                        </g>
                    );
                })}
                {/* Axes */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />
                <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />

                {/* Bars */}
                {data.map((d, i) => {
                    const fullBarH = (d.value / maxVal) * chartH;
                    const x = padL + i * (barW + gap) + gap / 2;
                    const growProgress = interpolate(frame, [10 + i * 8, 55 + i * 8], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.out(Easing.exp),
                    });

                    // Melt effect — bars collapse after meltFrameStart
                    const meltProgress = meltFrameStart
                        ? interpolate(frame, [meltFrameStart + i * 6, meltFrameStart + i * 6 + 40], [1, 0.05], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.in(Easing.exp),
                        })
                        : 1;

                    const barH = fullBarH * growProgress * meltProgress;
                    const isHighlight = highlightLast && i === data.length - 1;
                    const barColor = isHighlight ? "#ff6060" : color;
                    const glow = isHighlight ? `drop-shadow(0 0 14px ${barColor})` : `drop-shadow(0 0 5px ${barColor}55)`;

                    return (
                        <g key={i}>
                            <rect
                                x={x} y={padT + chartH - barH}
                                width={barW} height={barH}
                                fill={barColor} opacity={0.85 * meltProgress + 0.15} rx={3}
                                style={{ filter: glow }}
                            />
                            {/* Value label */}
                            {growProgress > 0.75 && meltProgress > 0.4 && (
                                <text
                                    x={x + barW / 2} y={padT + chartH - barH - 9}
                                    textAnchor="middle" fill={barColor}
                                    fontSize={24} fontFamily={FONTS.mono}
                                    fontWeight={isHighlight ? 700 : 400}
                                    opacity={meltProgress}
                                >
                                    {yUnit}{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}T` : d.value}
                                </text>
                            )}
                            {/* X label */}
                            <text x={x + barW / 2} y={padT + chartH + 26} textAnchor="middle" fill="rgba(238,244,255,0.45)" fontSize={24} fontFamily={FONTS.mono}>
                                {d.label}
                            </text>
                            {d.sublabel && (
                                <text x={x + barW / 2} y={padT + chartH + 42} textAnchor="middle" fill="rgba(238,244,255,0.28)" fontSize={20} fontFamily={FONTS.mono}>
                                    {d.sublabel}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// ══════════════════════════════════════════════
// 3. ANIMATED COUNTER (ticking number)
// ══════════════════════════════════════════════
export const AnimatedCounter: React.FC<{
    from: number;
    to: number;
    prefix?: string;
    suffix?: string;
    label: string;
    color?: string;
    startFrame?: number;
}> = ({ from, to, prefix = "", suffix = "", label, color = "#1de4ff", startFrame = 20 }) => {
    const frame = useCurrentFrame();
    const value = interpolate(frame, [startFrame, startFrame + 160], [from, to], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
    });

    const entrance = interpolate(frame, [0, 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    const formatted = value >= 1e12
        ? `${(value / 1e12).toFixed(2)}T`
        : value >= 1e9
            ? `${(value / 1e9).toFixed(1)}B`
            : value.toFixed(2);

    return (
        <div
            style={{
                opacity: entrance,
                display: "flex",
                flexDirection: "column",
                gap: 16,
            }}
        >
            <div
                style={{
                    fontFamily: FONTS.title,
                    fontSize: 140,
                    fontWeight: 400,
                    color,
                    textShadow: `0 0 50px ${color}88, 0 0 100px ${color}33`,
                    letterSpacing: -2,
                    lineHeight: 1,
                }}
            >
                {prefix}{formatted}{suffix}
            </div>
            <div
                style={{
                    fontFamily: FONTS.mono,
                    fontSize: 24,
                    color: "rgba(238,244,255,0.5)",
                    letterSpacing: 4,
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// 4. ANIMATED GAUGE (needle to danger zone)
// ══════════════════════════════════════════════
export const AnimatedGauge: React.FC<{
    value: number;
    label: string;
    dangerZone?: number;
    size?: number;
}> = ({ value, label, dangerZone = 70, size = 400 }) => {
    const frame = useCurrentFrame();
    const needleProgress = interpolate(frame, [30, 160], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.exp),
    });

    const angle = -135 + needleProgress * (value / 100) * 270;
    const entrance = interpolate(frame, [0, 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });
    const inDanger = value > dangerZone;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;

    const displayValue = Math.round(needleProgress * value);
    const needleColor = inDanger ? "#ff3a5e" : "#1de4ff";

    return (
        <div style={{ opacity: entrance, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Track arc */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={18} strokeDasharray={`${r * Math.PI * 1.5} ${r * Math.PI * 2}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
                {/* Danger zone */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,50,50,0.25)" strokeWidth={18} strokeDasharray={`${r * Math.PI * 0.45} ${r * Math.PI * 2}`} strokeLinecap="round" transform={`rotate(${135 + (dangerZone / 100) * 270} ${cx} ${cy})`} />
                {/* Active arc fill */}
                <circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke={needleColor} strokeWidth={18} strokeLinecap="round"
                    strokeDasharray={`${r * Math.PI * 1.5 * needleProgress * (value / 100)} ${r * Math.PI * 2}`}
                    transform={`rotate(135 ${cx} ${cy})`}
                    opacity={0.6}
                    style={{ filter: `drop-shadow(0 0 8px ${needleColor}66)` }}
                />
                {/* Tick labels */}
                {[0, 25, 50, 75, 100].map((v) => {
                    const a = (-135 + (v / 100) * 270) * (Math.PI / 180);
                    const tx = cx + (r + 28) * Math.cos(a);
                    const ty = cy + (r + 28) * Math.sin(a);
                    return (
                        <text key={v} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="rgba(238,244,255,0.4)" fontSize={24} fontFamily={FONTS.mono}>
                            {v}
                        </text>
                    );
                })}
                {/* Needle */}
                <line
                    x1={cx} y1={cy}
                    x2={cx + r * 0.82 * Math.cos((angle * Math.PI) / 180)}
                    y2={cy + r * 0.82 * Math.sin((angle * Math.PI) / 180)}
                    stroke={needleColor} strokeWidth={4} strokeLinecap="round"
                    style={{ filter: inDanger ? `drop-shadow(0 0 10px ${needleColor})` : "none" }}
                />
                <circle cx={cx} cy={cy} r={9} fill={needleColor} style={{ filter: `drop-shadow(0 0 8px ${needleColor})` }} />
                {/* Center value */}
                <text x={cx} y={cy + 64} textAnchor="middle" fill="#eef4ff" fontSize={48} fontFamily={FONTS.title} fontWeight={400}>
                    {displayValue}%
                </text>
            </svg>
            <div style={{ fontFamily: FONTS.mono, fontSize: 26, color: "rgba(238,244,255,0.5)", letterSpacing: 3, textTransform: "uppercase" }}>
                {label}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// 5. DONUT CHART
// ══════════════════════════════════════════════
export const DonutChart: React.FC<{
    segments: { label: string; value: number; color: string }[];
    title: string;
    centerLabel?: string;
    size?: number;
}> = ({ segments, title, centerLabel, size = 400 }) => {
    const frame = useCurrentFrame();
    const entrance = interpolate(frame, [0, 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.35;
    const strokeW = 38;
    let cumAngle = -90;

    return (
        <div style={{ opacity: entrance, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 28, color: "rgba(238,244,255,0.55)", letterSpacing: 2, textTransform: "uppercase" as const }}>{title}</div>
            <div style={{ position: "relative" }}>
                <svg width={size} height={size}>
                    {segments.map((seg, i) => {
                        const segAngle = (seg.value / total) * 360;
                        const drawProgress = interpolate(frame, [20 + i * 14, 75 + i * 14], [0, 1], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.out(Easing.exp),
                        });
                        const dashLen = (segAngle / 360) * 2 * Math.PI * r * drawProgress;
                        const startAngle = cumAngle;
                        cumAngle += segAngle;
                        const midAngle = (startAngle + segAngle / 2) * (Math.PI / 180);
                        const lx = cx + (r + 50) * Math.cos(midAngle);
                        const ly = cy + (r + 50) * Math.sin(midAngle);

                        return (
                            <g key={i}>
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={strokeW}
                                    strokeDasharray={`${dashLen} ${2 * Math.PI * r}`}
                                    transform={`rotate(${startAngle} ${cx} ${cy})`}
                                    opacity={0.88}
                                    style={{ filter: `drop-shadow(0 0 8px ${seg.color}55)` }}
                                />
                                {drawProgress > 0.5 && (
                                    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(238,244,255,0.6)" fontSize={24} fontFamily={FONTS.mono}>
                                        {seg.label} ({Math.round((seg.value / total) * 100)}%)
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
                {centerLabel && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#eef4ff", fontFamily: FONTS.title, fontSize: 46, fontWeight: 400, textAlign: "center" }}>
                        {centerLabel}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: 20 }}>
                {segments.map((seg, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, backgroundColor: seg.color, borderRadius: 2 }} />
                        <span style={{ color: "rgba(238,244,255,0.55)", fontFamily: FONTS.mono, fontSize: 22 }}>{seg.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// 6. STACKED AREA CHART (Revenue vs Spending or Crash vs Burn)
// ══════════════════════════════════════════════
export const StackedAreaChart: React.FC<{
    lineA: { label: string; value: number }[];
    lineB: { label: string; value: number }[];
    labelA: string;
    labelB: string;
    colorA?: string;
    colorB?: string;
    title?: string;
    highlightCrossover?: boolean; // flash effect at crossover point
    width?: number;
    height?: number;
    startFrame?: number;
}> = ({ lineA, lineB, labelA, labelB, colorA = "#1de4ff", colorB = "#ff3a5e", title, highlightCrossover = false, width = 960, height = 520, startFrame = 20 }) => {
    const frame = useCurrentFrame();
    const padL = 80;
    const padB = 80;
    const padT = title ? 65 : 30;
    const padR = 80;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const allVals = [...lineA.map((r) => r.value), ...lineB.map((s) => s.value)];
    const maxVal = Math.max(...allVals);
    const minVal = Math.min(...allVals);
    const range = maxVal - minVal || 1;

    const drawProgress = interpolate(frame, [startFrame, startFrame + 120], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
    });

    const titleOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
    const labelOpacity = interpolate(frame, [startFrame + 100, startFrame + 120], [0, 1], { extrapolateRight: "clamp" });

    const toPoints = (data: { label: string; value: number }[]) =>
        data.map((d, i) => ({
            x: padL + (i / (data.length - 1)) * chartW,
            y: padT + chartH - ((d.value - minVal) / range) * chartH,
        }));

    const ptA = toPoints(lineA);
    const ptB = toPoints(lineB);

    const pathA = ptA.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const pathB = ptB.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaA = `${pathA} L ${ptA[ptA.length - 1].x} ${padT + chartH} L ${ptA[0].x} ${padT + chartH} Z`;
    const areaB = `${pathB} L ${ptB[ptB.length - 1].x} ${padT + chartH} L ${ptB[0].x} ${padT + chartH} Z`;

    const evolvedA = evolvePath(drawProgress, pathA);
    const evolvedB = evolvePath(drawProgress, pathB);

    // Find approximate crossover x position (where lineA and lineB intersect)
    let crossX = 0, crossY = 0;
    if (highlightCrossover) {
        for (let i = 0; i < ptA.length - 1; i++) {
            if ((ptA[i].y - ptB[i].y) * (ptA[i + 1].y - ptB[i + 1].y) <= 0) {
                crossX = (ptA[i].x + ptA[i + 1].x) / 2;
                crossY = (ptA[i].y + ptB[i].y) / 2;
                break;
            }
        }
    }

    const crossoverFlash = highlightCrossover
        ? interpolate(frame, [startFrame + 80, startFrame + 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : 0;

    return (
        <div style={{ position: "relative", width, height }}>
            {title && (
                <div style={{ position: "absolute", top: 8, left: padL, fontFamily: FONTS.mono, fontSize: 28, color: "rgba(238,244,255,0.55)", letterSpacing: 2, textTransform: "uppercase" as const, opacity: titleOpacity }}>
                    {title}
                </div>
            )}
            <svg width={width} height={height}>
                {/* Grid */}
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = padT + (i / 4) * chartH;
                    return <line key={i} x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="rgba(255,255,255,0.06)" />;
                })}
                {/* X labels */}
                {lineA.map((d, i) => (
                    <text key={i} x={padL + (i / (lineA.length - 1)) * chartW} y={padT + chartH + 26} textAnchor="middle" fill="rgba(238,244,255,0.4)" fontSize={24} fontFamily={FONTS.mono}>
                        {d.label}
                    </text>
                ))}

                {/* Axes */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />
                <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />

                {/* Area fills */}
                <path d={areaA} fill={colorA} opacity={0.08 * drawProgress} />
                <path d={areaB} fill={colorB} opacity={0.12 * drawProgress} />

                {/* Lines */}
                <path d={pathA} fill="none" stroke={colorA} strokeWidth={3.5} strokeLinecap="round"
                    strokeDasharray={evolvedA.strokeDasharray} strokeDashoffset={evolvedA.strokeDashoffset}
                    style={{ filter: `drop-shadow(0 0 10px ${colorA}) drop-shadow(0 0 24px ${colorA}44)` }} />
                <path d={pathB} fill="none" stroke={colorB} strokeWidth={4.5} strokeLinecap="round"
                    strokeDasharray={evolvedB.strokeDasharray} strokeDashoffset={evolvedB.strokeDashoffset}
                    style={{ filter: `drop-shadow(0 0 14px ${colorB}) drop-shadow(0 0 28px ${colorB}55)` }} />

                {/* End labels */}
                {ptA.length > 0 && (
                    <text x={ptA[ptA.length - 1].x + 10} y={ptA[ptA.length - 1].y} fill={colorA} fontSize={24} fontFamily={FONTS.mono} fontWeight={700} opacity={labelOpacity}>
                        {labelA}
                    </text>
                )}
                {ptB.length > 0 && (
                    <text x={ptB[ptB.length - 1].x + 10} y={ptB[ptB.length - 1].y} fill={colorB} fontSize={24} fontFamily={FONTS.mono} fontWeight={700} opacity={labelOpacity}>
                        {labelB}
                    </text>
                )}

                {/* Crossover flash */}
                {highlightCrossover && crossoverFlash > 0 && crossX > 0 && (
                    <>
                        {[1, 2, 3].map(i => (
                            <circle key={i} cx={crossX} cy={crossY}
                                r={10 + i * 14 * crossoverFlash}
                                fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5}
                                opacity={(1 - crossoverFlash) * 0.7}
                            />
                        ))}
                        <circle cx={crossX} cy={crossY} r={7} fill="white"
                            style={{ filter: "drop-shadow(0 0 12px white) drop-shadow(0 0 24px white)" }}
                            opacity={crossoverFlash}
                        />
                    </>
                )}
            </svg>
        </div>
    );
};
