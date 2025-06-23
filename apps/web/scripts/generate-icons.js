import fs from "node:fs";
import path from "node:path";
import { createCanvas } from "canvas";

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
	const canvas = createCanvas(size, size);
	const ctx = canvas.getContext("2d");

	// Background
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, size, size);

	// Hospital cross
	ctx.fillStyle = "#ffffff";
	const crossWidth = size * 0.2;
	const crossHeight = size * 0.6;

	// Vertical line
	ctx.fillRect(
		(size - crossWidth) / 2,
		(size - crossHeight) / 2,
		crossWidth,
		crossHeight,
	);

	// Horizontal line
	ctx.fillRect(
		(size - crossHeight) / 2,
		(size - crossWidth) / 2,
		crossHeight,
		crossWidth,
	);

	return canvas.toBuffer("image/png");
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(process.cwd(), "public", "icons");
if (!fs.existsSync(iconsDir)) {
	fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
for (const size of sizes) {
	const iconBuffer = generateIcon(size);
	const filename = `icon-${size}x${size}.png`;
	const filepath = path.join(iconsDir, filename);
	fs.writeFileSync(filepath, iconBuffer);
	console.log(`Generated ${filename}`);
}

console.log("All icons generated successfully!");
