import React, { useState } from 'react';
import { Swords, Trophy, Users, CheckCircle2, AlertTriangle, Clock, Search, LogOut } from 'lucide-react';

interface PlayerMatchView {
  matchId: string;
  tournamentId: string;
  roundNumber: number;
  tableNumber: number;
  isPlayer1: boolean;
  player: { userid: string; fullName: string; firstName: string; lastName: string };
  opponent: { userid: string; fullName: string; firstName: string; lastName: string } | null;
  status: string;
  p1ReportedWinner: string | null;
  p2ReportedWinner: string | null;
  confirmedWinnerId: string | null;
  isTie: boolean;
  tomOutcome: string;
}

interface PairingView {
  matchId: string;
  roundNumber: number;
  tableNumber: number;
  category: string;
  player1: { userid: string; fullName: string } | null;
  player2: { userid: string; fullName: string } | null;
  status: string;
  confirmedWinnerId: string | null;
  isTie: boolean;
  tomOutcome: string;
}

interface StandingView {
  place: number;
  category: string;
  player: { userid: string; fullName: string };
}

interface PlayerViewProps {
  popId: string;
  setPopId: (id: string) => void;
  activeMatch: PlayerMatchView | null;
  pairings: PairingView[];
  standings: StandingView[];
  onReportMatch: (winnerId: string | null, isTie: boolean) => Promise<void>;
  isLoading: boolean;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  popId,
  setPopId,
  activeMatch,
  pairings,
  standings,
  onReportMatch,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'pairings' | 'standings'>('match');
  const [inputPopId, setInputPopId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // If player hasn't entered their POP ID yet
  if (!popId) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl text-center">
        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
          <Swords className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Identificação do Jogador</h2>
        <p className="text-sm text-slate-400 mb-6">
          Digite seu Pokémon Player ID (POP ID) para ver sua mesa, adversário e reportar resultados.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputPopId.trim()) setPopId(inputPopId.trim());
          }}
          className="space-y-4"
        >
          <input
            type="text"
            value={inputPopId}
            onChange={(e) => setInputPopId(e.target.value)}
            placeholder="Ex: 987654321"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-wider"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputPopId.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25"
          >
            Acompanhar Torneio
          </button>
        </form>

        {pairings.length > 0 && (
          <div className="mt-8 text-left border-t border-slate-800 pt-4">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              Ou selecione seu nome na rodada atual:
            </span>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {pairings.flatMap(p => [p.player1, p.player2]).filter(Boolean).map((p: any) => (
                <button
                  key={p.userid}
                  onClick={() => setPopId(p.userid)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex justify-between items-center transition-colors"
                >
                  <span className="font-medium text-white">{p.fullName}</span>
                  <span className="font-mono text-slate-400">{p.userid}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredPairings = pairings.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      String(p.tableNumber).includes(q) ||
      p.player1?.fullName.toLowerCase().includes(q) ||
      p.player2?.fullName.toLowerCase().includes(q) ||
      p.player1?.userid.includes(q) ||
      p.player2?.userid.includes(q)
    );
  });

  const handleReport = async (winnerId: string | null, isTie: boolean) => {
    try {
      setIsSubmitting(true);
      await onReportMatch(winnerId, isTie);
      setReportModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Player header bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-400">Jogador:</span>
          <span className="text-sm font-semibold text-white">
            {activeMatch?.player.fullName || `ID: ${popId}`}
          </span>
          <span className="text-xs text-slate-500 font-mono">({popId})</span>
        </div>
        <button
          onClick={() => setPopId('')}
          className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Trocar</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('match')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'match'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Minha Mesa</span>
        </button>
        <button
          onClick={() => setActiveTab('pairings')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pairings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mesas ({pairings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'standings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Tabela</span>
        </button>
      </div>

      {/* Tab 1: Active Match */}
      {activeTab === 'match' && (
        <div className="space-y-4">
          {activeMatch ? (
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Highlight table header */}
              <div className="flex items-center justify-between mb-6">
                <span className="bg-yellow-400 text-slate-950 px-4 py-1.5 rounded-full text-base font-black tracking-wide shadow-md">
                  MESA {activeMatch.tableNumber}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Rodada {activeMatch.roundNumber}
                </span>
              </div>

              {/* Matchup view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {/* You */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow">
                    VOCÊ
                  </div>
                  <div>
                    <p className="font-bold text-base text-white">{activeMatch.player.fullName}</p>
                    <p className="text-xs text-slate-400 font-mono">POP ID: {activeMatch.player.userid}</p>
                  </div>
                </div>

                {/* Opponent */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white shadow">
                    VS
                  </div>
                  <div>
                    <p className="font-bold text-base text-white">
                      {activeMatch.opponent ? activeMatch.opponent.fullName : 'BYE (Sem oponente)'}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {activeMatch.opponent ? `POP ID: ${activeMatch.opponent.userid}` : 'Vitória automática'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Alert */}
              <div className="mb-6">
                {activeMatch.status === 'IN_PROGRESS' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
                    <p className="text-sm text-blue-400 font-medium">
                      Partida em andamento. Ao finalizar, reporte o resultado abaixo.
                    </p>
                  </div>
                )}
                {activeMatch.status === 'PENDING_CONFIRMATION' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    <p className="text-sm text-yellow-300 font-medium">
                      Resultado reportado. Aguardando a confirmação do seu oponente.
                    </p>
                  </div>
                )}
                {activeMatch.status === 'CONFIRMED' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-green-300 font-semibold">
                      Resultado confirmado!{' '}
                      {activeMatch.isTie
                        ? 'Empate'
                        : activeMatch.confirmedWinnerId === activeMatch.player.userid
                        ? 'Você Venceu!'
                        : 'Vitória do Oponente'}
                    </p>
                  </div>
                )}
                {activeMatch.status === 'DISPUTED' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                    <p className="text-sm text-red-300 font-semibold">
                      Conflito de resultados reportados! Por favor, chame um juiz à mesa {activeMatch.tableNumber}.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {activeMatch.status !== 'CONFIRMED' && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-base transition-all shadow-lg shadow-yellow-400/20 active:scale-[0.99]"
                >
                  Reportar Vencedor da Partida
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Nenhuma mesa ativa no momento</h3>
              <p className="text-sm text-slate-400">
                Aguarde o organizador gerar a próxima rodada no TOM. A tela atualizará automaticamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Pairings */}
      {activeTab === 'pairings' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mesa ou nome do jogador..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            {filteredPairings.map((p) => (
              <div
                key={p.matchId}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-yellow-400 text-sm">
                    {p.tableNumber}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {p.player1?.fullName || 'TBD'}{' '}
                      <span className="text-slate-500 font-normal">vs</span>{' '}
                      {p.player2?.fullName || 'BYE'}
                    </p>
                    <p className="text-xs text-slate-400">Rodada {p.roundNumber}</p>
                  </div>
                </div>
                <div>
                  {p.status === 'CONFIRMED' ? (
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                      Concluído
                    </span>
                  ) : p.status === 'DISPUTED' ? (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                      Disputa
                    </span>
                  ) : p.status === 'PENDING_CONFIRMATION' ? (
                    <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                      Pendente
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium">
                      Jogando
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Standings */}
      {activeTab === 'standings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Classificação do Torneio
            </h3>
            <span className="text-xs text-slate-400">{standings.length} Jogadores</span>
          </div>

          <div className="divide-y divide-slate-800">
            {standings.map((s) => (
              <div
                key={`${s.category}_${s.player.userid}`}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      s.place === 1
                        ? 'bg-yellow-400 text-black'
                        : s.place === 2
                        ? 'bg-slate-300 text-black'
                        : s.place === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.place}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{s.player.fullName}</p>
                    <p className="text-xs text-slate-400 font-mono">POP ID: {s.player.userid}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Result Modal */}
      {reportModalOpen && activeMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white text-center">Reportar Mesa {activeMatch.tableNumber}</h3>
            <p className="text-xs text-slate-400 text-center">
              Selecione o vencedor da partida. Seu oponente receberá a notificação para confirmar.
            </p>

            <div className="space-y-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleReport(activeMatch.player.userid, false)}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98"
              >
                Eu Venci ({activeMatch.player.fullName})
              </button>

              {activeMatch.opponent && (
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReport(activeMatch.opponent!.userid, false)}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98"
                >
                  Oponente Venceu ({activeMatch.opponent.fullName})
                </button>
              )}

              <button
                disabled={isSubmitting}
                onClick={() => handleReport(null, true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all border border-slate-700"
              >
                Empate (Tie)
              </button>
            </div>

            <button
              onClick={() => setReportModalOpen(false)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 font-semibold text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
