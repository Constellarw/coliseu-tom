import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildServer } from '../src/index.js';

describe('Auth, Anti-Fraud POP ID Binding, and Profile History', () => {
  let serverInstance: any;
  let fastify: any;

  beforeAll(async () => {
    serverInstance = buildServer(':memory:');
    fastify = serverInstance.fastify;
    await fastify.ready();

    // Ingest sample tournament so we have real players:
    // Ash Ketchum (POP ID: 987654321, birthdate: 22/05/1990)
    // Gary Oak (POP ID: 876543219, birthdate: 01/01/1990)
    const fixturePath = resolve(__dirname, '../../tom-core/tests/fixtures/sample_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');
    const inProgressXml = xmlContent.replace('outcome="1"', 'outcome="0"');

    await fastify.inject({
      method: 'POST',
      url: '/api/tournaments/auth-test-tourney/upload',
      headers: { 'content-type': 'text/plain' },
      body: inProgressXml
    });
  });

  afterAll(async () => {
    await fastify.close();
  });

  let ashToken: string;
  let garyToken: string;

  it('should authenticate Ash Ketchum via dev login', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/dev-login',
      payload: {
        email: 'ash@pokemon.com',
        name: 'Ash Ketchum',
        picture: 'https://images.unsplash.com/photo-ash'
      }
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.token).toBeDefined();
    expect(json.user.email).toBe('ash@pokemon.com');
    expect(json.user.pop_id).toBeNull();
    ashToken = json.token;
  });

  it('should return 401 when accessing /me with invalid token', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer invalid-token' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return user info when accessing /me with valid token', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${ashToken}` }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.name).toBe('Ash Ketchum');
  });

  it('should reject binding if POP ID is empty', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/bind-popid',
      headers: { authorization: `Bearer ${ashToken}` },
      payload: {
        popId: ''
      }
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('POP ID é obrigatório');
  });

  it('should succeed binding Ash POP ID directly without birthdate requirement', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/bind-popid',
      headers: { authorization: `Bearer ${ashToken}` },
      payload: {
        popId: '987654321'
      }
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.success).toBe(true);
    expect(json.user.pop_id).toBe('987654321');
    expect(json.user.is_verified).toBe(1);
  });

  it('should prevent Gary from claiming Ash POP ID (already claimed)', async () => {
    // Authenticate Gary
    const garyRes = await fastify.inject({
      method: 'POST',
      url: '/api/auth/dev-login',
      payload: {
        email: 'gary@pokemon.com',
        name: 'Gary Oak'
      }
    });
    garyToken = garyRes.json().token;

    // Gary tries to steal Ash's POP ID
    const stealRes = await fastify.inject({
      method: 'POST',
      url: '/api/auth/bind-popid',
      headers: { authorization: `Bearer ${garyToken}` },
      payload: {
        popId: '987654321'
      }
    });

    expect(stealRes.statusCode).toBe(400);
    expect(stealRes.json().error).toContain('já está vinculado a outra conta');

    // Gary binds his own POP ID
    const garyBind = await fastify.inject({
      method: 'POST',
      url: '/api/auth/bind-popid',
      headers: { authorization: `Bearer ${garyToken}` },
      payload: {
        popId: '876543219'
      }
    });
    expect(garyBind.statusCode).toBe(200);
    expect(garyBind.json().user.pop_id).toBe('876543219');
  });

  it('should prevent user from spoofing reports for another player', async () => {
    // Get table 1 match ID
    const activeRes = await fastify.inject({
      method: 'GET',
      url: '/api/tournaments/auth-test-tourney/matches/active?popId=987654321'
    });
    const matchId = activeRes.json().matchId;

    // Gary tries to report representing Ash (reportingPlayerId: 987654321) using Gary's token
    const fraudRes = await fastify.inject({
      method: 'POST',
      url: `/api/tournaments/auth-test-tourney/matches/${matchId}/report`,
      headers: { authorization: `Bearer ${garyToken}` },
      payload: {
        reportingPlayerId: '987654321', // Spoofed ID
        winnerId: '876543219',
        isTie: false
      }
    });

    expect(fraudRes.statusCode).toBe(403);
    expect(fraudRes.json().error).toContain('Operação não autorizada');
  });

  it('should allow legitimate player to report their match and query profile stats', async () => {
    const activeRes = await fastify.inject({
      method: 'GET',
      url: '/api/tournaments/auth-test-tourney/matches/active?popId=987654321'
    });
    const matchId = activeRes.json().matchId;

    // Ash reports his match
    const ashReport = await fastify.inject({
      method: 'POST',
      url: `/api/tournaments/auth-test-tourney/matches/${matchId}/report`,
      headers: { authorization: `Bearer ${ashToken}` },
      payload: {
        reportingPlayerId: '987654321',
        winnerId: '987654321',
        isTie: false
      }
    });
    expect(ashReport.statusCode).toBe(200);
    expect(ashReport.json().status).toBe('PENDING_CONFIRMATION');

    // Gary confirms
    const garyReport = await fastify.inject({
      method: 'POST',
      url: `/api/tournaments/auth-test-tourney/matches/${matchId}/report`,
      headers: { authorization: `Bearer ${garyToken}` },
      payload: {
        reportingPlayerId: '876543219',
        winnerId: '987654321',
        isTie: false
      }
    });
    expect(garyReport.statusCode).toBe(200);
    expect(garyReport.json().status).toBe('CONFIRMED');

    // Query Ash profile stats
    const statsRes = await fastify.inject({
      method: 'GET',
      url: '/api/users/profile/stats',
      headers: { authorization: `Bearer ${ashToken}` }
    });

    expect(statsRes.statusCode).toBe(200);
    const stats = statsRes.json();
    expect(stats.popId).toBe('987654321');
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(0);
    expect(stats.totalMatches).toBe(1);
    expect(stats.winRate).toBe(100);

    // Query tournament history
    const historyRes = await fastify.inject({
      method: 'GET',
      url: '/api/users/profile/tournaments',
      headers: { authorization: `Bearer ${ashToken}` }
    });

    expect(historyRes.statusCode).toBe(200);
    const history = historyRes.json();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].tournamentName).toBe('Test tournament');
    expect(history[0].matches.length).toBe(1);
    expect(history[0].matches[0].result).toBe('VITÓRIA');
    expect(history[0].matches[0].opponentName).toBe('Gary Oak');
  });

  it('should invalidate session on logout', async () => {
    const logoutRes = await fastify.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: `Bearer ${ashToken}` }
    });
    expect(logoutRes.statusCode).toBe(200);

    const meRes = await fastify.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${ashToken}` }
    });
    expect(meRes.statusCode).toBe(401);
  });
});
