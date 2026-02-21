import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, ARCHIVE_FONTS } from "../fonts";
import { SAFE_BOX } from "../LayoutConstants";

export const PersistentArchivalHUD: React.FC<{
    hudPath?: string;
    hudTimestamp?: string;
    hudCitation?: string;
}> = ({ hudPath, hudTimestamp, hudCitation }) => {
    const frame = useCurrentFrame();
    const isBlinking = Math.floor(frame / 15) % 2 === 0;

    return (
        <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
            {/* Top Left: File Path */}
            <div style={{
                position: "absolute",
                top: SAFE_BOX.top,
                left: SAFE_BOX.left,
                fontFamily: ARCHIVE_FONTS.mono,
                fontSize: 16,
                color: C.CREAM,
                opacity: 0.7,
                letterSpacing: "0.1em"
            }}>
                {hudPath || "ARCHIVE // FILE_004 // EVIDENCE_LOG"}
            </div>

            {/* Top Right: Timestamp */}
            <div style={{
                position: "absolute",
                top: SAFE_BOX.top,
                right: 1080 - SAFE_BOX.right,
                textAlign: "right",
                fontFamily: ARCHIVE_FONTS.mono,
                fontSize: 16,
                color: C.CREAM,
                opacity: 0.7,
                letterSpacing: "0.1em",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8
            }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "red", opacity: isBlinking ? 1 : 0 }} />
                {hudTimestamp || "REC: 1929-10-24"}
            </div>

            {/* Bottom Left: Source Citation */}
            <div style={{
                position: "absolute",
                top: SAFE_BOX.bottom - 20,
                left: SAFE_BOX.left,
                fontFamily: ARCHIVE_FONTS.mono,
                fontSize: 16,
                color: C.CREAM,
                opacity: 0.7,
                letterSpacing: "0.1em"
            }}>
                {hudCitation || "SOURCE: FEDERAL RESERVE ARCHIVES"}
            </div>
        </AbsoluteFill>
    );
};
