import { XMLParser } from 'fast-xml-parser';
import { MatchOutcomeDescriptions, AgeCategoryNames } from './types.js';
function ensureArray(item) {
    if (!item)
        return [];
    return Array.isArray(item) ? item : [item];
}
export function parseTdf(xmlContent) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        trimValues: true,
        parseAttributeValue: false,
        parseTagValue: false
    });
    const parsed = parser.parse(xmlContent);
    const tournament = parsed.tournament;
    if (!tournament) {
        throw new Error('Invalid TDF file: missing <tournament> root element');
    }
    const rawData = tournament.data || {};
    const metadata = {
        name: rawData.name || '',
        id: rawData.id || '',
        city: rawData.city || '',
        state: rawData.state || '',
        country: rawData.country || '',
        roundTimeMinutes: Number(rawData.roundtime || 0),
        finalsRoundTimeMinutes: Number(rawData.finalsroundtime || 0),
        organizerPopId: rawData.organizer?.['@_popid'] || '',
        organizerName: rawData.organizer?.['@_name'] || '',
        startDate: rawData.startdate || ''
    };
    // Parse players
    const players = {};
    const rawPlayers = ensureArray(tournament.players?.player);
    for (const p of rawPlayers) {
        const userid = String(p['@_userid'] || '').trim();
        if (!userid)
            continue;
        const firstName = String(p.firstname || '').trim();
        const lastName = String(p.lastname || '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        players[userid] = {
            userid,
            firstName,
            lastName,
            fullName,
            birthDate: p.birthdate ? String(p.birthdate).trim() : undefined,
            starter: p.starter === 'true' || p.starter === true
        };
    }
    // Parse pods (divisions)
    const pods = [];
    const rawPods = ensureArray(tournament.pods?.pod);
    for (const pod of rawPods) {
        const category = String(pod['@_category'] ?? '').trim();
        const categoryName = AgeCategoryNames[category] || `Category ${category}`;
        const stage = String(pod['@_stage'] ?? '').trim();
        const startingTable = pod.poddata?.startingtable ? Number(pod.poddata.startingtable) : undefined;
        const rounds = [];
        const rawRounds = ensureArray(pod.rounds?.round);
        for (const r of rawRounds) {
            const roundNum = Number(r['@_number'] || 0);
            const matches = [];
            const rawMatches = ensureArray(r.matches?.match);
            for (const m of rawMatches) {
                const tableNumber = Number(m.tablenumber || 0);
                const player1Id = String(m.player1?.['@_userid'] || '').trim();
                const player2Id = String(m.player2?.['@_userid'] || '').trim();
                const outcome = String(m['@_outcome'] ?? '0').trim();
                const outcomeDescription = MatchOutcomeDescriptions[outcome] || 'Unknown';
                matches.push({
                    tableNumber,
                    player1Id,
                    player2Id,
                    outcome,
                    outcomeDescription,
                    timestamp: m.timestamp ? String(m.timestamp).trim() : undefined
                });
            }
            rounds.push({
                number: roundNum,
                type: r['@_type'] ? String(r['@_type']) : undefined,
                stage: r['@_stage'] ? String(r['@_stage']) : undefined,
                timeLeftSeconds: r.timeleft ? Number(r.timeleft) : undefined,
                pairTime: r.pairtime ? String(r.pairtime).trim() : undefined,
                startTime: r.starttime ? String(r.starttime).trim() : undefined,
                matches
            });
        }
        pods.push({
            category,
            categoryName,
            stage,
            startingTable,
            rounds
        });
    }
    // Parse standings
    const standings = [];
    const rawStandingsPods = ensureArray(tournament.standings?.pod);
    for (const stPod of rawStandingsPods) {
        const category = String(stPod['@_category'] ?? '').trim();
        const categoryName = AgeCategoryNames[category] || `Category ${category}`;
        const type = String(stPod['@_type'] ?? '').trim();
        const rawStandingsPlayers = ensureArray(stPod.player);
        const rankings = rawStandingsPlayers.map((sp) => ({
            playerId: String(sp['@_id'] || '').trim(),
            place: Number(sp['@_place'] || 0)
        }));
        standings.push({
            category,
            categoryName,
            type,
            rankings
        });
    }
    return {
        version: String(tournament['@_version'] || ''),
        gametype: String(tournament['@_gametype'] || ''),
        mode: String(tournament['@_mode'] || ''),
        data: metadata,
        players,
        pods,
        standings
    };
}
//# sourceMappingURL=parser.js.map