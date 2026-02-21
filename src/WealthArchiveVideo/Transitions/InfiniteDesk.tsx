import React from "react";
import { useVideoConfig, spring, interpolate } from "remotion";

interface Props {
    children: React.ReactNode;
    frame: number;
    duration: number;
    entering?: boolean;
    exiting?: boolean;
    direction: "LEFT" | "RIGHT" | "DOWN";
}

export const InfiniteDesk: React.FC<Props> = ({ children, frame, duration, entering, exiting, direction }) => {
    const { fps } = useVideoConfig();

    // LOGIC:
    // Continuous Substrate. The layout swipes off, new one swipes in.
    // Since background is decoupled, this just moves the content container.

    let translateX = 0;
    let translateY = 0;

    const TRANSITION_DURATION = 25; // Frames

    if (exiting) {
        // Scene A leaves
        const exitFrame = frame - (duration - TRANSITION_DURATION);

        if (exitFrame > 0) {
            const progress = spring({
                frame: exitFrame,
                fps,
                config: { stiffness: 200, damping: 20 },
            });

            const exitDist = 1200; // Enough to clear 1080px width

            if (direction === "LEFT") {
                translateX = interpolate(progress, [0, 1], [0, -exitDist]);
            } else if (direction === "RIGHT") {
                translateX = interpolate(progress, [0, 1], [0, exitDist]);
            } else if (direction === "DOWN") {
                translateY = interpolate(progress, [0, 1], [0, 2000]); // Clear height
            }
        }
    }

    if (entering) {
        // Scene B enters
        // It should start OFF SCREEN and come to 0
        const progress = spring({
            frame: frame, // Starts at 0
            fps,
            config: { stiffness: 200, damping: 20 },
        });

        const enterDist = 1200;

        // If A moved LEFT, B should come from RIGHT (to follow)?
        // Or if A moved LEFT, B comes from RIGHT to fill the void.
        // Actually typically "Infinite Desk" implies dragging the camera.
        // If we drag camera RIGHT, objects move LEFT.
        // So B should start at Right and move to Center.

        if (direction === "LEFT") { // Pan Left -> Objects move Right? or Move Left?
            // User says: "Scene A swept off (panning left)... Scene B tossed on from opposite side."
            // If A goes Left, B comes from Right.
            translateX = interpolate(progress, [0, 1], [enterDist, 0]);
        } else if (direction === "RIGHT") {
            // A goes Right, B comes from Left
            translateX = interpolate(progress, [0, 1], [-enterDist, 0]);
        } else if (direction === "DOWN") {
            // A drops down, B drops in from Top? Or comes up?
            // "Tossed onto the desk" typically implies dropping in.
            translateY = interpolate(progress, [0, 1], [-2000, 0]);
        }
    }

    return (
        <div style={{
            width: "100%",
            height: "100%",
            transform: `translateX(${translateX}px) translateY(${translateY}px)`,
            willChange: "transform",
        }}>
            {children}
        </div>
    );
};
