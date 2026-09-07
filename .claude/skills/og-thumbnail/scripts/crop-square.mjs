import sharp from 'sharp';
import { computeSquareCrop } from './lib.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    args[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  return args;
}

const { input, output, cx, cy, size } = parseArgs(process.argv.slice(2));
if (!input || !output || cx === undefined || cy === undefined) {
  console.error('Usage: crop-square.mjs --input <path> --output <path> --cx <0-1> --cy <0-1> [--size 800]');
  process.exit(1);
}

const image = sharp(input);
const { width, height } = await image.metadata();
const crop = computeSquareCrop({ width, height, cx: Number(cx), cy: Number(cy) });

await image
  .extract({ left: crop.left, top: crop.top, width: crop.size, height: crop.size })
  .resize(Number(size) || 800, Number(size) || 800)
  .toFile(output);

console.log(output);
