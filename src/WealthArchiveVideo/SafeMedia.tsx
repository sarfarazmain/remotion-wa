import React, { useState, useEffect } from "react";
import { NoisePlaceholder } from "./NoisePlaceholder";

import { staticFile, OffthreadVideo } from "remotion";

interface Props {
    src?: string;
    style?: React.CSSProperties;
    className?: string;
    objectFit?: "cover" | "contain" | "fill";
    placeholderOpacity?: number;
    videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
}

export const SafeMedia: React.FC<Props> = ({
    src,
    style,
    className,
    objectFit = "cover",
    placeholderOpacity = 0.2,
    // videoProps not used with OffthreadVideo — kept in interface for compat
}) => {
    const [hasError, setHasError] = useState(false);

    // Reset error if src changes (important for development/updates)
    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return <NoisePlaceholder opacity={placeholderOpacity} />;
    }

    const isVideo = src.endsWith(".mp4") || src.endsWith(".webm");
    const commonStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit,
        ...style,
    };

    // If the src starts with / or doesn't start with http, it's a local public asset
    // Strip leading slash before calling staticFile (Remotion serves public/ at root)
    const isLocal =
        src.startsWith("/") ||
        (!src.startsWith("http://") &&
            !src.startsWith("https://") &&
            !src.startsWith("blob:"));
    const finalSrc = isLocal ? staticFile(src.replace(/^\//, "")) : src;

    if (isVideo) {
        // OffthreadVideo renders each frame as a still via ffmpeg — no delayRender stall.
        // Note: OffthreadVideo does NOT support loop prop; it loops by wrapping time to video duration.
        return (
            <OffthreadVideo
                src={finalSrc}
                style={commonStyle}
                className={className}
                muted
                onError={() => {
                    console.warn(`SafeMedia: Failed to load video ${finalSrc}`);
                    setHasError(true);
                }}
            />
        );
    }

    // Plain <img> — no delayRender needed. Remotion's OffthreadVideo-based renderer
    // extracts frames via ffmpeg so images are loaded by the headless browser naturally.
    // If an image fails, show the NoisePlaceholder fallback instead of crashing the render.
    return (
        <img
            src={finalSrc}
            style={commonStyle}
            className={className}
            onError={() => {
                console.warn(`SafeMedia: Failed to load image ${finalSrc}`);
                setHasError(true);
            }}
        />
    );
};
