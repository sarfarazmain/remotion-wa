const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

/*
 * PRE-BAKE ASSETS SCRIPT
 * ──────────────────────
 * 1. Reads src/WealthArchiveVideo/assets.json
 * 2. Downloads all VIDEO assets to public/assets/raw/
 * 3. Processes them with FFmpeg to public/assets/processed/
 *    - Apply Blur (boxblur=6)
 *    - Apply Grayscale/Sepia tint (eq, colorbalance)
 * 4. Generates src/WealthArchiveVideo/assets.processed.json
 */

const ASSETS_FILE = path.join(__dirname, '../src/WealthArchiveVideo/assets.json');
const OUTPUT_JSON = path.join(__dirname, '../src/WealthArchiveVideo/assets.processed.json');
const RAW_DIR = path.join(__dirname, '../public/assets/raw');
const PROCESSED_DIR = path.join(__dirname, '../public/assets/processed');

// Ensure directories exist
[RAW_DIR, PROCESSED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Read assets
const assets = JSON.parse(fs.readFileSync(ASSETS_FILE, 'utf8'));

// Filter Command: Matches MediaTreatment.tsx "ATMOSPHERE_FILTER"
// "grayscale(100%) sepia(20%) contrast(110%) brightness(50%) blur(6px)"
// FFmpeg equivalent chain:
// 1. eq=saturation=0 (Grayscale)
// 2. colorbalance=rs=.2:gs=.15:bs=-.15 (Sepia approx - warming red/green, cooling blue)
// 3. eq=contrast=1.1:brightness=-0.4 (Contrast/Brightness)
// 4. boxblur=6:1 (Blur)
const FFMPEG_FILTER = "eq=saturation=0,colorbalance=rs=.2:gs=.15:bs=-.15,eq=contrast=1.1:brightness=-0.4,boxblur=6:1";

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`  - Cached: ${path.basename(dest)}`);
            resolve();
            return;
        }
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function processAssets() {
    const processedAssets = { ...assets };
    const keys = Object.keys(assets);

    console.log(`Found ${keys.length} asset keys. Starting processing...`);

    for (const key of keys) {
        if (key.endsWith('_video')) {
            const url = assets[key];
            const filename = `scene${key.split('_')[0].replace('scene', '')}_atmosphere.mp4`; // e.g. scene1_atmosphere.mp4
            const rawPath = path.join(RAW_DIR, filename);
            const processedPath = path.join(PROCESSED_DIR, filename);

            // 1. Download
            console.log(`[${key}] Downloading...`);
            try {
                await downloadFile(url, rawPath);
            } catch (e) {
                console.error(`Failed to download ${key}:`, e);
                continue;
            }

            // 2. Process with FFmpeg
            console.log(`[${key}] Pre-baking filters...`);
            if (fs.existsSync(processedPath)) {
                console.log(`  - Processed file exists. Skipping.`);
            } else {
                try {
                    // -an: Remove audio
                    // -movflags +faststart: Move metadata to start for web playback (Critical for Code 4 fixes)
                    // -vf: Video filters
                    const cmd = `ffmpeg -y -i "${rawPath}" -vf "${FFMPEG_FILTER}" -an -c:v libx264 -crf 23 -pix_fmt yuv420p -movflags +faststart -preset fast "${processedPath}"`;
                    execSync(cmd, { stdio: 'inherit' });
                } catch (e) {
                    console.error(`FFmpeg failed for ${key}:`, e);
                    continue;
                }
            }

            // 3. Update entry to local path (staticFile compatible)
            // Remotion staticFile path starts from public base
            // "/assets/processed/..."
            processedAssets[key] = `/assets/processed/${filename}`;
        }
    }

    // Write new mapping
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(processedAssets, null, 2));
    console.log(`\nDone! Processed assets map saved to ${OUTPUT_JSON}`);
}

processAssets();
