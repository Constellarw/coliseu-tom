import { buildServer } from '../dist/index.js';

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
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

export default async function handler(req: any, res: any) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
