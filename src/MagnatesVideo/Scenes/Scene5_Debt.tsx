import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, random } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { Stamp, Award } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bond Certificate Animation
  const floatY = Math.sin(frame * 0.05) * 20;

  // Stamp Impact
  const stampFrame = 30;
  const stampProgress = spring({ frame: frame - stampFrame, fps, config: { stiffness: 300, damping: 15 } });
  const stampScale = interpolate(stampProgress, [0, 1], [3, 1]);
  const stampOpacity = interpolate(stampProgress, [0, 1], [0, 1]);

  // Shake on impact
  const shake = stampProgress > 0 && stampProgress < 1 ? Math.sin(frame * 50) * 20 * (1 - stampProgress) : 0;

  return (
    <AbsoluteFill style={{ perspective: 1000 }}>
      <VideoBackground src={assets.scene5} opacity={0.3} />

      {/* The Bond Certificate */}
      <div
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: `translate(-50%, calc(-50% + ${floatY}px + ${shake}px)) rotate(${shake * 0.1}deg)`,
          width: 800, height: 1100,
          backgroundColor: "#F9F7F1",
          borderRadius: 8,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", alignItems: "center", padding: 60,
          border: "20px double #444",
          backgroundImage: "repeating-linear-gradient(45deg, #F9F7F1 0, #F9F7F1 10px, #F0EEE5 10px, #F0EEE5 20px)"
        }}
      >
        {/* Header */}
        <div style={{ width: "100%", borderBottom: "4px solid #333", paddingBottom: 20, marginBottom: 40, textAlign: "center" }}>
          <div style={{ fontFamily: "Cinzel", fontSize: 60, fontWeight: "bold", color: "#222" }}>US TREASURY</div>
          <div style={{ fontFamily: "serif", fontSize: 30, color: "#555", fontStyle: "italic" }}>Bond Certificate</div>
        </div>

        {/* Body Text */}
        <div style={{ fontFamily: "serif", fontSize: 24, color: "#444", lineHeight: 2, textAlign: "justify" }}>
          This certifies that the United States of America is indebted to the bearer in the sum of one billion dollars, repayable in future tax revenues. This instrument is backed by the full faith and credit of the Federal Government.
        </div>

        {/* Seal */}
        <div style={{ marginTop: 100, alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Award size={150} color={THEME.colors.accents.gold} />
          <div style={{ fontFamily: "serif", marginTop: 10, color: THEME.colors.accents.gold }}>Official Seal</div>
        </div>

        {/* THE STAMP */}
        <div
          style={{
            position: "absolute",
            top: "40%", left: "50%",
            transform: `translate(-50%, -50%) scale(${stampScale}) rotate(-15deg)`,
            opacity: stampOpacity,
            border: `10px solid ${THEME.colors.accents.red}`,
            padding: "20px 80px",
            color: THEME.colors.accents.red,
            fontSize: 120,
            fontWeight: "900",
            fontFamily: "Courier New",
            textTransform: "uppercase",
            mixBlendMode: "multiply",
            zIndex: 10
          }}
        >
          ISSUED
        </div>
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
        <Title>National Debt</Title>
        <Label style={{ marginTop: 20 }}>Treasury Department</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
