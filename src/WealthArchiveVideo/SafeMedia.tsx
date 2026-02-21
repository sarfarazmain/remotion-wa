import React, { useState, useEffect } from "react";
import { NoisePlaceholder } from "./NoisePlaceholder";

import { staticFile, Video, Img } from "remotion";

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
    videoProps
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

    // If the src starts with /, it's a local public asset, wrap in staticFile
    const finalSrc = src.startsWith("/") ? staticFile(src) : src;

    if (isVideo) {
        return (
            <Video
                src={finalSrc}
                style={commonStyle}
                className={className}
                autoPlay
                loop
                muted
                onError={(e) => {
                    console.warn(`SafeMedia: Failed to load video ${finalSrc}`, e);
                    setHasError(true);
                }}
                {...(videoProps as any)}
            />
        );
    }

    return (
        <Img
            src={finalSrc}
            style={commonStyle}
            className={className}
            onError={(e) => {
                console.warn(`SafeMedia: Failed to load image ${finalSrc}`, e);
                setHasError(true);
            }}
        />
    );
};
