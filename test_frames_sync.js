const { renderMedia, selectComposition } = require("@remotion/renderer");
const path = require("path");

async function renderFrame(frame, outputPath) {
  const serveUrl = "http://localhost:3000";
  const composition = await selectComposition({
    serveUrl,
    id: "DocumentaryShort",
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    imageFormat: "jpeg",
    frame: frame,
  });
  console.log(`Rendered frame ${frame} to ${outputPath}`);
}

async function run() {
  await renderFrame(75, "/Users/sarfaraz/.gemini/antigravity/brain/eab2f522-3335-4a79-aa23-3321313018f7/sync_s1_75.jpeg");
  await renderFrame(585, "/Users/sarfaraz/.gemini/antigravity/brain/eab2f522-3335-4a79-aa23-3321313018f7/sync_s4_585.jpeg");
  await renderFrame(1350, "/Users/sarfaraz/.gemini/antigravity/brain/eab2f522-3335-4a79-aa23-3321313018f7/sync_s10_1350.jpeg");
  await renderFrame(1580, "/Users/sarfaraz/.gemini/antigravity/brain/eab2f522-3335-4a79-aa23-3321313018f7/sync_ghost_1580.jpeg");
}

run().catch(console.error);
