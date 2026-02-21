import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhysicsProfile } from "./VarianceTypes";

/**
 * PHYSICS ENGINE
 * ────────────────
 * Returns the animation value (0 to 1) based on the PhysicsProfile.
 */

export const useVarianceTransition = (profile: PhysicsProfile, delay: number = 0) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const activeFrame = Math.max(0, frame - delay);

    // PROFILE 1: THE SLAM (Heavy, bounce)
    if (profile === PhysicsProfile.SLAM) {
        return spring({
            frame: activeFrame,
            fps,
            config: { stiffness: 300, damping: 12 },
        });
    }

    // PROFILE 2: INSTITUTIONAL GLIDE (Slow, controlled)
    if (profile === PhysicsProfile.GLIDE) {
        return spring({
            frame: activeFrame,
            fps,
            config: { stiffness: 100, damping: 20 },
        });
    }

    // PROFILE 3: STOP-MOTION (Posterized 7.5fps)
    if (profile === PhysicsProfile.STOP_MOTION) {
        // Quantize frame to 4-frame steps (30fps / 4 = 7.5fps)
        const steppedFrame = Math.floor(activeFrame / 4) * 4;

        // Use a linear scrub or a very stiff spring on the stepped frame
        return spring({
            frame: steppedFrame,
            fps,
            config: { stiffness: 200, damping: 20 }, // Snappy but stepped
        });
    }

    return 0;
};
