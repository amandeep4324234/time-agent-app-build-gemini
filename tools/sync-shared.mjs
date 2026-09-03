import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isCheck = process.argv.includes('--check');

const copies = [
  {
    src: path.join(root, 'web/data/seed-map.json'),
    dest: [
      path.join(root, 'android/engine/src/test/resources/seed-map.json'),
      path.join(root, 'android/collector/src/main/assets/seed-map.json')
    ]
  },
  {
    src: path.join(root, 'web/src/lib/__tests__/goldens.json'),
    dest: [
      path.join(root, 'android/engine/src/test/resources/goldens.json')
    ]
  },
  {
    src: path.join(root, 'web/src/lib/__tests__/fixtures/chrome-dark.json'),
    dest: [
      path.join(root, 'android/engine/src/test/resources/fixtures/chrome-dark.json')
    ]
  },
  {
    src: path.join(root, 'web/src/lib/__tests__/fixtures/two-device-hole.json'),
    dest: [
      path.join(root, 'android/engine/src/test/resources/fixtures/two-device-hole.json')
    ]
  },
  {
    src: path.join(root, 'web/src/lib/__tests__/fixtures/sustained-unclassified.json'),
    dest: [
      path.join(root, 'android/engine/src/test/resources/fixtures/sustained-unclassified.json')
    ]
  }
];

if (isCheck) {
  let hasDrift = false;
  for (const item of copies) {
    if (!fs.existsSync(item.src)) {
      console.error('Source file missing: ' + item.src);
      process.exit(1);
    }
    const srcBuf = fs.readFileSync(item.src);
    for (const d of item.dest) {
      if (!fs.existsSync(d)) {
        console.error('Destination file missing: ' + d);
        hasDrift = true;
        continue;
      }
      const destBuf = fs.readFileSync(d);
      if (!srcBuf.equals(destBuf)) {
        console.error('Drift detected between ' + item.src + ' and ' + d);
        hasDrift = true;
      }
    }
  }
  if (hasDrift) {
    console.error('Shared asset drift check failed.');
    process.exit(1);
  } else {
    console.log('Shared asset drift check passed. All copies are byte-identical.');
    process.exit(0);
  }
} else {
  for (const item of copies) {
    if (!fs.existsSync(item.src)) {
      console.warn('Source not found, skipping: ' + item.src);
      continue;
    }
    const srcBuf = fs.readFileSync(item.src);
    for (const d of item.dest) {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.writeFileSync(d, srcBuf);
      console.log('Synced: ' + path.relative(root, item.src) + ' -> ' + path.relative(root, d));
    }
  }
  console.log('Shared assets successfully synced.');
}