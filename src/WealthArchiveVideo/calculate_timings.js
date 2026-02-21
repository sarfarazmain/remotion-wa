// Script to calculate 30fps frames from timestamps
const timestamps = [
    { s: 0, text: "Central banks are not printing money anymore. The government is." }, // S1: 0 - 5
    { s: 5, text: "The Fed isn't leading the market, it is chasing a moving tiger." }, // S2: 5 - 10
    { s: 10, text: "For a decade, we believed low rates were the only engine of growth. Investors grew addicted to cheap debt and artificial stability." }, // S3: 10 - 18
    { s: 18, text: "But in the current cycle, the engine changed." }, // S4: 18 - 20 
    { s: 20, text: "Fiscal dominance arrived." }, // S5: 20 - 22
    { s: 22, text: "Governments are now bypassing banks to inject capital directly into the economy." }, // S6: 22 - 26
    { s: 26, text: "Inflation is a policy choice. Not an accident of the supply chain." }, // S7: 26 - 31
    { s: 31, text: "Zombie companies are dying because their two percent debt is now a trap." }, // S8: 31 - 36
    { s: 36, text: "Real assets win when the currency is devalued to fund deficits." }, // S9: 36 - 41
    { s: 41, text: "Wealth is being redistributed from the saver to the spender." }, // S10: 41 - 46
    { s: 46, text: "The risk is no longer a crash, it is a slow, hot, burn." }, // S11: 46 - 50
    { s: 50, text: "The printing press hasn't stopped, it just found a new operator." } // S12: 50 - 54
];

const fps = 30;
const scenes = [];

for(let i=0; i<timestamps.length; i++) {
    const startSec = timestamps[i].s;
    const endSec = timestamps[i+1] ? timestamps[i+1].s : 54; // Assume end at 54s based on GhostHost
    
    const startFrame = startSec * fps;
    const endFrame = endSec * fps;
    const dur = endFrame - startFrame;
    
    // Grid coords based on existing logic: 4 cols x 3 rows
    const col = i % 4;
    const row = Math.floor(i / 4);
    
    scenes.push({
        name: `S${i+1}`,
        start: startFrame,
        dur: dur,
        col: col,
        row: row
    });
}

console.log("const SCENES = [");
scenes.forEach(s => {
    console.log(`    { start: ${s.start}, dur: ${s.dur}, col: ${s.col}, row: ${s.row} },   // ${s.name}`);
});
console.log("] as const;");
