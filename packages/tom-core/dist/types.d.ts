export type AgeCategoryCode = '0' | '1' | '2' | '8' | '9' | '10';
export declare const AgeCategoryNames: Record<string, string>;
export type MatchOutcomeCode = '0' | '1' | '2' | '3' | '10';
export declare enum MatchOutcome {
    IN_PROGRESS = "0",
    WIN_PLAYER_1 = "1",
    WIN_PLAYER_2 = "2",
    TIE = "3",
    DOUBLE_LOSS = "10"
}
export declare const MatchOutcomeDescriptions: Record<string, string>;
export interface TournamentMetadata {
    name: string;
    id?: string;
    city?: string;
    state?: string;
    country?: string;
    roundTimeMinutes: number;
    finalsRoundTimeMinutes: number;
    organizerPopId: string;
    organizerName: string;
    startDate: string;
}
export interface TomPlayer {
    userid: string;
    firstName: string;
    lastName: string;
    fullName: string;
    birthDate?: string;
    starter?: boolean;
}
export interface TomMatch {
    tableNumber: number;
    player1Id: string;
    player2Id: string;
    outcome: MatchOutcomeCode;
    outcomeDescription: string;
    timestamp?: string;
}
export interface TomRound {
    number: number;
    type?: string;
    stage?: string;
    timeLeftSeconds?: number;
    pairTime?: string;
    startTime?: string;
    matches: TomMatch[];
}
export interface TomPod {
    category: string;
    categoryName: string;
    stage?: string;
    startingTable?: number;
    rounds: TomRound[];
}
export interface TomPodStanding {
    category: string;
    categoryName: string;
    type: string;
    rankings: Array<{
        playerId: string;
        place: number;
    }>;
}
export interface TournamentData {
    version: string;
    gametype: string;
    mode: string;
    data: TournamentMetadata;
    players: Record<string, TomPlayer>;
    pods: TomPod[];
    standings: TomPodStanding[];
}
export interface RegisteredPlayer {
    playerId: string;
    fullName: string;
    birthYear?: string;
}
export interface TournamentConfig {
    organizerName: string;
    organizerPopId: string;
    tournamentName?: string;
    city?: string;
    country?: string;
    startDate?: string;
}
//# sourceMappingURL=types.d.ts.map