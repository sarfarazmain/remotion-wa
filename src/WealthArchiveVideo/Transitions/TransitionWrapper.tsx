import React from "react";
import { AbsoluteFill } from "remotion";
import { ZAxisPortal } from "./ZAxisPortal";
import { InfiniteDesk } from "./InfiniteDesk";
import { InkBleed } from "./InkBleed";
import { Flashbulb } from "./Flashbulb";

export type TransitionType =
    | "NONE"
    | "Z_AXIS_PORTAL"
    | "INFINITE_DESK_LEFT"
    | "INFINITE_DESK_RIGHT"
    | "INFINITE_DESK_DOWN"
    | "INK_BLEED"
    | "FLASHBULB";

interface TransitionWrapperProps {
    children: React.ReactNode;
    type: TransitionType;
    frame: number; // Local frame of the scene
    duration: number; // Total duration of the scene
    entering?: boolean; // Is this scene entering?
    exiting?: boolean; // Is this scene exiting?
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
    children,
    type,
    frame,
    duration,
    entering,
    exiting
}) => {

    // RENDER LOGIC
    // We wrap the content in the appropriate transition container.
    // Note: Some transitions (like Flashbulb) are overlays, others (InfiniteDesk) are transforms.

    let content = <>{children}</>;

    // 1. FLASHBULB (Overlay - doesn't transform content, just adds a layer)
    if (type === "FLASHBULB" && (entering || exiting)) {
        // Flashbulb handles its own internal logic based on frame
        content = (
            <Flashbulb frame={frame} duration={duration} entering={entering} exiting={exiting}>
                {children}
            </Flashbulb>
        );
    }

    // 2. Z-AXIS PORTAL (Transform)
    else if (type === "Z_AXIS_PORTAL") {
        content = (
            <ZAxisPortal frame={frame} duration={duration} entering={entering} exiting={exiting}>
                {children}
            </ZAxisPortal>
        );
    }

    // 3. INFINITE DESK (Transform)
    else if (type.startsWith("INFINITE_DESK")) {
        const direction = type.replace("INFINITE_DESK_", "") as "LEFT" | "RIGHT" | "DOWN";
        content = (
            <InfiniteDesk
                frame={frame}
                duration={duration}
                entering={entering}
                exiting={exiting}
                direction={direction}
            >
                {children}
            </InfiniteDesk>
        );
    }

    // 4. INK BLEED (Mask)
    else if (type === "INK_BLEED") {
        content = (
            <InkBleed frame={frame} duration={duration} entering={entering} exiting={exiting}>
                {children}
            </InkBleed>
        );
    }

    return <AbsoluteFill>{content}</AbsoluteFill>;
};
