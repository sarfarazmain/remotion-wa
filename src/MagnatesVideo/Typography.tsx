import React from "react";
import { primaryFont, bodyFont, THEME } from "./constants";

interface TextProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string; // For Tailwind if needed
}

export const Title: React.FC<TextProps> = ({ children, style }) => {
    return (
        <h1
            style={{
                fontFamily: primaryFont,
                color: THEME.colors.text.primary,
                fontSize: 100, // Larger for vertical
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: 0,
                textAlign: "center",
                fontWeight: 700,
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                ...style,
            }}
        >
            {children}
        </h1>
    );
};

export const Subtitle: React.FC<TextProps> = ({ children, style }) => {
    return (
        <h2
            style={{
                fontFamily: primaryFont,
                color: THEME.colors.text.primary, // Often confused with secondary, but kept bright for readability
                fontSize: 48,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                margin: 0,
                textAlign: "center",
                fontWeight: 300,
                opacity: 0.9,
                ...style,
            }}
        >
            {children}
        </h2>
    );
};

export const BodyText: React.FC<TextProps> = ({ children, style }) => {
    return (
        <p
            style={{
                fontFamily: bodyFont,
                color: THEME.colors.text.secondary,
                fontSize: 32,
                lineHeight: 1.5,
                margin: 0,
                textAlign: "center",
                ...style,
            }}
        >
            {children}
        </p>
    );
};

export const Label: React.FC<TextProps & { glowing?: boolean }> = ({ children, style, glowing }) => {
    return (
        <div
            style={{
                fontFamily: bodyFont,
                color: glowing ? THEME.colors.accents.teal : THEME.colors.text.primary,
                fontSize: 18,
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "8px 16px",
                backgroundColor: "rgba(0,0,0,0.6)",
                border: `1px solid ${glowing ? THEME.colors.accents.teal : "rgba(255,255,255,0.2)"}`,
                borderRadius: 4,
                boxShadow: glowing ? `0 0 10px ${THEME.colors.accents.teal}` : "none",
                display: "inline-block",
                ...style,
            }}
        >
            {children}
        </div>
    );
};
