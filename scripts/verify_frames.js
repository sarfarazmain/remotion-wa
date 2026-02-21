const { renderMedia } = require("@remotion/renderer");
const { getCompositions } = require("@remotion/renderer");

const bundleLocation = require("path").resolve("./src/index.ts");
const outputLocation1 = "public/verify_281.jpeg";
const outputLocation2 = "public/verify_493.jpeg";
const outputLocation3 = "public/verify_775.jpeg";

async function main() {
    const compositions = await getCompositions("http://localhost:3001");
    // We want WealthArchiveVideo
    const comp = compositions.find((c) => c.id === "WealthArchiveVideo");

    if (!comp) {
        console.error("WealthArchiveVideo not found!");
        return;
    }

    console.log("Extracting frame 281 for scene2 validation...");
    await renderMedia({
        serveUrl: "http://localhost:3001",
        composition: comp,
        outputLocation: outputLocation1,
        frame: 281,
        imageFormat: "jpeg",
        codec: "h264",
    });

    console.log("Extracting frame 493 for scene3 validation...");
    await renderMedia({
        serveUrl: "http://localhost:3001",
        composition: comp,
        outputLocation: outputLocation2,
        frame: 493,
        imageFormat: "jpeg",
        codec: "h264",
    });

    console.log("Extracting frame 775 for scene5 validation...");
    await renderMedia({
        serveUrl: "http://localhost:3001",
        composition: comp,
        outputLocation: outputLocation3,
        frame: 775,
        imageFormat: "jpeg",
        codec: "h264",
    });

    console.log("Frames successfully extracted! Check public/verify_X.jpeg");
}

main().catch(console.error);
