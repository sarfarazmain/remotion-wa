import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { THEME } from "../constants";
import { Title, Label } from "../Typography";
import { RefreshCw } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

const Token = ({ color, angle, label }: any) => {
  const x = Math.cos(angle) * 300;
  const y = Math.sin(angle) * 100; // Elliptical orbit specific for vertical view perspective
  const scale = interpolate(Math.sin(angle), [-1, 1], [0.8, 1.2]);
  const zIndex = Math.sin(angle) > 0 ? 10 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
        width: 250, height: 250,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${color}, #000)`,
        boxShadow: `0 0 40px ${color}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex,
        border: `4px solid ${color}`
      }}
    >
      <div style={{ color: "white", fontSize: 40, fontWeight: "bold", fontFamily: "Cinzel" }}>{label}</div>
    </div>
  );
}

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();

  const angle = frame * 0.05;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      <VideoBackground src={assets.scene7} opacity={0.2} />

      {/* Orbiting Tokens */}
      <AbsoluteFill>
        <Token color={THEME.colors.accents.gold} angle={angle} label="BOND" />
        <Token color={THEME.colors.accents.teal} angle={angle + Math.PI} label="CASH" />

        {/* Center Icon */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: `translate(-50%, -50%) rotate(${frame * 2}deg)`,
          opacity: 0.3
        }}>
          <RefreshCw size={400} color="white" strokeWidth={1} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 200 }}>
        <Label glowing>Liquidity Injection</Label>
        <Title>Collateral Swap</Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
