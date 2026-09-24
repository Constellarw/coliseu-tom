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
import { AuthService } from './services/auth.service.js';
import { ProfileService } from './services/profile.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  process.loadEnvFile?.();
} catch {
  // Ignore if .env doesn't exist
}

export function buildServer(dbPath?: string) {
  const fastify = Fastify({ logger: true });
  const dbService = new DatabaseService(dbPath || './data/tournament.db');
  const tourneyService = new TournamentService(dbService);
  const reportService = new MatchReportService(dbService);
  const authService = new AuthService(dbService);
  const profileService = new ProfileService(dbService);

  async function getAuthenticatedUser(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    return await authService.getUserByToken(token);
  }

  function decodeGoogleJwt(credential: string) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        return {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

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

  // Judge authentication
  fastify.post('/api/auth/judge', async (req, reply) => {
    const body = (req.body as { password?: string }) || {};
    const validPassword = process.env.JUDGE_PASSWORD || 'coliseu123';
    if (body.password === validPassword) {
      return { success: true, message: 'Autenticado com sucesso como Juiz' };
    }
    return reply.code(401).send({ error: 'Senha incorreta. Acesso exclusivo para Juízes e Organizadores.' });
  });

  // Google OAuth Login
  fastify.post('/api/auth/google', async (req, reply) => {
    const body = (req.body as { credential?: string; googleId?: string; email?: string; name?: string; picture?: string }) || {};
    let payload = { googleId: body.googleId, email: body.email, name: body.name, picture: body.picture };

    if (body.credential) {
      const decoded = decodeGoogleJwt(body.credential);
      if (decoded) {
        payload = { ...decoded, ...payload };
      }
    }

    if (!payload.email || (!payload.googleId && !body.credential)) {
      return reply.code(400).send({ error: 'Credenciais Google inválidas ou incompletas.' });
    }

    const googleId = payload.googleId || `g_${Date.now()}`;
    const result = await authService.loginWithGoogle({
      googleId,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture
    });

    return result;
  });

  // Dev Mock Login (fast testing without Google Console setup)
  fastify.post('/api/auth/dev-login', async (req, reply) => {
    const body = (req.body as { email?: string; name?: string; popId?: string; picture?: string }) || {};
    if (!body || !body.email) {
      return reply.code(400).send({ error: 'Email é obrigatório para login Dev.' });
    }

    const result = await authService.devLogin({
      email: body.email,
      name: body.name || body.email.split('@')[0],
      popId: body.popId,
      picture: body.picture
    });

    return result;
  });

  // Current authenticated user info
  fastify.get('/api/auth/me', async (req, reply) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return reply.code(401).send({ error: 'Não autenticado' });
    }
    return { user };
  });

  // Bind POP ID to user account (with anti-fraud verification)
  fastify.post('/api/auth/bind-popid', async (req, reply) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return reply.code(401).send({ error: 'É necessário estar autenticado para vincular seu POP ID.' });
    }

    const body = (req.body as { popId?: string; birthDate?: string }) || {};
    if (!body || !body.popId) {
      return reply.code(400).send({ error: 'POP ID é obrigatório.' });
    }

    try {
      const updatedUser = await authService.bindPopId(user.id, body.popId, body.birthDate);
      return { success: true, user: updatedUser };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Logout
  fastify.post('/api/auth/logout', async (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      await authService.logout(token);
    }
    return { success: true };
  });

  // Player Profile: Overall stats (wins, ties, losses, win rate, best place)
  fastify.get('/api/users/profile/stats', async (req, reply) => {
    const { popId: queryPopId } = req.query as { popId?: string };
    let popId = queryPopId;

    if (!popId) {
      const user = await getAuthenticatedUser(req);
      if (user && user.pop_id) {
        popId = user.pop_id;
      }
    }

    if (!popId) {
      return reply.code(400).send({ error: 'POP ID é obrigatório (via query ?popId= ou via usuário logado com POP ID vinculado)' });
    }

    return await profileService.getPlayerStats(popId);
  });

  // Player Profile: Tournament history breakdown
  fastify.get('/api/users/profile/tournaments', async (req, reply) => {
    const { popId: queryPopId } = req.query as { popId?: string };
    let popId = queryPopId;

    if (!popId) {
      const user = await getAuthenticatedUser(req);
      if (user && user.pop_id) {
        popId = user.pop_id;
      }
    }

    if (!popId) {
      return reply.code(400).send({ error: 'POP ID é obrigatório (via query ?popId= ou via usuário logado com POP ID vinculado)' });
    }

    return await profileService.getTournamentHistory(popId);
  });

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
      const data = await tourneyService.ingestTdf(id, rawXml);
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

    const match = await tourneyService.getPlayerActiveMatch(id, popId);
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
    return await tourneyService.getRoundPairings(id, roundNumber);
  });

  // Get tournament standings
  fastify.get('/api/tournaments/:id/standings', async (req) => {
    const { id } = req.params as { id: string };
    const { category } = req.query as { category?: string };
    return await tourneyService.getStandings(id, category);
  });

  // Submit player match report
  fastify.post('/api/tournaments/:id/matches/:matchId/report', async (req, reply) => {
    const { id, matchId } = req.params as { id: string; matchId: string };
    const body = req.body as { reportingPlayerId: string; winnerId?: string | null; isTie?: boolean };

    if (!body || !body.reportingPlayerId) {
      return reply.code(400).send({ error: 'reportingPlayerId is required' });
    }

    // Anti-fraud authentication verification
    const user = await getAuthenticatedUser(req);
    if (user) {
      if (!user.pop_id) {
        return reply.code(403).send({ error: 'Você precisa vincular seu POP ID oficial antes de enviar reports de partidas.' });
      }
      if (user.pop_id !== body.reportingPlayerId) {
        return reply.code(403).send({
          error: `Operação não autorizada: sua conta está vinculada ao POP ID ${user.pop_id}. Você não pode reportar partidas de outros jogadores.`
        });
      }
    } else if (process.env.NODE_ENV !== 'test' && process.env.REQUIRE_AUTH === 'true') {
      return reply.code(401).send({ error: 'É necessário fazer login com o Google e vincular seu POP ID para reportar a partida.' });
    }

    try {
      const result = await reportService.reportResult({
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
      const result = await reportService.judgeOverride({
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
    return await reportService.getReportQueue(id);
  });

  return { fastify, tourneyService, reportService, dbService, authService, profileService };
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
