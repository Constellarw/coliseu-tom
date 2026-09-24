import { TournamentData, TomPlayer } from '@tom/core';
import { DatabaseService } from '../db/database.js';
export interface PlayerActiveMatchView {
    matchId: string;
    tournamentId: string;
    roundNumber: number;
    tableNumber: number;
    isPlayer1: boolean;
    player: TomPlayer;
    opponent: TomPlayer | null;
    status: string;
    p1ReportedWinner: string | null;
    p2ReportedWinner: string | null;
    confirmedWinnerId: string | null;
    isTie: boolean;
    tomOutcome: string;
}
export interface PairingView {
    matchId: string;
    roundNumber: number;
    tableNumber: number;
    category: string;
    player1: TomPlayer | null;
    player2: TomPlayer | null;
    status: string;
    confirmedWinnerId: string | null;
    isTie: boolean;
    tomOutcome: string;
}
export declare class TournamentService {
    private dbService;
    constructor(dbService: DatabaseService);
    ingestTdf(tournamentId: string, rawXml: string): Promise<TournamentData>;
    getPlayerActiveMatch(tournamentId: string, popId: string): Promise<PlayerActiveMatchView | null>;
    getStandings(tournamentId: string, category?: string): Promise<Array<{
        place: number;
        player: TomPlayer;
        category: string;
    }>>;
    getRoundPairings(tournamentId: string, roundNumber?: number): Promise<PairingView[]>;
}
//# sourceMappingURL=tournament.service.d.ts.map