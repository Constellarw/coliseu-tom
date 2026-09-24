import fs from 'node:fs';
import path from 'node:path';

const rootDist = path.resolve('dist');
const webDist = path.resolve('packages/web/dist');

// If root dist exists but web/dist doesn't, copy to web/dist
if (fs.existsSync(rootDist) && !fs.existsSync(webDist)) {
  fs.cpSync(rootDist, webDist, { recursive: true });
}
// If web/dist exists but root dist doesn't, copy to root dist
else if (fs.existsSync(webDist) && !fs.existsSync(rootDist)) {
  fs.cpSync(webDist, rootDist, { recursive: true });
}
// If web/dist exists and was updated more recently, sync to root dist
else if (fs.existsSync(webDist) && fs.existsSync(rootDist)) {
  fs.cpSync(webDist, rootDist, { recursive: true });
}

console.log('Postbuild sync complete: dist/ and packages/web/dist/ are in sync.');
