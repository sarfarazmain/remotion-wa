import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { DocScene } from "./DocScene";
import { PALETTE } from "./Visuals/HUD";
import {
    KineticText,
    BigNumber,
    StatBox,
    Strikethrough,
    StatRow,
    TwoColChoice,
} from "./Visuals/KineticText";
import {
    LabeledLineChart,
    LabeledBarChart,
    AnimatedCounter,
    AnimatedGauge,
    StackedAreaChart,
} from "./Visuals/Charts";
import { FlowDiagram } from "./Visuals/Schematics";

const { CY, RD, GD, GN, WH } = PALETTE;
const AUDIO_SRC = staticFile("audio.mp3");
import assets from "./assets.json";

/*
 * NARRATOR SYNC — 30fps. Each seq = raw + 18f (transition offset).
 *
 * CANVAS: 1080 × 1920 portrait
 * SAFE ZONE: top=140px (eyebrow+topbar), bottom=120px (lower third+ticker)
 * CONTENT HEIGHT: 1920 − 140 − 120 = 1660px
 *
 * SENIOR EDITOR LAYOUT FORMULA per scene:
 *   headline zone ≈ 30% = ~500px  (large text, flexShrink: 0)
 *   60px spacer
 *   data zone     ≈ 70% = ~1100px (chart / stats fill this)
 *   chart height  = 1660 − headlineZone − 60
 */

const CHART_W = 960; // full bleed: 1080 − 2×60px gutters
const TRANS = {
    timing: springTiming({ config: { damping: 200 }, durationInFrames: 18 }),
};

/* Reusable style for scene root: full height column */
const col = (extra?: React.CSSProperties): React.CSSProperties => ({
    display: "flex", flexDirection: "column", height: "100%", width: "100%", ...extra,
});

/* Fixed-height spacer between headline zone and data zone */
const Spacer = ({ h = 60 }: { h?: number }) => (
    <div style={{ height: h, flexShrink: 0 }} />
);

