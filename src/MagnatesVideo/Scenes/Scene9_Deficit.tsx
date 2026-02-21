import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene9: React.FC = () => {
  const frame = useCurrentFrame();

  // Counter ticking up
  const base = 33000000000000;
  const increment = interpolate(frame, [0, 150], [0, 5000000000000]); // Faster increment
  const current = base + increment;

  const formatted = current.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      <VideoBackground src={assets.scene9} opacity={0.3} />

      {/* Background Graph - subtle */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", opacity: 0.1 }}>
        <TrendingUp size={1000} color={THEME.colors.accents.red} style={{ transform: "translateX(-200px)" }} />
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>

        <div style={{ marginBottom: 50, animation: "bounce 1s infinite" }}>
          <AlertTriangle size={80} color={THEME.colors.accents.red} />
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 110, // Massive
            fontWeight: "bold",
            color: THEME.colors.accents.red,
            marginBottom: 40,
            textShadow: `0 0 40px ${THEME.colors.accents.red}`,
            textAlign: "center",
            lineHeight: 1.1,
            width: "90%" // Wrap if needed
          }}
        >
          ${formatted}
        </div>

        <Label glowing style={{ borderColor: THEME.colors.accents.red, color: THEME.colors.accents.red }}>
          Funding Required
        </Label>
        <Title style={{ marginTop: 40 }}>US Deficit</Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
