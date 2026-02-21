const fs = require('fs');
const https = require('https');

const API_KEY = "CnYjcJlSLgCwP1Ch1IUfIs4Wh64iXMQ71iCJwiYqArBvqKEH4WPBCrQm";

// SOP Mapping:
// Rule 1: Stock Video = Atmosphere (Abstract, blurred, background)
// Rule 2: Stock Image = Evidence (Specific, sharp, cutout/framed)

const WEALTH_ARCHIVE_QUERY_MAP = {
    // S1: Government Printing
    scene1_video: "money printing press machine industrial",
    scene1_image: "us treasury building historic black and white",

    // S2: Fed Chasing Tiger
    scene2_video: "tiger darkness slow motion cinematic",
    scene2_image: "federal reserve chairman portrait historic", // or "Powell" but simpler

    // S3: One Engine (Low Rates)
    scene3_video: "industrial engine steam machinery",
    scene3_image: "chart graph paper vintage",

    // S4: Addiction to Debt
    scene4_video: "needle medical abstract dark",
    scene4_image: "us debt clock digital counter",

    // S5: Engine Changed
    scene5_video: "gears turning mechanism old",
    scene5_image: "imf logo building",

    // S6: Bypassing Banks
    scene6_video: "river flowing fast dark",
    scene6_image: "bank building neoclassical columns",

    // S7: Inflation Choice
    scene7_video: "forest fire burning slow motion",
    scene7_image: "newspaper headline inflation vintage",

    // S8: Zombie Companies
    scene8_video: "graveyard fog mystery",
    scene8_image: "abandoned factory building",

    // S9: Real Assets Win
    scene9_video: "gold vault bars shine",
    scene9_image: "bitcoin physical coin gold",

    // S10: Wealth Transfer
    scene10_video: "hourglass sand falling time",
    scene10_image: "wallet empty leather",

    // S11: Slow Burn
    scene11_video: "candle flame burning dark",
    scene11_image: "stock market crash newspaper 1929",

    // S12: New Operator
    scene12_video: "printing press modern high speed",
    scene12_image: "capitol hill building night"
};

const fetchMedia = (query, key) => {
    return new Promise((resolve, reject) => {
        const isVideo = key.includes("video");
        const baseUrl = isVideo
            ? "https://api.pexels.com/videos/search"
            : "https://api.pexels.com/v1/search";

        const url = `${baseUrl}?query=${encodeURIComponent(query)}&per_page=1&orientation=${isVideo ? 'portrait' : 'landscape'}&size=medium`;

        const options = {
            headers: {
                Authorization: API_KEY
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    let link = null;

                    if (isVideo) {
                        if (json.videos && json.videos.length > 0) {
                            const videoFiles = json.videos[0].video_files;
                            // Prefer HD
                            const bestVideo = videoFiles.find(v => v.quality === 'hd') || videoFiles[0];
                            link = bestVideo.link;
                        }
                    } else {
                        if (json.photos && json.photos.length > 0) {
                            link = json.photos[0].src.large2x;
                        }
                    }

                    if (link) {
                        console.log(`Found ${isVideo ? 'video' : 'photo'} for ${query}: ${link}`);
                        resolve({ [key]: link });
                    } else {
                        console.warn(`No media found for ${query}`);
                        resolve({ [key]: null });
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const main = async () => {
    const results = {};

    for (const [key, query] of Object.entries(WEALTH_ARCHIVE_QUERY_MAP)) {
        console.log(`Fetching ${key}: ${query}...`);
        try {
            const result = await fetchMedia(query, key);
            Object.assign(results, result);
            await new Promise(r => setTimeout(r, 800)); // rate limit
        } catch (e) {
            console.error(`Error fetching ${key}:`, e);
        }
    }

    // Ensure dir exists
    const dir = 'src/WealthArchiveVideo';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(`${dir}/assets.json`, JSON.stringify(results, null, 2));
    console.log(`Done! Assets saved to ${dir}/assets.json`);
};

main();
