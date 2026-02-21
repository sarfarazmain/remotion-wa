import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const TechDemo: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        frame,
        fps,
        config: {
            damping: 200,
        },
    });

    const opacity = interpolate(frame, [0, 30], [0, 1], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
                fontSize: 80,
                fontFamily: "sans-serif",
            }}
        >
            <div style={{ transform: `scale(${scale})`, opacity }}>
                Remotion Tech Demo
            </div>
        </AbsoluteFill>
    );
};
