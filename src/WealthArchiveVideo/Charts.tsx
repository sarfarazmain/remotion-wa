import React from "react";
import { interpolate, Easing } from "remotion";
import { useSceneFrame } from "./SceneContext";
import { ARCHIVE_FONTS, C } from "./fonts";


/*
 * CHARTS — Physical / Archival Style
 * ─────────────────────────────────────
 * No neon. No glow. These charts look like they were drafted by a
 * forensic accountant: thick, deliberate lines on cream cards with
 * hard drop-shadows.
 *
 * Rules:
 *  - Background: CREAM card (#F4F1EA), box-shadow 10px 10px 0 rgba(0,0,0,0.5)
 *  - Lines: GOLD (C.GOLD) for growth, OXBLOOD (C.OXBLOOD) for decline
 *  - Draw animation: strokeDashoffset driven by stepped frames (stop-motion)
 *  - Labels: JetBrains Mono, NAVY text, small and annotative
 *  - Axes: thin, 1px, NAVY at 40% opacity
 */

interface DataPoint {
    label: string;
    value: number;
    sublabel?: string;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* PHYSICAL LINE CHART                                                          */
/* ──────────────────────────────────────────────────────────────────────────── */
export const PhysicalLineChart: React.FC<{
    data: DataPoint[];
    secondLine?: {
        data: DataPoint[];
        color?: string;
        label?: string;
    };
    title: string;
    yUnit?: string;
    lineLabel?: string;
    color?: string;
    width?: number;
    height?: number;
    startFrame?: number;
    drawDuration?: number;
    filterId?: string;
}> = ({
    data,
    secondLine,
    title,
    yUnit = "",
    lineLabel,
    color = C.GOLD,
    width = 780,
    height = 440,
    startFrame = 0,
    drawDuration = 60,
    filterId = "lcf",
}) => {
        const frame = useSceneFrame();

        // Micro-animation: subtle floating drift
        const floatY = Math.sin(frame * 0.02) * 3;
        const floatR = Math.cos(frame * 0.015) * 0.4;


        const padL = 72, padR = 40, padT = 52, padB = 60;
        const cW = width - padL - padR;
        const cH = height - padT - padB;

        // Combine both lines to compute shared Y scale
        const allValues = [...data.map(d => d.value), ...(secondLine?.data.map(d => d.value) ?? [])];
        const minY = Math.min(...allValues) * 0.88;
        const maxY = Math.max(...allValues) * 1.06;
        const yRange = maxY - minY || 1;

        const xPos = (i: number) => padL + (i / (data.length - 1)) * cW;
        const yPos = (v: number) => padT + cH - ((v - minY) / yRange) * cH;

        const makePath = (pts: DataPoint[]): string => {
            return pts.map((d, i) =>
                `${i === 0 ? "M" : "L"} ${xPos(i).toFixed(1)} ${yPos(d.value).toFixed(1)}`
            ).join(" ");
        };

        // Approximate path length for strokeDasharray
        const pathLen = (pts: DataPoint[]) => {
            let len = 0;
            for (let i = 1; i < pts.length; i++) {
                const dx = xPos(i) - xPos(i - 1);
                const dy = yPos(pts[i].value) - yPos(pts[i - 1].value);
                len += Math.sqrt(dx * dx + dy * dy);
            }
            return Math.ceil(len * 1.05);
        };

        const mainLen = pathLen(data);
        const secondLen = secondLine ? pathLen(secondLine.data) : 0;

        const drawP = interpolate(frame, [startFrame, startFrame + drawDuration], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
        });

        const yTicks = [minY, (minY + maxY) / 2, maxY];

