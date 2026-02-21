import { AbsoluteFill, useCurrentFrame, random, interpolate } from "remotion";
import { THEME } from "../constants";
import { Title, Label } from "../Typography";
import { Activity } from "lucide-react";
import { VideoBackground } from "../VideoBackground";
import assets from "../assets.json";

const Candle = ({ x, height, open, close, type, delay }: any) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const color = type === "bull" ? THEME.colors.accents.teal : THEME.colors.accents.red;
  const h = Math.abs(open - close);

  const wickHigh = Math.max(open, close) + random(x) * 50;
  const wickLow = Math.min(open, close) - random(x + 1) * 50;

  return (
    <div style={{ position: "absolute", left: x, bottom: 500, opacity: appear, transform: `scaleY(${appear})` }}>
      {/* Wick */}
      <div style={{
        position: "absolute", left: 14, bottom: wickLow,
        width: 2, height: wickHigh - wickLow + h,
        backgroundColor: color, opacity: 0.7
      }} />
      {/* Body */}
      <div style={{
        position: "absolute", left: 0, bottom: Math.min(open, close),
        width: 30, height: Math.max(h, 2),
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}`
      }} />
    </div>
  );
};

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();

  // Generate Chart Data
  const candles = new Array(30).fill(0).map((_, i) => {
    const r = random(i * 99);
    const type = r > 0.5 ? "bull" : "bear";
    const height = 50 + r * 200;
    const open = random(i) * 500;
    const close = open + (type === "bull" ? height : -height);

    return { x: i * 60, open, close, type, delay: i * 2 };
  });

  // Camera Move
  const xMove = -frame * 10;
  const rotateX = 20;
  const rotateY = -10;

  return (
    <AbsoluteFill style={{ perspective: 1000, overflow: "hidden" }}>
      <VideoBackground src={assets.scene6} opacity={0.2} />

      {/* Grid Floor */}
      <div style={{
        position: "absolute", top: "50%", left: -500, width: "200%", height: 2000,
        transform: `rotateX(60deg) translateY(${frame * 5}px)`,
        background: `linear-gradient(transparent 95%, ${THEME.colors.text.secondary}22 95%), linear-gradient(90deg, transparent 95%, ${THEME.colors.text.secondary}22 95%)`,
        backgroundSize: "100px 100px",
      }} />

      {/* Chart Container */}
      <div style={{
        position: "absolute", top: 200, left: 100,
        transform: `translateX(${xMove}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d"
      }}>
        {candles.map((c, i) => (
          <Candle key={i} {...c} />
        ))}
      </div>

      <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "flex-start", padding: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <Activity size={60} color={THEME.colors.accents.teal} />
          <div style={{ fontFamily: "monospace", fontSize: 40, color: THEME.colors.accents.teal }}>
            VOL: {(2000 + random(frame) * 100).toFixed(0)}M
          </div>
        </div>
        <Title style={{ textAlign: "right" }}>Flash Crash</Title>
        <Label glowing style={{ alignSelf: "flex-end" }}>Shadow Banking</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
