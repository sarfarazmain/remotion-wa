import { AbsoluteFill, useCurrentFrame } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { Gauge } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene10: React.FC = () => {
  const frame = useCurrentFrame();

  // Dial turning down
  const rotation = -45 - (frame * 0.8);

  // Tick marks for dial
  const ticks = new Array(12).fill(0).map((_, i) => {
    const angle = i * 30;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          height: 480, // Radius +
          width: 4,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          background: `linear-gradient(to top, ${i > 8 ? THEME.colors.accents.red : "#555"} 20px, transparent 20px)`
        }}
      />
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      <VideoBackground src={assets.scene10} opacity={0.3} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Dial Container */}
        <div
          style={{
            position: "relative",
            width: 500, height: 500,
            marginBottom: 100
          }}
        >
          {ticks}

          {/* Knob */}
          <div
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              width: 350, height: 350,
              borderRadius: "50%",
              backgroundColor: "#1a1a1a",
              border: "4px solid #333",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start"
            }}
          >
            <div style={{ width: 40, height: 10, backgroundColor: THEME.colors.accents.red, marginLeft: 20, borderRadius: 20, boxShadow: `0 0 10px ${THEME.colors.accents.red}` }} />
          </div>

          {/* Center Icon */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <Gauge size={60} color="#444" />
          </div>
        </div>

        <Label glowing style={{ borderColor: THEME.colors.accents.red, color: THEME.colors.accents.red }}>Liquidity Drain</Label>
        <Title>Quantitative Tightening</Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