        return (
            <div
                style={{
                    width,
                    height,
                    background: C.CREAM,
                    boxShadow: "10px 10px 0px rgba(0,0,0,0.45)",
                    position: "relative",
                    flexShrink: 0,
                    transform: `translateY(${floatY}px) rotate(${floatR}deg)`,
                }}
            >
                {/* Chart title */}
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        left: padL,
                        fontFamily: ARCHIVE_FONTS.mono,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.NAVY,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: 0.7,
                    }}
                >
                    {title}
                </div>

                <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
                    <defs>
                        <filter id={filterId} x="-2%" y="-5%" width="104%" height="110%">
                            <feTurbulence type="turbulence" baseFrequency="0.01 0.04"
                                numOctaves="2" seed="12" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise"
                                scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </defs>

                    {/* Axis lines */}
                    <line x1={padL} y1={padT} x2={padL} y2={padT + cH}
                        stroke={C.NAVY} strokeWidth="1" opacity="0.35" />
                    <line x1={padL} y1={padT + cH} x2={padL + cW} y2={padT + cH}
                        stroke={C.NAVY} strokeWidth="1" opacity="0.35" />

                    {/* Y-axis grid + ticks */}
                    {yTicks.map((v, i) => {
                        const y = yPos(v);
                        return (
                            <g key={i}>
                                <line x1={padL} y1={y} x2={padL + cW} y2={y}
                                    stroke={C.NAVY} strokeWidth="0.5" strokeDasharray="4,6" opacity="0.18" />
                                <text x={padL - 8} y={y + 4} textAnchor="end"
                                    fontFamily={ARCHIVE_FONTS.mono} fontSize="13"
                                    fill={C.NAVY} opacity="0.55">
                                    {yUnit}{Math.round(v)}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-axis labels */}
                    {data.map((d, i) => (
                        <text key={i} x={xPos(i)} y={padT + cH + 20} textAnchor="middle"
                            fontFamily={ARCHIVE_FONTS.mono} fontSize="14"
                            fill={C.NAVY} opacity="0.60">
                            {d.label}
                        </text>
                    ))}

                    {/* Second line (if provided) */}
                    {secondLine && (
                        <path
                            d={makePath(secondLine.data)}
                            fill="none"
                            stroke={secondLine.color ?? C.OXBLOOD}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={secondLen}
                            strokeDashoffset={secondLen * (1 - drawP)}
                            opacity="0.82"
                            filter={`url(#${filterId})`}
                        />
                    )}

                    {/* Main line */}
                    <path
                        d={makePath(data)}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={mainLen}
                        strokeDashoffset={mainLen * (1 - drawP)}
                        filter={`url(#${filterId})`}
                    />

                    {/* Line label at end */}
                    {lineLabel && drawP > 0.95 && (
                        <text
                            x={xPos(data.length - 1) + 8}
                            y={yPos(data[data.length - 1].value)}
                            fontFamily={ARCHIVE_FONTS.mono}
                            fontSize="14"
                            fontWeight="700"
                            fill={color}
                            opacity={Math.min(1, (drawP - 0.95) * 20)}
                        >
                            {lineLabel}
                        </text>
                    )}
                    {secondLine?.label && drawP > 0.95 && (
                        <text
                            x={xPos(secondLine.data.length - 1) + 8}
                            y={yPos(secondLine.data[secondLine.data.length - 1].value) - 8}
                            fontFamily={ARCHIVE_FONTS.mono}
                            fontSize="14"
                            fontWeight="700"
                            fill={secondLine.color ?? C.OXBLOOD}
                            opacity={Math.min(1, (drawP - 0.95) * 20)}
                        >
                            {secondLine.label}
                        </text>
                    )}
                </svg>
            </div>
        );
    };

/* ──────────────────────────────────────────────────────────────────────────── */
/* PHYSICAL BAR CHART                                                           */
/* ──────────────────────────────────────────────────────────────────────────── */
export const PhysicalBarChart: React.FC<{
    data: DataPoint[];
    title: string;
    yUnit?: string;
    color?: string;
    highlightLast?: boolean;
    width?: number;
    height?: number;
    startFrame?: number;
    drawDuration?: number;
}> = ({
    data,
    title,
    yUnit = "",
    color = C.GOLD,
    highlightLast = false,
    width = 780,
    height = 440,
    startFrame = 0,
    drawDuration = 50,
}) => {
        const frame = useSceneFrame();

        // Micro-animation: subtle floating drift
        const floatY = Math.sin(frame * 0.025) * 3;
        const floatR = Math.sin(frame * 0.01) * 0.3;


        const padL = 72, padR = 28, padT = 52, padB = 60;
        const cW = width - padL - padR;
        const cH = height - padT - padB;

        const maxY = Math.max(...data.map(d => d.value)) * 1.08;
        const barW = Math.floor((cW / data.length) * 0.58);
        const barGap = Math.floor(cW / data.length);

        const drawP = interpolate(frame, [startFrame, startFrame + drawDuration], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
        });

        return (
            <div
                style={{
                    width,
                    height,
                    background: C.CREAM,
                    boxShadow: "10px 10px 0px rgba(0,0,0,0.45)",
                    position: "relative",
                    flexShrink: 0,
                    transform: `translateY(${floatY}px) rotate(${floatR}deg)`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        left: padL,
                        fontFamily: ARCHIVE_FONTS.mono,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.NAVY,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: 0.7,
                    }}
                >
                    {title}
                </div>

                <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
                    {/* Axes */}
                    <line x1={padL} y1={padT} x2={padL} y2={padT + cH}
                        stroke={C.NAVY} strokeWidth="1" opacity="0.35" />
                    <line x1={padL} y1={padT + cH} x2={padL + cW} y2={padT + cH}
                        stroke={C.NAVY} strokeWidth="1" opacity="0.35" />

                    {/* Bars */}
                    {data.map((d, i) => {
                        const barH = (d.value / maxY) * cH * drawP;
                        const x = padL + i * barGap + (barGap - barW) / 2;
                        const y = padT + cH - barH;
                        const isLast = i === data.length - 1;
                        const barColor = highlightLast && isLast ? C.OXBLOOD : color;

                        return (
                            <g key={i}>
                                <rect x={x} y={y} width={barW} height={barH}
                                    fill={barColor} opacity={isLast && highlightLast ? 0.9 : 0.75} />
                                <text x={x + barW / 2} y={padT + cH + 20} textAnchor="middle"
                                    fontFamily={ARCHIVE_FONTS.mono} fontSize="13"
                                    fill={C.NAVY} opacity="0.60">
                                    {d.label}
                                </text>
                                {d.sublabel && barH > 40 && (
                                    <text x={x + barW / 2} y={y - 8} textAnchor="middle"
                                        fontFamily={ARCHIVE_FONTS.mono} fontSize="12"
                                        fill={barColor} opacity="0.8">
                                        {d.sublabel}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Y value labels */}
                    {[0, 0.5, 1].map((p, i) => {
                        const v = Math.round(maxY * p);
                        const y = padT + cH - p * cH;
                        return (
                            <text key={i} x={padL - 8} y={y + 4} textAnchor="end"
                                fontFamily={ARCHIVE_FONTS.mono} fontSize="13"
                                fill={C.NAVY} opacity="0.50">
                                {yUnit}{v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                            </text>
                        );
                    })}
                </svg>
            </div>
        );
    };

/* ──────────────────────────────────────────────────────────────────────────── */
/* EVIDENCE CARD — wraps any content in a physical card treatment              */
/* ──────────────────────────────────────────────────────────────────────────── */
export const EvidenceCard: React.FC<{
    children: React.ReactNode;
    width?: number;
    startFrame?: number;
    label?: string;
}> = ({ children, width = 780, startFrame = 0, label }) => {
    const frame = useSceneFrame();
    const opacity = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const ty = interpolate(frame, [startFrame, startFrame + 16], [22, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    // continuous drift
    const driftY = Math.sin(frame * 0.03) * 2;
    const driftR = Math.cos(frame * 0.02) * 0.2;

    return (
        <div
            style={{
                opacity,
                transform: `translateY(${ty + driftY}px) rotate(${driftR}deg)`,
                background: C.CREAM,
                boxShadow: "10px 10px 0 rgba(0,0,0,0.48)",
                padding: 24,
                position: "relative",
                width,
            }}
        >
            {label && (
                <div
                    style={{
                        fontFamily: ARCHIVE_FONTS.mono,
                        fontSize: 14,
                        color: C.OXBLOOD,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginBottom: 14,
                    }}
                >
                    ▸ {label}
                </div>
            )}
            {children}
        </div>
    );
};
