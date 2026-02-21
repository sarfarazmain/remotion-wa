const fs = require('fs');
const path = require('path');

function createNoiseBMP(width, height) {
    const fileHeaderSize = 14;
    const infoHeaderSize = 40;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = fileHeaderSize + infoHeaderSize + pixelArraySize;

    const buffer = Buffer.alloc(fileSize);

    // File Header
    buffer.write('BM', 0); // Signature
    buffer.writeUInt32LE(fileSize, 2); // File size
    buffer.writeUInt32LE(54, 10); // Offset to pixel array

    // Info Header
    buffer.writeUInt32LE(40, 14); // Header size
    buffer.writeUInt32LE(width, 18); // Width
    buffer.writeUInt32LE(height, 22); // Height
    buffer.writeUInt16LE(1, 26); // Planes
    buffer.writeUInt16LE(24, 28); // Bits per pixel (RGB)
    buffer.writeUInt32LE(0, 30); // Compression (BI_RGB)
    buffer.writeUInt32LE(pixelArraySize, 34); // Image size

    // Pixel Data
    let offset = 54;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gray = Math.floor(Math.random() * 256);
            // BMP is BGR
            buffer[offset + x * 3] = gray;     // Blue
            buffer[offset + x * 3 + 1] = gray; // Green
            buffer[offset + x * 3 + 2] = gray; // Red
        }
        offset += rowSize; // Padding is included in logic but simpler to just jump rows if aligned? 
        // Logic check: rowSize is 4-byte aligned. 
        // For 256 width * 3 bytes = 768. 768 % 4 == 0. No padding needed.
        // My loop logic above writes contiguously.
        // Let's stick to simple raw writing for 256 width.
        // Reset offset? No, the loop logic is slightly flawed for generic width.
        // For 256 width, rowSize is 768. 
        // Correct loop:
    }

    // Rewrite Pixel Data safer
    offset = 54;
    for (let y = 0; y < height; y++) {
        let rowOffset = offset + (y * rowSize);
        for (let x = 0; x < width; x++) {
            const gray = Math.floor(Math.random() * 150 + 50); // Keep it mid-tone
            const pos = rowOffset + x * 3;
            buffer[pos] = gray;
            buffer[pos + 1] = gray;
            buffer[pos + 2] = gray;
        }
    }

    return buffer;
}

const width = 256;
const height = 256;
const bmpBuffer = createNoiseBMP(width, height);
const outputPath = path.join(__dirname, '../src/WealthArchiveVideo/noise.bmp');

fs.writeFileSync(outputPath, bmpBuffer);
console.log(`Generated noise texture at ${outputPath}`);
