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
  console.log('Copied web/dist to server/dist successfully.');
}

if (fs.existsSync(serverDist) && fs.existsSync(path.resolve(serverDist, 'index.html'))) {
  fs.cpSync(serverDist, rootDist, { recursive: true });
  console.log('Copied server/dist to root dist successfully.');
}
