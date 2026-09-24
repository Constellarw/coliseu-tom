import { type FastifyInstance } from 'fastify';
import { DatabaseService } from './db/database.js';
import { TournamentService } from './services/tournament.service.js';
import { MatchReportService } from './services/match-report.service.js';
import { AuthService } from './services/auth.service.js';
import { ProfileService } from './services/profile.service.js';
export interface ServerInstance {
    fastify: FastifyInstance;
    tourneyService: TournamentService;
    reportService: MatchReportService;
    dbService: DatabaseService;
    authService: AuthService;
    profileService: ProfileService;
}
export declare function buildServer(dbPath?: string): ServerInstance;
export declare function startServer(): Promise<FastifyInstance>;
export default function handler(req: any, res: any): Promise<void>;
//# sourceMappingURL=index.d.ts.map