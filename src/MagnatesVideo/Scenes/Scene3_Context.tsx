import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { Wallet, Banknote } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wallet Animation
  const walletScale = spring({
    frame,
    fps,
    config: { stiffness: 100 }
  });

  // Cards/Bills fanning out vertically
  const cards = new Array(5).fill(0).map((_, i) => {
    const progress = spring({
      frame: frame - 10 - i * 5,
      fps,
      config: { damping: 15 },
    });

    const y = interpolate(progress, [0, 1], [0, -150 - (i * 80)]);
    const rotate = interpolate(progress, [0, 1], [0, (i - 2) * 5]);
    const opacity = interpolate(progress, [0, 1], [0, 1]);

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${y}px) rotate(${rotate}deg)`,
          width: 400,
          height: 200,
          backgroundColor: "#F0F0F0",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          border: "2px solid #CCC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5 - i,
          opacity
        }}
      >
        <div style={{
          width: "90%", height: "80%",
          border: "2px dashed #CCC",
          borderRadius: 8,
          display: "flex",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 40px"
        }}>
          <Banknote size={40} color="#555" />
          <div style={{ fontSize: 50, color: "#333", fontWeight: "bold", fontFamily: "monospace" }}>$100</div>
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      <VideoBackground src={assets.scene3} opacity={0.3} />

      {/* Floating Wallet Base */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {cards}

        <div style={{
          transform: `scale(${walletScale})`,
          zIndex: 10,
          backgroundColor: "#1a1a1a",
          padding: 60,
          borderRadius: 40,
          border: `4px solid ${THEME.colors.text.primary}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}>
          <Wallet size={150} color={THEME.colors.accents.gold} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 200 }}>
        <Label>Fiat Currency</Label>
        <Title>Tangible Asset</Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
