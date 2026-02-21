const fs = require('fs');
const https = require('https');

const API_KEY = "CnYjcJlSLgCwP1Ch1IUfIs4Wh64iXMQ71iCJwiYqArBvqKEH4WPBCrQm";

const QUERIES = {
    scene2: "trading floor finance money",
    scene3: "bank vault gold reserve",
    scene5: "government building capitol"
};

const fetchVideo = (query) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
        const options = { headers: { Authorization: API_KEY } };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.videos && json.videos.length > 0) {
                        // Find a good HD file
                        const videoInfo = json.videos[0];
                        const videoFiles = videoInfo.video_files;
                        const hdVideo = videoFiles.find(f => f.quality === 'hd') || videoFiles[0];
                        resolve(hdVideo.link);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const downloadVideo = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            // Check for redirect
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadVideo(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const main = async () => {
    for (const [scene, query] of Object.entries(QUERIES)) {
        console.log(`Searching Pexels for ${scene} : "${query}"`);
        const url = await fetchVideo(query);
        if (url) {
            console.log(`Found video for ${scene}. Downloading...`);
            const dest = `./public/assets/processed/${scene}_atmosphere.mp4`;
            await downloadVideo(url, dest);
            console.log(`Saved ${scene} to ${dest}`);
        } else {
            console.log(`No video found for ${scene}`);
        }
    }
};

main();
