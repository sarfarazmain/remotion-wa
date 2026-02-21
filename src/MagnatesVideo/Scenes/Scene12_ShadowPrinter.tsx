import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";
import { THEME } from "../constants";
import { Title, Label } from "../Typography";
import { Zap } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene12: React.FC = () => {
  const frame = useCurrentFrame();

  // Warp Speed Effect (Radial Starfield/Pipes)
  const particles = new Array(40).fill(0).map((_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const delay = random(i) * 20;
    const progress = (frame + delay) % 40 / 40; // Loop 0 to 1

    const r = interpolate(progress, [0, 1], [0, 800]); // Radius expands
    const opacity = interpolate(progress, [0, 0.8, 1], [0, 1, 0]);
    const length = interpolate(progress, [0, 1], [10, 200]);

    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: "50%", top: "50%",
          width: length, height: 4,
          backgroundColor: THEME.colors.accents.gold,
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle * (180 / Math.PI)}deg)`,
          opacity,
          boxShadow: `0 0 10px ${THEME.colors.accents.gold}`
        }}
      />
    );
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <VideoBackground src={assets.scene12} opacity={0.4} />

      <AbsoluteFill>
        {particles}
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>

        <div style={{
          marginBottom: 50,
          filter: `drop-shadow(0 0 20px ${THEME.colors.accents.gold})`,
          transform: `scale(${1 + Math.sin(frame * 0.5) * 0.1})`
        }}>
          <Zap size={300} fill={THEME.colors.accents.gold} stroke="none" />
        </div>

        <Title style={{
          fontSize: 120,
          color: "transparent",
          backgroundClip: "text",
          backgroundImage: `linear-gradient(to right, ${THEME.colors.accents.gold}, white, ${THEME.colors.accents.gold})`,
          backgroundSize: "200% auto",
          backgroundPosition: `${frame * 5}% center`
        }}>
          The Shadow Printer
        </Title>

        <Label glowing style={{ marginTop: 40, borderColor: THEME.colors.accents.gold, color: THEME.colors.accents.gold }}>
          Hidden Mechanism
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
