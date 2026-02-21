import React from "react";
import { AbsoluteFill } from "remotion";
import { VideoTreatment, OpticalAnchorType } from "../VarianceTypes";
import { FullBleedArchival } from "./FullBleedArchival";
import { ClassifiedViewfinder } from "./ClassifiedViewfinder";
import { CinematicLetterbox } from "./CinematicLetterbox";
import { LumaWindow } from "./LumaWindow";
import { SplitReality } from "./SplitReality";
import { NoisePlaceholder } from "../NoisePlaceholder";
import { PersistentArchivalHUD } from "./PersistentArchivalHUD";

interface Props {
    treatment: VideoTreatment;
    opticalAnchor?: OpticalAnchorType;
    anchorWord?: string;
    src: string;
    text?: string;
    srcSecondary?: string; // For Split Reality
    hudPath?: string;
    hudTimestamp?: string;
    hudCitation?: string;
}

export const HeroVideo: React.FC<Props> = ({ treatment, opticalAnchor, anchorWord, src, text, srcSecondary, hudPath, hudTimestamp, hudCitation }) => {

    const renderTreatment = () => {
        switch (treatment) {
            case VideoTreatment.FULL_BLEED:
                if (!src) return <NoisePlaceholder baseColor="#111827" />;
                return <FullBleedArchival src={src} text={text} />;

            case VideoTreatment.CINEMATIC_LETTERBOX:
                if (!src) return <NoisePlaceholder baseColor="#111827" />;
                return <CinematicLetterbox src={src} label={text} opticalAnchor={opticalAnchor} anchorWord={anchorWord} />

            case VideoTreatment.LUMA_WINDOW:
                if (!src) return <NoisePlaceholder baseColor="#111827" />;
                return <LumaWindow src={src} opticalAnchor={opticalAnchor} anchorWord={anchorWord} />;

            case VideoTreatment.CLASSIFIED_VIEWFINDER:
                if (!src) return <NoisePlaceholder baseColor="#111827" />;
                return <ClassifiedViewfinder src={src} label={text} opticalAnchor={opticalAnchor} anchorWord={anchorWord} />;

            case VideoTreatment.SPLIT_REALITY:
                let topMedia = src;
                let bottomMedia = srcSecondary || src;
                if (!topMedia && !bottomMedia) return <NoisePlaceholder baseColor="#111827" />;
                return <SplitReality srcTop={topMedia} srcBottom={bottomMedia} label={text || "REALITY"} />;

            default:
                return <FullBleedArchival src={src} text={text} />;
        }
    };

    const needsHUD = [
        VideoTreatment.CINEMATIC_LETTERBOX,
        VideoTreatment.CLASSIFIED_VIEWFINDER,
        VideoTreatment.LUMA_WINDOW,
        VideoTreatment.SPLIT_REALITY
    ].includes(treatment);

    if (needsHUD) {
        return (
            <AbsoluteFill>
                <PersistentArchivalHUD hudPath={hudPath} hudTimestamp={hudTimestamp} hudCitation={hudCitation} />
                {renderTreatment()}
            </AbsoluteFill>
        );
    }

    return renderTreatment();
};
