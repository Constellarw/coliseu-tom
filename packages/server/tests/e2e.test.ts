import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildServer } from '../src/index.js';

describe('End-to-End API Integration', () => {
  let serverInstance: any;
  let fastify: any;

  beforeAll(async () => {
    serverInstance = buildServer(':memory:');
    fastify = serverInstance.fastify;
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it('should ingest TDF, provide player active pairing, accept player reports, and update judge queue', async () => {
    const fixturePath = resolve(__dirname, '../../tom-core/tests/fixtures/sample_tournament.tdf');
    const xmlContent = readFileSync(fixturePath, 'utf-8');
    // Set match outcome to 0 (in-progress) so we can test the live reporting flow
    const inProgressXml = xmlContent.replace('outcome="1"', 'outcome="0"');

    // 1. Ingest TDF via API
    const uploadRes = await fastify.inject({
      method: 'POST',
      url: '/api/tournaments/e2e-tourney/upload',
      headers: { 'content-type': 'text/plain' },
      body: inProgressXml
    });

    expect(uploadRes.statusCode).toBe(200);
    const uploadJson = uploadRes.json();
    expect(uploadJson.success).toBe(true);
    expect(uploadJson.tournament.data.name).toBe('Test tournament');

    // 2. Query player active match by POP ID (Ash Ketchum: 987654321)
    const matchRes = await fastify.inject({
      method: 'GET',
      url: '/api/tournaments/e2e-tourney/matches/active?popId=987654321'
    });

    expect(matchRes.statusCode).toBe(200);
    const match = matchRes.json();
    expect(match.tableNumber).toBe(1);
    expect(match.roundNumber).toBe(1);
    expect(match.player.fullName).toBe('Ash Ketchum');
    expect(match.opponent.fullName).toBe('Gary Oak');
    expect(match.opponent.userid).toBe('876543219');
    expect(match.status).toBe('IN_PROGRESS');

    // 3. Player 1 (Ash) reports win
    const report1Res = await fastify.inject({
      method: 'POST',
      url: `/api/tournaments/e2e-tourney/matches/${match.matchId}/report`,
      payload: {
        reportingPlayerId: '987654321',
        winnerId: '987654321',
        isTie: false
      }
    });

    expect(report1Res.statusCode).toBe(200);
    expect(report1Res.json().status).toBe('PENDING_CONFIRMATION');

    // 4. Verify judge queue shows the pending report
    const queueRes = await fastify.inject({
      method: 'GET',
      url: '/api/tournaments/e2e-tourney/reports/queue'
    });

    expect(queueRes.statusCode).toBe(200);
    const queue = queueRes.json();
    expect(queue.length).toBe(1);
    expect(queue[0].table_number).toBe(1);
    expect(queue[0].status).toBe('PENDING_CONFIRMATION');

    // 5. Player 2 (Gary) confirms Ash won
    const report2Res = await fastify.inject({
      method: 'POST',
      url: `/api/tournaments/e2e-tourney/matches/${match.matchId}/report`,
      payload: {
        reportingPlayerId: '876543219',
        winnerId: '987654321',
        isTie: false
      }
    });

    expect(report2Res.statusCode).toBe(200);
    expect(report2Res.json().status).toBe('CONFIRMED');
    expect(report2Res.json().confirmedWinnerId).toBe('987654321');

    // 6. Check standings
    const standingsRes = await fastify.inject({
      method: 'GET',
      url: '/api/tournaments/e2e-tourney/standings'
    });

    expect(standingsRes.statusCode).toBe(200);
    const standings = standingsRes.json();
    expect(standings.length).toBe(2);
    expect(standings[0].place).toBe(1);
    expect(standings[0].player.fullName).toBe('Ash Ketchum');
  });
});
