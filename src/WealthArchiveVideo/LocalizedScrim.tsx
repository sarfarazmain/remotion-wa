import React from "react";

/**
 * WARP v2.0 SOP Part XI: The Localized Scrim
 * ────────────────────────────────────────────
 * Any text rendered over complex B-roll (not a solid substrate)
 * MUST have a radial-gradient smudge placed directly behind it.
 * This prevents text from becoming unreadable when B-roll has
 * bright or busy areas.
 *
 * Default gradient:
 *   radial-gradient(ellipse at center, rgba(17,24,39,0.7) 0%, transparent 70%)
 *   where rgb(17,24,39) = Midnight Navy (#111827)
 */

interface LocalizedScrimProps {
    children: React.ReactNode;
    /** Override center opacity (default 0.7) */
    opacity?: number;
    /** Override gradient spread radius (default "70%") */
    spread?: string;
}

export const LocalizedScrim: React.FC<LocalizedScrimProps> = ({
    children,
    opacity = 0.7,
    spread = "70%",
}) => {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
            }}
        >
            {/* Scrim backdrop */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at center, rgba(17,24,39,${opacity}) 0%, transparent ${spread})`,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
            {/* Content above scrim */}
            <div style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
};
