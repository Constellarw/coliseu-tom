import { DatabaseService } from '../db/database.js';
export interface ReportResultParams {
    matchId: string;
    reportingPlayerId: string;
    winnerId: string | null;
    isTie: boolean;
}
export interface JudgeOverrideParams {
    matchId: string;
    winnerId: string | null;
    isTie: boolean;
}
export interface MatchReportResult {
    matchId: string;
    status: 'IN_PROGRESS' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DISPUTED';
    p1ReportedWinner: string | null;
    p2ReportedWinner: string | null;
    confirmedWinnerId: string | null;
    isTie: boolean;
    tomOutcome: string;
}
export declare class MatchReportService {
    private dbService;
    constructor(dbService: DatabaseService);
    reportResult(params: ReportResultParams): Promise<MatchReportResult>;
    judgeOverride(params: JudgeOverrideParams): Promise<MatchReportResult>;
    getReportQueue(tournamentId: string): Promise<any[]>;
}
//# sourceMappingURL=match-report.service.d.ts.map