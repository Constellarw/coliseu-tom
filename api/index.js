import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serverModule = null;
async function loadServerModule() {
  if (!serverModule) {
    const candidates = [
      resolve(__dirname, '../packages/server/dist/index.js'),
      resolve(__dirname, '../dist/index.js'),
      resolve(process.cwd(), 'packages/server/dist/index.js'),
      resolve(process.cwd(), 'dist/index.js')
    ];
    const found = candidates.find((p) => existsSync(p));
    if (!found) throw new Error('Cannot find built server index.js');
    serverModule = await import(pathToFileURL(found).href);
  }
  return serverModule;
}

let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildServer } = await loadServerModule();
      const { fastify, dbService } = buildServer();
      if (dbService.isRemote) {
        await dbService.initSchema();
      }
      await fastify.ready();
      return fastify;
    })();
  }
  return appPromise;
}

export default async function handler(req, res) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
