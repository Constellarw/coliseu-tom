import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDist = path.resolve(__dirname, '../../web/dist');
const serverDist = path.resolve(__dirname, '../dist');
const rootDist = path.resolve(__dirname, '../../../dist');

if (fs.existsSync(webDist)) {
  fs.cpSync(webDist, serverDist, { recursive: true });
} else if (fs.existsSync(rootDist) && fs.existsSync(path.resolve(rootDist, 'index.html'))) {
  fs.cpSync(rootDist, serverDist, { recursive: true });
}

console.log('copy-dist complete: server/dist has web assets ready.');
