import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";

// Render the existing vector mark using Next.js's installed image dependency.
// Static output keeps icons crawlable without a function or a network request.
const requireFromNext = createRequire(import.meta.resolve("next/package.json"));
const sharp = requireFromNext("sharp");
const root = new URL("../", import.meta.url);
const svg = await readFile(new URL("app/icon.svg", root));
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(size => sharp(svg).resize(size, size).png().toBuffer()));

// ICO directory entries point to individual lossless PNG payloads.
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (let i = 0; i < sizes.length; i++) {
  const entry = 6 + i * 16;
  directory[entry] = sizes[i] === 256 ? 0 : sizes[i];
  directory[entry + 1] = directory[entry];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(images[i].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
}
await writeFile(new URL("app/favicon.ico", root), Buffer.concat([directory, ...images]));
await writeFile(new URL("app/apple-icon.png", root), await sharp(svg).resize(180, 180).png().toBuffer());
await writeFile(new URL("public/learningmap-logo.png", root), await sharp(svg).resize(192, 192).png().toBuffer());
console.log("Generated LearningMap favicon (6 sizes), Apple icon and public logo from app/icon.svg.");
