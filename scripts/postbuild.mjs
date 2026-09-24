import fs from 'node:fs';
import path from 'node:path';

const rootDist = path.resolve('dist');
const webDist = path.resolve('packages/web/dist');
const serverDist = path.resolve('packages/server/dist');

// Copy frontend webDist to rootDist and serverDist
if (fs.existsSync(webDist)) {
  fs.cpSync(webDist, rootDist, { recursive: true });
  fs.cpSync(webDist, serverDist, { recursive: true });
}

// Copy server compiled files from serverDist to rootDist
if (fs.existsSync(serverDist)) {
  const items = fs.readdirSync(serverDist);
  for (const item of items) {
    if (item.endsWith('.js') || item.endsWith('.d.ts') || item.endsWith('.map') || item === 'db' || item === 'services') {
      const src = path.join(serverDist, item);
      const dest = path.join(rootDist, item);
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}

console.log('Postbuild sync complete: dist/, packages/web/dist/, and packages/server/dist/ are in sync.');
