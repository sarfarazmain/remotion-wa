import { AbsoluteFill, useCurrentFrame } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { Database, Binary } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  // Rotating Digital Cube
  const rotationX = frame * 0.5;
  const rotationY = frame * 1;

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: 400,
    height: 400,
    border: `4px solid ${THEME.colors.accents.teal}`,
    backgroundColor: "rgba(46, 134, 171, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40,
    color: THEME.colors.accents.teal,
    boxShadow: `inset 0 0 40px ${THEME.colors.accents.teal}44`,
    backfaceVisibility: "visible"
  };

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background, perspective: 1200 }}>
      <VideoBackground src={assets.scene4} opacity={0.3} />

      {/* Core Icon inside */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ animation: "pulse 2s infinite" }}>
          <Database size={200} color={THEME.colors.accents.teal} opacity={0.8} />
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 400,
          height: 400,
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`
        }}
      >
        {/* Front */}
        <div style={{ ...faceStyle, transform: "translateZ(200px)" }}><Binary size={60} /></div>
        {/* Back */}
        <div style={{ ...faceStyle, transform: "rotateY(180deg) translateZ(200px)" }}><Binary size={60} /></div>
        {/* Right */}
        <div style={{ ...faceStyle, transform: "rotateY(90deg) translateZ(200px)" }}>1010</div>
        {/* Left */}
        <div style={{ ...faceStyle, transform: "rotateY(-90deg) translateZ(200px)" }}>0101</div>
        {/* Top */}
        <div style={{ ...faceStyle, transform: "rotateX(90deg) translateZ(200px)" }}>CODE</div>
        {/* Bottom */}
        <div style={{ ...faceStyle, transform: "rotateX(-90deg) translateZ(200px)" }}>DATA</div>
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 200 }}>
        <Label glowing>Treasury Collateral</Label>
        <Title>Digital Equivalent</Title>
        <Subtitle>Billion Dollar Brick</Subtitle>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
