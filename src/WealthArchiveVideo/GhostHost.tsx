import React from "react";
import { AbsoluteFill, useCurrentFrame, staticFile, Video } from "remotion";
import { C } from "./fonts";

/**
 * WARP 18.1: The Full-Bleed Ghost Host Sequence
 * 
 * 1. The Substrate Backdrop: Pure Midnight Navy, no grids.
 * 2. Medium Close-Up Cropping: Avatar is scaled up (1.5x) to fill 9:16 and chop off hands/desk.
 * 3. Aggressive Jump-Cuts (The AI Mask): Hard zoom punch-ins on dynamic beats.
 * 4. Interrogation Grade: Severe contrast/brightness crush + heavy radial mask.
 */

export const GhostHost: React.FC = () => {
    const frame = useCurrentFrame();

    // -- THE CADENCE TIMINGS (30fps) --
    // Total duration is roughly 2040 frames (68 seconds based on user script)
    // Beat 1: The Hook (0 - 4.5s) -> frames 0 to 135
    // "Central banks are not printing money anymore. The government is."
    const hookEnd = 135;
    const hookPunch = 90; // 3s Jump Cut on "anymore."

    // Beat 2: S5 Flash (21s-27s) -> frames 630 to 720 (21s to 24s)
    // "Fiscal dominance arrived."
    const flash1Start = 630;
    const flash1End = 720;

    // Beat 3: S7 Flash (33s-39s) -> frames 990 to 1080 (33s to 36s)
    // "Inflation is a policy choice. Not an accident"
    const flash2Start = 990;
    const flash2End = 1080;

    // Beat 4: S10 Flash (51s-55s) -> frames 1530 to 1620 (51s to 54s)
    // "Wealth is being redistributed from the saver to the spender."
    const flash3Start = 1530;
    const flash3End = 1620;

    // Beat 5: The Verdict (61s-68s) -> frames 1830 to 2040
    // "The printing press hasn’t stopped, it just found a new operator"
    const verdictStart = 1830;
    const verdictPunch = 1920; // Jump cut at 64s

    // -- STATE MACHINE --
    let isVisible = false;
    let cameraScale = 1.25; // Base Medium Close-Up

    if (frame >= 0 && frame < hookEnd) {
        isVisible = true;
        cameraScale = frame >= hookPunch ? 1.4 : 1.25;
    } else if (frame >= flash1Start && frame < flash1End) {
        isVisible = true;
        cameraScale = 1.4; // Always close up on flashes
    } else if (frame >= flash2Start && frame < flash2End) {
        isVisible = true;
        cameraScale = 1.4;
    } else if (frame >= flash3Start && frame < flash3End) {
        isVisible = true;
        cameraScale = 1.4;
    } else if (frame >= verdictStart) {
        isVisible = true;
        cameraScale = frame >= verdictPunch ? 1.4 : 1.25;
    }

    if (!isVisible) return null;

    return (
        <AbsoluteFill style={{
            backgroundColor: C.NAVY, // The Substrate Backdrop
            // Render on top of scenes, but below GlobalLens
            zIndex: 5,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden"
        }}>
            {/* The Lighting Mask wrapper */}
            <AbsoluteFill style={{
                WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 90%)",
                maskImage: "radial-gradient(circle, black 40%, transparent 90%)",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <Video
                    src={staticFile("first_video.mp4")}
                    style={{
                        width: "100%",
                        height: "100%",
                        // Force stretch to cover, but anchor it to the top so the head doesn't crop
                        objectFit: "cover",
                        objectPosition: "center 15%",
                        // The Interrogation Grade
                        filter: "grayscale(0.4) contrast(1.4) brightness(0.6) sepia(0.2)",
                        // The Medium Close-Up crop + Jump Cuts
                        transform: `scale(${cameraScale})`,
                        transformOrigin: "center 15%",
                    }}
                />
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
