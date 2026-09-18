import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseService } from './db/database.js';
import { TournamentService } from './services/tournament.service.js';
import { MatchReportService } from './services/match-report.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function buildServer(dbPath?: string) {
  const fastify = Fastify({ logger: true });
  const dbService = new DatabaseService(dbPath || './data/tournament.db');
  const tourneyService = new TournamentService(dbService);
  const reportService = new MatchReportService(dbService);

  // Active WebSocket connections mapped by tournamentId
  const wsClients = new Map<string, Set<any>>();

  fastify.register(cors, { origin: '*' });
  fastify.register(websocket);

  // Serve static web app if built
  const webDistPath = resolve(__dirname, '../../web/dist');
  if (existsSync(webDistPath)) {
    fastify.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/'
    });
  }

  function broadcast(tournamentId: string, event: string, payload: any) {
    const clients = wsClients.get(tournamentId);
    if (!clients) return;
    const msg = JSON.stringify({ event, payload });
    for (const ws of clients) {
      try {
        if (ws.readyState === 1) { // OPEN
          ws.send(msg);
        }
      } catch (err) {
        fastify.log.error(err);
      }
    }
  }

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // WebSocket route for real-time live events
  fastify.register(async function (fastifyWs) {
    fastifyWs.get('/ws/tournament/:id', { websocket: true }, (connection: any, req) => {
      const { id: tournamentId } = req.params as { id: string };
      const socket = connection.socket || connection;

      if (!wsClients.has(tournamentId)) {
        wsClients.set(tournamentId, new Set());
      }
      const set = wsClients.get(tournamentId)!;
      set.add(socket);

      socket.on('close', () => {
        set.delete(socket);
        if (set.size === 0) {
          wsClients.delete(tournamentId);
        }
      });
    });
  });

  // Upload/Ingest TDF
  fastify.post('/api/tournaments/:id/upload', async (req, reply) => {
    const { id } = req.params as { id: string };
    const rawXml = req.body as string;

    if (!rawXml || typeof rawXml !== 'string') {
      return reply.code(400).send({ error: 'Body must be raw TDF XML string' });
    }

    try {
      const data = tourneyService.ingestTdf(id, rawXml);
      broadcast(id, 'ROUND_UPDATED', { tournamentId: id, currentRound: data.pods[0]?.rounds?.length || 1 });
      return { success: true, tournament: data };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Get active match for a specific player (POP ID)
  fastify.get('/api/tournaments/:id/matches/active', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { popId } = req.query as { popId?: string };

    if (!popId) {
      return reply.code(400).send({ error: 'Query parameter popId is required' });
    }

    const match = tourneyService.getPlayerActiveMatch(id, popId);
    if (!match) {
      return reply.code(404).send({ error: 'No active match found for this player in the current round' });
    }

    return match;
  });

  // Get all pairings for current or specific round
  fastify.get('/api/tournaments/:id/pairings', async (req) => {
    const { id } = req.params as { id: string };
    const { round } = req.query as { round?: string };
    const roundNumber = round ? Number(round) : undefined;
    return tourneyService.getRoundPairings(id, roundNumber);
  });

  // Get tournament standings
  fastify.get('/api/tournaments/:id/standings', async (req) => {
    const { id } = req.params as { id: string };
    const { category } = req.query as { category?: string };
    return tourneyService.getStandings(id, category);
  });

  // Submit player match report
  fastify.post('/api/tournaments/:id/matches/:matchId/report', async (req, reply) => {
    const { id, matchId } = req.params as { id: string; matchId: string };
    const body = req.body as { reportingPlayerId: string; winnerId?: string | null; isTie?: boolean };

    if (!body || !body.reportingPlayerId) {
      return reply.code(400).send({ error: 'reportingPlayerId is required' });
    }

    try {
      const result = reportService.reportResult({
        matchId,
        reportingPlayerId: body.reportingPlayerId,
        winnerId: body.winnerId || null,
        isTie: Boolean(body.isTie)
      });

      broadcast(id, 'MATCH_REPORTED', result);
      return result;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Judge Override
  fastify.post('/api/tournaments/:id/matches/:matchId/override', async (req, reply) => {
    const { id, matchId } = req.params as { id: string; matchId: string };
    const body = req.body as { winnerId?: string | null; isTie?: boolean };

    try {
      const result = reportService.judgeOverride({
        matchId,
        winnerId: body.winnerId || null,
        isTie: Boolean(body.isTie)
      });

      broadcast(id, 'MATCH_OVERRIDDEN', result);
      return result;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Get Judge report queue
  fastify.get('/api/tournaments/:id/reports/queue', async (req) => {
    const { id } = req.params as { id: string };
    return reportService.getReportQueue(id);
  });

  return { fastify, tourneyService, reportService, dbService };
}

export async function startServer() {
  const { fastify } = buildServer();
  const PORT = Number(process.env.PORT || 3001);
  const address = await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n======================================================`);
  console.log(`  🏛️  COLISEU TCG • Pokémon TOM Platform Server`);
  console.log(`  🌐 Acesse no navegador: http://localhost:${PORT}`);
  console.log(`  📡 API & WebSockets em: ${address}`);
  console.log(`======================================================\n`);
  return fastify;
}

// Start standalone server if executed directly
if (process.argv[1] && (process.argv[1].endsWith('index.js') || process.argv[1].includes('server'))) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
