import { Jimp } from "jimp";
import { promises as fs } from "fs";
import path from "path";

const src = "./RSJ.jpg";
const outDir = "./public/icons";

await fs.mkdir(outDir, { recursive: true });

const sizes = [
  { name: "favicon-32x32.png",        size: 32  },
  { name: "apple-touch-icon.png",     size: 180 },
  { name: "icon-192x192.png",         size: 192 },
  { name: "icon-512x512.png",         size: 512 },
  { name: "maskable-icon-512x512.png",size: 512 },
];

const img = await Jimp.read(src);

for (const { name, size } of sizes) {
  const clone = img.clone();
  clone.resize({ w: size, h: size });
  await clone.write(path.join(outDir, name));
  console.log(`✅ ${name}`);
}

console.log("All icons generated!");
