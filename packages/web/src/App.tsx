import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PlayerView } from './components/PlayerView';
import { AdminView } from './components/AdminView';

export const App: React.FC = () => {
  const [tournamentId, setTournamentId] = useState<string>('tourney-1');
  const [viewMode, setViewMode] = useState<'player' | 'admin'>('player');
  const [popId, setPopIdState] = useState<string>(() => {
    return localStorage.getItem('poketom_popId') || '';
  });

  const [tournamentName, setTournamentName] = useState<string>('Coliseu TCG • Torneio Pokémon');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [pairings, setPairings] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [reportsQueue, setReportsQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const setPopId = (id: string) => {
    setPopIdState(id);
    if (id) {
      localStorage.setItem('poketom_popId', id);
    } else {
      localStorage.removeItem('poketom_popId');
    }
  };

  const fetchAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch pairings
      const pairingsRes = await fetch(`/api/tournaments/${tournamentId}/pairings`);
      if (pairingsRes.ok) {
        const pairs = await pairingsRes.json();
        setPairings(pairs);
        if (pairs.length > 0) {
          setCurrentRound(pairs[0].roundNumber);
        }
      }

      // 2. Fetch standings
      const standingsRes = await fetch(`/api/tournaments/${tournamentId}/standings`);
      if (standingsRes.ok) {
        const std = await standingsRes.json();
        setStandings(std);
      }

      // 3. Fetch active match if player POP ID is set
      if (popId) {
        const matchRes = await fetch(`/api/tournaments/${tournamentId}/matches/active?popId=${encodeURIComponent(popId)}`);
        if (matchRes.ok) {
          const match = await matchRes.json();
          setActiveMatch(match);
        } else {
          setActiveMatch(null);
        }
      } else {
        setActiveMatch(null);
      }

      // 4. Fetch Judge reports queue
      const queueRes = await fetch(`/api/tournaments/${tournamentId}/reports/queue`);
      if (queueRes.ok) {
        const queue = await queueRes.json();
        setReportsQueue(queue);
      }
    } catch (err) {
      console.error('Error syncing tournament data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [tournamentId, popId]);

  // Initial fetch and WebSocket connection
  useEffect(() => {
    fetchAllData();

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/tournament/${tournamentId}`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = () => {
        fetchAllData();
      };
      socket.onerror = () => {
        // Fallback gracefully handled
      };
    } catch {
      // Ignored
    }

    // Auto-refresh fallback every 8 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 8000);

    return () => {
      clearInterval(interval);
      if (socket) socket.close();
    };
  }, [tournamentId, popId, fetchAllData]);

  // Handle player reporting
  const handleReportMatch = async (winnerId: string | null, isTie: boolean) => {
    if (!activeMatch) return;
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${activeMatch.matchId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportingPlayerId: popId,
        winnerId,
        isTie
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao reportar partida');
    }

    await fetchAllData();
  };

  // Handle judge override
  const handleJudgeOverride = async (matchId: string, winnerId: string | null, isTie: boolean) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId, isTie })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Erro: ${err.error}`);
      return;
    }

    await fetchAllData();
  };

  // Handle TDF upload
  const handleUploadTdf = async (rawXml: string) => {
    setIsUploading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: rawXml
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao processar TDF');
      }

      const body = await res.json();
      if (body.tournament?.data?.name) {
        setTournamentName(body.tournament.data.name);
      }
      await fetchAllData();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-amber-50 flex flex-col">
      <Header
        tournamentName={tournamentName}
        currentRound={currentRound}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={fetchAllData}
        isSyncing={isSyncing}
      />

      <main className="flex-1 p-4 md:p-6 pb-20">
        {viewMode === 'player' ? (
          <PlayerView
            popId={popId}
            setPopId={setPopId}
            activeMatch={activeMatch}
            pairings={pairings}
            standings={standings}
            onReportMatch={handleReportMatch}
            isLoading={isSyncing}
          />
        ) : (
          <AdminView
            tournamentId={tournamentId}
            reportsQueue={reportsQueue}
            onUploadTdf={handleUploadTdf}
            onJudgeOverride={handleJudgeOverride}
            isUploading={isUploading}
          />
        )}
      </main>

      <footer className="py-4 border-t border-amber-900/20 text-center text-xs text-amber-400/60 flex items-center justify-center gap-2">
        <span className="font-bold text-amber-400">Arena Coliseu TCG</span>
        <span>&bull;</span>
        <span>Mogi Guaçu - SP</span>
        <span>&bull;</span>
        <span>Compatível com Pokémon Tournament Operations Manager (TOM)</span>
      </footer>
    </div>
  );
};
export default App;