export const DocumentaryVideo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: "#04070e" }}>
            <Audio src={AUDIO_SRC} />

            <TransitionSeries>

                {/* ═══ S1 · 0:00–0:06 · 198f ═══════════════════════════════
                    "Central banks are not printing money anymore.
                     The government is."
                    
                    Layout: BigNumber hero → headline text → 2 large stat rows
                    No chart — the text IS the message.
                    Headline zone: BigNumber(240) + text(360) + gap(40) = 640px
                    Data zone: 1660 − 640 = 1020px → 2 full-bleed stat rows
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={198}>
                    <DocScene
                        sceneLabel="01 / 12" actLabel="ACT I — THE SHIFT"
                        eyebrow="MONETARY SHIFT" cornerColor={RD}
                        ltTitle="US Federal Reserve — Policy Brief"
                        ltSource="Source: Federal Reserve, US Treasury (2024)"
                        totalFrames={198}
                        src={assets.scene1}
                        bgType="image"
                        blur={4}
                    >
                        <div style={col()}>
                            {/* HEADLINE ZONE */}
                            <div style={{ flexShrink: 0 }}>
                                <BigNumber value="$34.7T" label="Total US National Debt" color={RD} />
                                <div style={{ height: 40 }} />
                                <div style={{ position: "relative" }}>
                                    <KineticText
                                        words={[
                                            { text: "CENTRAL BANKS:", emphasis: false },
                                            { text: "NOT", emphasis: true },
                                            { text: "PRINTING.", emphasis: false },
                                        ]}
                                        startDelay={10} fontSize={88}
                                        baseColor="rgba(238,244,255,0.50)" accentColor={RD}
                                    />
                                    <Strikethrough width={CHART_W} startFrame={52} color={RD} />
                                </div>
                                <div style={{ height: 16 }} />
                                <KineticText
                                    words={[
                                        { text: "THE", emphasis: false },
                                        { text: "GOVERNMENT", emphasis: true },
                                        { text: "IS.", emphasis: false },
                                    ]}
                                    startDelay={70} fontSize={124}
                                    baseColor="rgba(238,244,255,0.45)" accentColor={RD}
                                />
                            </div>
                            <Spacer h={80} />
                            {/* DATA ZONE — 2 full-width stat rows filling 1020px */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                                <StatRow icon="📉" name="Annual US Deficit" value="$1.7T" color={GD} delay={95} positive={false} />
                                <StatRow icon="🖨" name="Printed 2020–2022" value="$6.4T" color={RD} delay={115} positive={false} />
                                <StatRow icon="🏛" name="National Debt" value="$34.7T" color={CY} delay={135} positive={false} />
                            </div>
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S2 · 0:06–0:11 · 168f ═══════════════════════════════
                    "The Fed isn't leading the market, it is chasing."
                    
                    Headline zone: 1 headline at 130px (1 line = 165px, 2 lines = 330px) ≈ 330px
                    60px spacer
                    Chart: 1660 − 330 − 60 = 1270px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={168}>
                    <DocScene
                        sceneLabel="02 / 12" actLabel="ACT I — THE SHIFT"
                        eyebrow="POLICY LAG" cornerColor={RD}
                        ltTitle="Fed Rate vs Market Rate — 2022 Cycle"
                        ltSource="Source: Federal Reserve Economic Data (FRED)"
                        totalFrames={168}
                        src={assets.scene2}
                        bgType="image"
                        blur={6}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "NOT", emphasis: false },
                                        { text: "LEADING.", emphasis: true },
                                        { text: "CHASING.", emphasis: true },
                                    ]}
                                    startDelay={6} fontSize={130}
                                    accentColor={RD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            <LabeledLineChart
                                title="Fed Rate vs Market Expectations (%)"
                                yUnit="" startFrame={18}
                                data={[
                                    { label: "Jan", value: 0.25 },
                                    { label: "Mar", value: 1.00 },
                                    { label: "Jun", value: 3.00 },
                                    { label: "Sep", value: 4.25 },
                                    { label: "Dec", value: 5.25 },
                                ]}
                                lineLabel="THE FED" color={CY}
                                secondLine={{
                                    label: "MARKET", color: RD,
                                    data: [
                                        { label: "Jan", value: 1.50 },
                                        { label: "Mar", value: 2.80 },
                                        { label: "Jun", value: 4.20 },
                                        { label: "Sep", value: 5.10 },
                                        { label: "Dec", value: 5.50 },
                                    ],
                                }}
                                width={CHART_W} height={1270}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S3 · 0:11–0:17 · 198f ═══════════════════════════════
                    "For a decade, we believed low rates were the only engine."
                    
                    Headline zone: headline(330) + gap(30) + counter(220) = 580px
                    60px spacer
                    Chart: 1660 − 580 − 60 = 1020px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={198}>
                    <DocScene
                        sceneLabel="03 / 12" actLabel="ACT I — THE SHIFT"
                        eyebrow="ZERO INTEREST RATE POLICY" cornerColor={CY}
                        ltTitle="Fed Funds Rate — 2008 to 2022"
                        ltSource="Source: Federal Reserve"
                        totalFrames={198}
                        src={assets.scene3}
                        bgType="image"
                        blur={5}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "14 YEARS.", emphasis: false },
                                        { text: "ONE", emphasis: false },
                                        { text: "ENGINE.", emphasis: true },
                                    ]}
                                    startDelay={10} fontSize={124}
                                    accentColor={CY} baseColor="rgba(238,244,255,0.60)"
                                />
                                <div style={{ height: 40 }} />
                                <AnimatedCounter
                                    from={0.0} to={0.08}
                                    prefix="" suffix="% avg rate"
                                    label="Federal Funds Rate — Avg 2008–2022"
                                    color={CY} startFrame={24}
                                />
                            </div>
                            <Spacer h={60} />
                            <LabeledLineChart
                                title="Federal Funds Rate (%)"
                                yUnit="" startFrame={40}
                                data={[
                                    { label: "2008", value: 4.25 },
                                    { label: "2009", value: 0.25 },
                                    { label: "2014", value: 0.12 },
                                    { label: "2018", value: 2.40 },
                                    { label: "2020", value: 0.08 },
                                    { label: "2022", value: 4.33 },
                                ]}
                                lineLabel="RATE" color={CY}
                                width={CHART_W} height={1020}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S4 · 0:17–0:22 · 168f ═══════════════════════════════
                    "Investors grew addicted to cheap debt."
                    
                    Headline zone: 330px
                    Chart: 1660 − 330 − 60 = 1270px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={168}>
                    <DocScene
                        sceneLabel="04 / 12" actLabel="ACT II — ADDICTION"
                        eyebrow="DEFICIT SPENDING" cornerColor={RD}
                        nebulaColor="rgba(90,6,10,0.38)"
                        ltTitle="US Federal Deficit by Year"
                        ltSource="Source: Congressional Budget Office (CBO)"
                        totalFrames={168}
                        src={assets.scene4}
                        bgType="image"
                        blur={3}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "ADDICTED", emphasis: true },
                                        { text: "TO", emphasis: false },
                                        { text: "CHEAP DEBT.", emphasis: true },
                                    ]}
                                    startDelay={6} fontSize={124}
                                    accentColor={RD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            <LabeledBarChart
                                title="Annual US Deficit ($B)"
                                yUnit="$" color={RD} highlightLast
                                data={[
                                    { label: "2019", value: 984 },
                                    { label: "2020", value: 3132 },
                                    { label: "2021", value: 2776 },
                                    { label: "2022", value: 1375 },
                                    { label: "2023", value: 1695, sublabel: "↑ Growing" },
                                ]}
                                width={CHART_W} height={1270}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S5 · 0:22–0:28 · 198f ═══════════════════════════════
                    "The engine changed. Fiscal dominance arrived."
                    
                    Headline zone: 330px
                    Chart: 1270px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={198}>
                    <DocScene
                        sceneLabel="05 / 12" actLabel="ACT II — ADDICTION"
                        eyebrow="THE CROSSOVER" cornerColor={GD}
                        nebulaColor="rgba(90,6,10,0.28)"
                        ltTitle="Monetary Policy vs Fiscal Spending"
                        ltSource="Source: IMF Fiscal Monitor, Federal Reserve Research"
                        totalFrames={198}
                        src={assets.scene5}
                        bgType="image"
                        blur={4}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "THE ENGINE", emphasis: false },
                                        { text: "CHANGED.", emphasis: true },
                                    ]}
                                    startDelay={6} fontSize={130}
                                    accentColor={GD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            <StackedAreaChart
                                title="Monetary vs Fiscal Dominance (% of stimulus influence)"
                                labelA="MONETARY" labelB="FISCAL"
                                colorA={CY} colorB={RD}
                                highlightCrossover
                                lineA={[
                                    { label: "2008", value: 90 },
                                    { label: "2012", value: 82 },
                                    { label: "2016", value: 74 },
                                    { label: "2019", value: 60 },
                                    { label: "2020", value: 42 },
                                    { label: "2022", value: 30 },
                                    { label: "2024", value: 22 },
                                ]}
                                lineB={[
                                    { label: "2008", value: 18 },
                                    { label: "2012", value: 28 },
                                    { label: "2016", value: 44 },
                                    { label: "2019", value: 56 },
                                    { label: "2020", value: 72 },
                                    { label: "2022", value: 82 },
                                    { label: "2024", value: 92 },
                                ]}
                                width={CHART_W} height={1270}
                                startFrame={18}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S6 · 0:28–0:34 · 198f ═══════════════════════════════
                    "Governments are bypassing banks to inject directly."
                    
                    Headline zone: headline(330) + sub(100) + gap(30) = 460px
                    60px spacer  
                    Flow: 1660 − 460 − 60 = 1140px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={198}>
                    <DocScene
                        sceneLabel="06 / 12" actLabel="ACT II — ADDICTION"
                        eyebrow="DISINTERMEDIATION" cornerColor={RD}
                        nebulaColor="rgba(90,6,10,0.38)"
                        ltTitle="Fiscal Transmission Mechanism"
                        ltSource="Source: BIS Working Papers, 2023"
                        totalFrames={198}
                        src={assets.scene6}
                        bgType="image"
                        blur={5}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "BYPASSING", emphasis: true },
                                        { text: "THE BANKS.", emphasis: false },
                                    ]}
                                    startDelay={6} fontSize={130}
                                    accentColor={RD} baseColor="rgba(238,244,255,0.55)"
                                />
                                <div style={{ height: 28 }} />
                                <KineticText
                                    words={[
                                        { text: "Capital injected", emphasis: false },
                                        { text: "directly.", emphasis: true },
                                    ]}
                                    startDelay={34} fontSize={56}
                                    accentColor={GD} baseColor="rgba(238,244,255,0.35)"
                                />
                            </div>
                            <Spacer h={60} />
                            <FlowDiagram
                                nodes={[
                                    { id: "gov", x: 480, y: 110, label: "TREASURY", sublabel: "Fiscal Authority", color: RD, delay: 10, icon: "🏛" },
                                    { id: "bank", x: 200, y: 430, label: "FED BANKS", sublabel: "Bypassed", color: "rgba(255,255,255,0.22)", delay: 28, disabled: true, icon: "🏦" },
                                    { id: "mkt", x: 480, y: 750, label: "ECONOMY", sublabel: "Direct Injection", color: GD, delay: 55, icon: "📈" },
                                ]}
                                edges={[
                                    { from: "gov", to: "bank", delay: 30, color: RD, strikethrough: true },
                                    { from: "gov", to: "mkt", delay: 58, color: GD, label: "DIRECT" },
                                ]}
                                width={CHART_W} height={1140}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S7 · 0:34–0:40 · 198f ═══════════════════════════════
                    "Inflation is a policy choice, not an accident."
                    
                    Headline zone: 330px
                    Two-col choice fills: 1660 − 330 − 60 = 1270px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={198}>
                    <DocScene
                        sceneLabel="07 / 12" actLabel="ACT III — THE BURN"
                        eyebrow="INFLATION MECHANICS" cornerColor={GD}
                        nebulaColor="rgba(72,34,0,0.35)"
                        ltTitle="Fiscal Theory of the Price Level"
                        ltSource="Source: Cochrane (2023), FTPL"
                        totalFrames={198}
                        src={assets.scene7}
                        bgType="image"
                        blur={4}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "INFLATION:", emphasis: false },
                                        { text: "CHOICE,", emphasis: true },
                                        { text: "NOT ACCIDENT.", emphasis: false },
                                    ]}
                                    startDelay={6} fontSize={110}
                                    accentColor={GD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            {/* TwoColChoice fills remaining height */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <TwoColChoice
                                    leftLabel="Accident"
                                    leftSub="Supply shocks · demand pull"
                                    leftIcon="💨"
                                    leftVerdictIcon="✕"
                                    leftVerdictColor={RD}
                                    rightLabel="Policy Tool"
                                    rightSub="Debt erosion via inflation"
                                    rightIcon="⚖️"
                                    rightVerdictIcon="✓"
                                    rightVerdictColor={GN}
                                />
                            </div>
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S8 · 0:40–0:45 · 168f ═══════════════════════════════
                    "Zombie companies are dying. Cheap debt is now a trap."
                    
                    Headline zone: 330px
                    Chart: 1270px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={168}>
                    <DocScene
                        sceneLabel="08 / 12" actLabel="ACT III — THE BURN"
                        eyebrow="ZOMBIE ECONOMY" cornerColor={RD}
                        nebulaColor="rgba(90,6,10,0.38)"
                        ltTitle="Share of Zombie Firms (Coverage < 1×)"
                        ltSource="Source: BIS Quarterly Review, 2023"
                        totalFrames={168}
                        src={assets.scene8}
                        bgType="image"
                        blur={3}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "CHEAP DEBT.", emphasis: true },
                                        { text: "NOW A TRAP.", emphasis: false },
                                    ]}
                                    startDelay={6} fontSize={124}
                                    accentColor={RD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            <LabeledBarChart
                                title="Zombie Firms — % of Listed Companies"
                                yUnit="" color={RD} meltFrameStart={88}
                                data={[
                                    { label: "2008", value: 6 },
                                    { label: "2012", value: 10 },
                                    { label: "2015", value: 12 },
                                    { label: "2019", value: 16, sublabel: "ZIRP Peak" },
                                    { label: "2022", value: 22, sublabel: "↑ Surge" },
                                ]}
                                width={CHART_W} height={1270}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S9 · 0:45–0:50 · 168f ═══════════════════════════════
                    "Real assets win when currency is devalued."
                    
                    Headline zone: big headline at 150px ≈ 200px
                    Stat rows: 1660 − 200 − 60 = 1400px → 5 rows × 280px each
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={168}>
                    <DocScene
                        sceneLabel="09 / 12" actLabel="ACT III — THE BURN"
                        eyebrow="ASSET PROTECTION" cornerColor={GD}
                        nebulaColor="rgba(72,34,0,0.35)"
                        ltTitle="Real Asset Returns During Fiscal Dominance"
                        ltSource="Source: Goldman Sachs Research, 2024"
                        totalFrames={168}
                        src={assets.scene9}
                        bgType="image"
                        blur={5}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "REAL ASSETS", emphasis: true },
                                        { text: "WIN.", emphasis: false },
                                    ]}
                                    startDelay={6} fontSize={150}
                                    accentColor={GD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            {/* 5 stat rows spread evenly across 1400px */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                                <StatRow icon="🪙" name="Gold" value="+42%" color={GD} delay={22} positive />
                                <StatRow icon="🏠" name="Real Estate" value="+38%" color={CY} delay={34} positive />
                                <StatRow icon="⛽" name="Commodities" value="+31%" color={GN} delay={46} positive />
                                <StatRow icon="₿" name="Bitcoin" value="+290%" color={GD} delay={58} positive />
                                <StatRow icon="💵" name="Cash (Real)" value="−24%" color={RD} delay={70} positive={false} />
                            </div>
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S10 · 0:50–0:55 · 168f ══════════════════════════════
                    "Wealth redistributed: saver → spender."
                    
                    Headline zone: 200px
                    Gauge (460px) + stat boxes: 1400px total
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={168}>
                    <DocScene
                        sceneLabel="10 / 12" actLabel="ACT III — THE BURN"
                        eyebrow="WEALTH TRANSFER" cornerColor={GD}
                        nebulaColor="rgba(72,34,0,0.35)"
                        ltTitle="Real Yield = Nominal Rate − CPI"
                        ltSource="Source: FRED, 2024"
                        totalFrames={168}
                        src={assets.scene10}
                        bgType="image"
                        blur={4}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "SAVER", emphasis: false },
                                        { text: "→", emphasis: false },
                                        { text: "SPENDER.", emphasis: true },
                                    ]}
                                    startDelay={6} fontSize={150}
                                    accentColor={RD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>
                                <AnimatedGauge
                                    value={85}
                                    label="Real Yield Pressure"
                                    dangerZone={60}
                                    size={480}
                                />
                                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                                    <StatBox label="Nominal Rate" value="5.25%" color={CY} delay={20} />
                                    <StatBox label="CPI Inflation" value="3.40%" color={GD} delay={34} />
                                    <StatBox label="Real Yield" value="−0.8%" color={RD} delay={48} />
                                    <StatBox label="Wealth Lost" value="−$12T" color={RD} delay={62} />
                                </div>
                            </div>
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S11 · 0:55–1:01 · 198f ══════════════════════════════
                    "The risk is no longer a crash. It is a slow burn."
                    
                    Headline zone: 2 lines at 120px = 2×300px + gap(24) = 624px
                    60px spacer
                    Chart: 1660 − 624 − 60 = 976px
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={198}>
                    <DocScene
                        sceneLabel="11 / 12" actLabel="ACT IV — THE ENDGAME"
                        eyebrow="SLOW LIQUIDATION" cornerColor={GD}
                        nebulaColor="rgba(72,34,0,0.35)"
                        ltTitle="Crash vs Burn — Historical Debt Outcomes"
                        ltSource="Source: Reinhart & Rogoff, This Time Is Different"
                        totalFrames={198}
                        src={assets.scene11}
                        bgType="image"
                        blur={6}
                    >
                        <div style={col()}>
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "NOT A CRASH.", emphasis: true },
                                    ]}
                                    startDelay={6} fontSize={130}
                                    accentColor={RD} baseColor="rgba(238,244,255,0.55)"
                                />
                                <div style={{ height: 24 }} />
                                <KineticText
                                    words={[
                                        { text: "A SLOW,", emphasis: true },
                                        { text: "HOT BURN.", emphasis: true },
                                    ]}
                                    startDelay={28} fontSize={130}
                                    accentColor={GD} baseColor="rgba(238,244,255,0.55)"
                                />
                            </div>
                            <Spacer h={60} />
                            <StackedAreaChart
                                title=""
                                labelA="CRASH (1929 style)"
                                labelB="BURN (fiscal repression)"
                                colorA={RD} colorB={GD}
                                lineA={[
                                    { label: "Yr 0", value: 100 },
                                    { label: "Yr 1", value: 40 },
                                    { label: "Yr 3", value: 20 },
                                    { label: "Yr 5", value: 55 },
                                    { label: "Yr 10", value: 80 },
                                ]}
                                lineB={[
                                    { label: "Yr 0", value: 100 },
                                    { label: "Yr 1", value: 96 },
                                    { label: "Yr 3", value: 88 },
                                    { label: "Yr 5", value: 76 },
                                    { label: "Yr 10", value: 52 },
                                ]}
                                width={CHART_W} height={976}
                                startFrame={32}
                            />
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition {...TRANS} presentation={fade()} />

                {/* ═══ S12 · 1:01–end · 300f (extended + 90f slow fade) ════
                    "The press didn't stop. It found a new operator."
                    
                    FlowDiagram: 700px (top half, portrait vertical)
                    Headline + sub: 1660 − 700 − 60 = 900px (bottom half)
                   ════════════════════════════════════════════════════════════ */}
                <TransitionSeries.Sequence durationInFrames={300}>
                    <DocScene
                        sceneLabel="12 / 12" actLabel="ACT IV — THE ENDGAME"
                        eyebrow="FISCAL DOMINANCE" cornerColor={WH}
                        nebulaColor="rgba(15,15,40,0.5)"
                        ltTitle="The Press Didn't Stop — It Found a New Operator"
                        ltSource="Fiscal Dominance — Series One · 2024"
                        totalFrames={300}
                        fadeOutFrames={90}
                        src={assets.scene12}
                        bgType="image"
                        blur={4}
                    >
                        <div style={col()}>
                            <FlowDiagram
                                nodes={[
                                    { id: "press", x: 480, y: 110, label: "PRINT PRESS", sublabel: "Fed · 2008–2020", color: CY, delay: 5, icon: "🖨" },
                                    { id: "fiscal", x: 480, y: 490, label: "GOVERNMENT", sublabel: "New Operator · 2020–", color: GD, delay: 35, icon: "🏛" },
                                ]}
                                edges={[
                                    { from: "press", to: "fiscal", delay: 48, color: GD, label: "CONTROL TRANSFERRED" },
                                ]}
                                width={CHART_W} height={700}
                            />
                            <Spacer h={60} />
                            <div style={{ flexShrink: 0 }}>
                                <KineticText
                                    words={[
                                        { text: "FISCAL", emphasis: true },
                                        { text: "DOMINANCE", emphasis: true },
                                        { text: "IS HERE.", emphasis: false },
                                    ]}
                                    startDelay={60} fontSize={118}
                                    accentColor={GD} baseColor="rgba(238,244,255,0.55)"
                                />
                                <div style={{ height: 32 }} />
                                <KineticText
                                    words={[
                                        { text: "The press didn't stop.", emphasis: false },
                                        { text: "New operator.", emphasis: true },
                                    ]}
                                    startDelay={90} fontSize={58}
                                    accentColor={CY} baseColor="rgba(238,244,255,0.35)"
                                />
                            </div>
                        </div>
                    </DocScene>
                </TransitionSeries.Sequence>

            </TransitionSeries>
        </AbsoluteFill>
    );
};
