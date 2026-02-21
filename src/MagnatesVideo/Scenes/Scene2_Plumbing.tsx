import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { THEME } from "../constants";
import { Title, Label } from "../Typography";
import { Server, Zap } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene2: React.FC = () => {
    const frame = useCurrentFrame();

    // 3D Perspective Tunnel of "Servers"
    const servers = new Array(12).fill(0).map((_, i) => {
        const z = (frame * 20 + i * 200) % 2000; // Moving towards camera
        const opacity = interpolate(z, [0, 1500, 2000], [0, 1, 0]);
        const scale = interpolate(z, [0, 2000], [0.5, 2]);

        return (
            <div
                key={i}
                style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    transform: `translate(-50%, -50%) translateZ(${z}px) scale(${scale})`,
                    opacity
                }}
            >
                {/* Left Bank */}
                <div style={{ position: "absolute", left: -400, transform: "rotateY(45deg)" }}>
                    <Server size={300} color={THEME.colors.text.secondary} strokeWidth={1} />
                </div>
                {/* Right Bank */}
                <div style={{ position: "absolute", left: 400, transform: "rotateY(-45deg)" }}>
                    <Server size={300} color={THEME.colors.text.secondary} strokeWidth={1} />
                </div>
            </div>
        );
    });

    // Data Stream
    const stream = new Array(20).fill(0).map((_, i) => {
        const y = (frame * 30 + i * 100) % 1920;
        return (
            <div
                key={i}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: y,
                    width: 8, height: 60,
                    backgroundColor: THEME.colors.accents.teal,
                    boxShadow: `0 0 20px ${THEME.colors.accents.teal}`,
                    borderRadius: 4,
                    transform: "translateX(-50%)"
                }}
            />
        );
    });

    return (
        <AbsoluteFill style={{ perspective: 1000, overflow: "hidden" }}>
            <VideoBackground src={assets.scene2} opacity={0.3} />

            {/* Background darker gradient overlay */}
            <AbsoluteFill style={{ background: "linear-gradient(to bottom, transparent, #000 80%)" }} />

            {/* Server Tunnel */}
            <AbsoluteFill style={{ transformStyle: "preserve-3d" }}>
                {servers}
            </AbsoluteFill>

            {/* Data Stream */}
            <AbsoluteFill>
                {stream}
            </AbsoluteFill>

            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
                <div style={{ padding: 40, background: "rgba(0,0,0,0.8)", borderRadius: 40, border: `2px solid ${THEME.colors.accents.teal}`, boxShadow: `0 0 50px ${THEME.colors.accents.teal}44` }}>
                    <Zap size={100} color={THEME.colors.accents.teal} fill={THEME.colors.accents.teal} />
                </div>
                <Title style={{ marginTop: 20 }}>Wall Street Plumbing</Title>
                <Label glowing style={{ marginTop: 20 }}>System Core</Label>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
