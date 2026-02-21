import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { Printer } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json"; // We will need to allow this import

export const Scene1: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Enhanced Paper Stack Animation for Vertical
    const papers = new Array(12).fill(0).map((_, i) => {
        const delay = i * 3;
        const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12 },
        });

        const y = interpolate(progress, [0, 1], [-200, 400]);
        const scale = interpolate(progress, [0, 1], [0.5, 1]);
        const rotate = interpolate(progress, [0, 1], [Math.sin(i) * 360, (i % 2 === 0 ? 5 : -5)]);
        const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 1]);

        // Staggered pile
        return (
            <div
                key={i}
                style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: `translate(-50%, ${y}px) rotate(${rotate}deg) scale(${scale})`,
                    width: 500, // Wider for vertical phone feel
                    height: 250,
                    backgroundColor: "#EEF",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
                    opacity,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#114",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    fontSize: 40,
                    border: `4px solid ${THEME.colors.accents.gold}`,
                    borderRadius: 4,
                    zIndex: i
                }}
            >
                <div style={{ padding: "10px 20px", border: "2px dashed #99a", borderRadius: 4 }}>
                    $100,000,000
                </div>
            </div>
        );
    });

    // Floating Printer Icon
    const iconY = interpolate(frame, [0, 100], [0, -20]);

    return (
        <AbsoluteFill>
            <VideoBackground src={assets.scene1} opacity={0.4} />

            {/* Background Glow */}
            <AbsoluteFill style={{
                background: `radial-gradient(circle at 50% 30%, ${THEME.colors.accents.gold}22 0%, transparent 60%)`
            }} />

            <div style={{ position: "absolute", width: "100%", height: "100%", overflow: "hidden" }}>
                {papers}
            </div>

            <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300 }}>
                <div style={{ transform: `translateY(${iconY}px)` }}>
                    <Printer size={120} color={THEME.colors.accents.gold} />
                </div>
                <Title style={{ marginTop: 40, fontSize: 90 }}>Fed Money Printer</Title>
                <Label glowing style={{ marginTop: 20 }}>Quantitative Easing</Label>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
