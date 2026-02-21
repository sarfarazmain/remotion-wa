import { AbsoluteFill, Audio, staticFile } from "remotion";
import { GlobalEffects } from "./GlobalEffects";
import { THEME } from "./constants";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";

// Import scenes
import { Scene1 } from "./Scenes/Scene1_MoneyPrinter";
import { Scene2 } from "./Scenes/Scene2_Plumbing";
import { Scene3 } from "./Scenes/Scene3_Context";
import { Scene4 } from "./Scenes/Scene4_DigitalBrick";
import { Scene5 } from "./Scenes/Scene5_Debt";
import { Scene6 } from "./Scenes/Scene6_Repo";
import { Scene7 } from "./Scenes/Scene7_LiquiditySwap";
import { Scene8 } from "./Scenes/Scene8_Clog";
import { Scene9 } from "./Scenes/Scene9_Deficit";
import { Scene10 } from "./Scenes/Scene10_QT";
import { Scene11 } from "./Scenes/Scene11_LiquidityForce";
import { Scene12 } from "./Scenes/Scene12_ShadowPrinter";

export const MagnatesVideo: React.FC = () => {

    // Transition config
    const TRANSITION_DURATION = 15; // 0.5s at 30fps
    const SCENE_DURATION = 150; // 5s total per scene (including transition time)

    // We need to subtract transition duration from the scene duration in the Sequence 
    // BUT TransitionSeries handles this by overlapping.
    // We want 5s visible content approx.
    // Let's give each scene 150 frames.

    const Presentation = slide({ direction: "from-bottom" });

    return (
        <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
            {/* Audio Track */}
            <Audio src={staticFile("audio.mp3")} />

            <TransitionSeries>
                {[Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10, Scene11, Scene12].map((Scene, i) => (
                    <>
                        <TransitionSeries.Sequence durationInFrames={150}>
                            <Scene />
                        </TransitionSeries.Sequence>
                        {i < 11 && (
                            <TransitionSeries.Transition
                                presentation={Presentation}
                                timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
                            />
                        )}
                    </>
                ))}
            </TransitionSeries>

            {/* Global Overlays */}
            <GlobalEffects />
        </AbsoluteFill>
    );
};
