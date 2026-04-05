import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Professional yacht captain/concierge image
const LEONARD_PHOTO_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=85&auto=format';
const OUTPUT_DIR = join(__dirname, '..', 'public', 'images');
const OUTPUT_FILE = join(OUTPUT_DIR, 'leonard-avatar.jpg');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📥 Downloading optimized Leonard avatar (200x200)...');

https.get(LEONARD_PHOTO_URL, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Failed to download: HTTP ${response.statusCode}`);
        process.exit(1);
    }

    const fileStream = fs.createWriteStream(OUTPUT_FILE);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        const stats = fs.statSync(OUTPUT_FILE);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ Leonard avatar downloaded successfully!`);
        console.log(`   📁 Location: ${OUTPUT_FILE}`);
        console.log(`   📊 Size: ${sizeKB} KB`);
        console.log(`   ⚓ This image will be cached by browsers for optimal performance`);
    });
}).on('error', (err) => {
    console.error('❌ Download error:', err);
    process.exit(1);
});