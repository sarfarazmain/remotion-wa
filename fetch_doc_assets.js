require('dotenv').config();
const fs = require('fs');
const https = require('https');

// Load API key from environment variable
const API_KEY = process.env.PEXELS_API_KEY;

if (!API_KEY) {
    console.error('Error: PEXELS_API_KEY environment variable is not set.');
    console.error('Please create a .env file with: PEXELS_API_KEY=your_api_key');
    process.exit(1);
}

// Queries based on DocumentaryVideo scenes
const QUERY_MAP = {
    scene1: "government building low angle dark cinematic", // "Central banks are not printing... The government is."
    scene2: "stock market chart abstract dark", // "The Fed isn't leading... chasing."
    scene3: "industrial gears mechanism dark", // "For a decade... only engine."
    scene4: "addiction silhouette dark moody", // "Investors grew addicted to cheap debt."
    scene5: "steam train locomotive engine dark", // "The engine changed. Fiscal dominance."
    scene6: "pipeline texture dark industrial", // "Bypassing banks... inject directly."
    scene7: "burning money fire dark cinematic", // "Inflation is a policy choice."
    scene8: "abandoned building rust decay dark", // "Zombie companies are dying."
    scene9: "gold bars luxury dark cinematic", // "Real assets win."
    scene10: "hourglass sand time dark cinematic", // "Wealth redistributed."
    scene11: "embers burning charcoal fire dark", // "Not a crash. A slow burn."
    scene12: "newspaper printing press machine rotation" // "The press didn't stop."
};

const fetchImage = (query, key) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait&size=large`;

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
                    if (json.photos && json.photos.length > 0) {
                        const photo = json.photos[0];
                        // Prefer large2x or large, fallback to original
                        const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;

                        console.log(`Found image for ${query}: ${imageUrl}`);
                        resolve({ [key]: imageUrl });
                    } else {
                        console.warn(`No image found for ${query}`);
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

    // Ensure directory exists
    const dir = 'src/DocumentaryVideo';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    for (const [key, query] of Object.entries(QUERY_MAP)) {
        console.log(`Fetching ${key}: ${query}...`);
        try {
            const result = await fetchImage(query, key);
            Object.assign(results, result);
            // wait 1s to respect rate limits
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`Error fetching ${key}:`, e);
        }
    }

    fs.writeFileSync('src/DocumentaryVideo/assets.json', JSON.stringify(results, null, 2));
    console.log('Done! Assets saved to src/DocumentaryVideo/assets.json');
};

main();
