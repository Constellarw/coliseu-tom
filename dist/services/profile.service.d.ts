import { DatabaseService } from '../db/database.js';
export interface PlayerStats {
    popId: string;
    totalTournaments: number;
    totalMatches: number;
    wins: number;
    ties: number;
    losses: number;
    winRate: number;
    bestPlace: number | null;
    firstPlaceCount: number;
}
export interface PlayerTournamentMatch {
    matchId: string;
    roundNumber: number;
    tableNumber: number;
    opponentName: string;
    opponentPopId: string;
    status: string;
    result: 'VITÓRIA' | 'DERROTA' | 'EMPATE' | 'EM_ANDAMENTO';
}
export interface PlayerTournamentHistoryItem {
    tournamentId: string;
    tournamentName: string;
    startDate: string;
    city: string;
    place: number | null;
    totalPlayers: number;
    wins: number;
    ties: number;
    losses: number;
    matches: PlayerTournamentMatch[];
}
export declare class ProfileService {
    private dbService;
    constructor(dbService: DatabaseService);
    getPlayerStats(popId: string): Promise<PlayerStats>;
    getTournamentHistory(popId: string): Promise<PlayerTournamentHistoryItem[]>;
}
//# sourceMappingURL=profile.service.d.ts.map