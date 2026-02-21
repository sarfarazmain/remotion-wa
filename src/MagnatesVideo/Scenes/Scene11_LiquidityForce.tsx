import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";
import { THEME } from "../constants";
import { Title, Subtitle, Label } from "../Typography";
import { Droplet } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene11: React.FC = () => {
  const frame = useCurrentFrame();

  const fillHeight = interpolate(frame, [0, 150], [10, 90]);

  // Bubbles
  const bubbles = new Array(10).fill(0).map((_, i) => {
    const delay = i * 10;
    const y = interpolate((frame - delay) % 100, [0, 100], [100, 0]);
    const x = random(i) * 100;
    const opacity = interpolate((frame - delay) % 100, [0, 80, 100], [0, 1, 0]);

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          bottom: `${y}%`,
          left: `${x}%`,
          width: 20 + random(i + 1) * 20,
          height: 20 + random(i + 1) * 20,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.4)",
          opacity: opacity * 0.5
        }}
      />
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      <VideoBackground src={assets.scene11} opacity={0.3} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Glass Tank */}
        <div
          style={{
            width: 500, height: 800,
            border: "6px solid rgba(255,255,255,0.2)",
            borderTop: "none",
            borderRadius: "0 0 40px 40px",
            position: "relative",
            overflow: "hidden",
            marginBottom: 50,
            boxShadow: "0 0 40px rgba(0,0,0,0.3)"
          }}
        >
          {/* Liquid */}
          <div
            style={{
              position: "absolute",
              bottom: 0, left: 0,
              width: "100%",
              height: `${fillHeight}%`,
              backgroundColor: THEME.colors.accents.teal,
              opacity: 0.9,
              boxShadow: `0 0 80px ${THEME.colors.accents.teal}`,
              transition: "height 0.1s linear"
            }}
          >
            {bubbles}
          </div>

          {/* Surface */}
          <div
            style={{
              position: "absolute",
              bottom: `${fillHeight}%`,
              left: 0,
              width: "100%",
              height: 4,
              backgroundColor: "white",
              boxShadow: "0 0 20px white"
            }}
          />

          {/* Icon Overlay */}
          <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", opacity: 0.3 }}>
            <Droplet size={100} color="white" />
          </div>
        </div>

        <Label glowing>Invisible Force</Label>
        <Title>Purchasing Power</Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
