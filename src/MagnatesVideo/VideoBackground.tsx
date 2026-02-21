import { AbsoluteFill, Video } from "remotion";
import { THEME } from "./constants";

interface VideoBackgroundProps {
    src: string | null;
    opacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ src, opacity = 0.3 }) => {
    if (!src) return null;

    return (
        <AbsoluteFill>
            <Video
                src={src}
                style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    opacity: opacity,
                    filter: "contrast(1.2) saturation(0.8) brightness(0.7)" // Cinematic look
                }}
                muted
                loop
            />
            {/* Gradient Overlay to ensure text readability */}
            <AbsoluteFill
                style={{
                    background: `linear-gradient(to bottom, ${THEME.colors.background} 0%, transparent 20%, transparent 80%, ${THEME.colors.background} 100%)`,
                    opacity: 0.8
                }}
            />
            <AbsoluteFill
                style={{
                    backgroundColor: THEME.colors.background,
                    opacity: 0.2, // Base tint
                    mixBlendMode: "multiply"
                }}
            />
        </AbsoluteFill>
    );
};
