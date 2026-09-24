import Fastify from 'fastify';
import { DatabaseService } from './db/database.js';
import { TournamentService } from './services/tournament.service.js';
import { MatchReportService } from './services/match-report.service.js';
import { AuthService } from './services/auth.service.js';
import { ProfileService } from './services/profile.service.js';
export declare function buildServer(dbPath?: string): {
    fastify: Fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault> & PromiseLike<Fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault>>;
    tourneyService: TournamentService;
    reportService: MatchReportService;
    dbService: DatabaseService;
    authService: AuthService;
    profileService: ProfileService;
};
export declare function startServer(): Promise<Fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault>>;
//# sourceMappingURL=index.d.ts.map