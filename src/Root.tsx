import React from "react";
import { Composition } from "remotion";
import { MagnatesVideo } from "./MagnatesVideo";
import { DocumentaryVideo } from "./DocumentaryVideo";
import { WealthArchiveVideo } from "./WealthArchiveVideo";
import { WARP19_TOTAL } from "./WealthArchiveVideo/PacingEngine";
import "./index.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShadowPrinter"
        component={MagnatesVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DocumentaryShort"
        component={DocumentaryVideo}
        durationInFrames={2130}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="WealthArchive"
        component={WealthArchiveVideo}
        durationInFrames={WARP19_TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
