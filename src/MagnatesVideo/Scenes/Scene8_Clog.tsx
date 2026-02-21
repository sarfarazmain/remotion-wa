import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";
import { THEME } from "../constants";
import { Title, Label } from "../Typography";
import { AlertCircle } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();

  // Needle Animation
  // It goes up to max then vibrating
  const progress = Math.min(1, frame / 60);
  const startAngle = -90;
  const endAngle = 60; // Red zone
  const vibration = progress >= 1 ? random(frame) * 10 : 0;
  const currentAngle = interpolate(progress, [0, 1], [startAngle, endAngle]) + vibration;

  // Red Alert Strobe
  const strobe = progress >= 1 && frame % 10 < 5 ? 0.3 : 0;

  // Glass Crack opacity
  const crackOpacity = progress >= 1 ? 1 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      <VideoBackground src={assets.scene8} opacity={0.3} />
      <AbsoluteFill style={{ backgroundColor: THEME.colors.accents.red, opacity: strobe }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>

        {/* Gauge Body */}
        <div style={{
          position: "relative",
          width: 600, height: 600,
          borderRadius: "50%",
          border: "20px solid #333",
          background: "radial-gradient(#222, #000)",
          boxShadow: "0 10px 50px rgba(0,0,0,0.8)"
        }}>
          {/* Ticks */}
          {new Array(10).fill(0).map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: "50%", top: 0,
              height: "100%", width: 4,
              transform: `translateX(-50%) rotate(${i * 20 - 90}deg)`,
              background: `linear-gradient(to bottom, ${i > 7 ? "red" : "#666"} 40px, transparent 40px)`
            }} />
          ))}

          {/* Label */}
          <div style={{ position: "absolute", bottom: 150, width: "100%", textAlign: "center", color: "#666", fontFamily: "monospace", fontSize: 40 }}>PRESSURE</div>

          {/* Needle */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 280, height: 10,
            backgroundColor: "white",
            borderRadius: "50% 0 0 50%", // Pivot center
            transformOrigin: "left center",
            transform: `rotate(${currentAngle - 90}deg)`,
          }} />

          {/* Center Cap */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 40, height: 40, borderRadius: "50%",
            backgroundColor: "#555", transform: "translate(-50%, -50%)"
          }} />

          {/* Cracked Glass Overlay (SVG) */}
          <svg
            width="600" height="600"
            style={{ position: "absolute", top: 0, left: 0, opacity: crackOpacity, mixBlendMode: "overlay" }}
          >
            <path d="M 300 300 L 100 100 M 300 300 L 500 150 M 300 300 L 350 550" stroke="white" strokeWidth="2" />
            <path d="M 100 100 L 50 150" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div style={{ marginTop: 100, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AlertCircle size={80} color={THEME.colors.accents.red} style={{ opacity: crackOpacity }} />
          <Title style={{ color: crackOpacity ? THEME.colors.accents.red : "white" }}>Economic Seizure</Title>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
