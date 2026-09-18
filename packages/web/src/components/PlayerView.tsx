import React, { useState } from 'react';
import { Swords, Trophy, Users, CheckCircle2, AlertTriangle, Clock, Search, LogOut } from 'lucide-react';
import { ColiseuIcon } from './ColiseuIcon';

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
      <div className="max-w-md mx-auto mt-8 p-6 bg-[#101726] rounded-2xl border border-amber-900/30 shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <ColiseuIcon size={56} />
        </div>
        <h2 className="text-xl font-black text-white mb-1 tracking-tight">
          Arena Coliseu TCG
        </h2>
        <p className="text-xs text-amber-200/70 mb-6">
          Informe seu POP ID (Pokémon Player ID) para entrar na arena, acompanhar sua mesa e reportar resultados.
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
            className="w-full px-4 py-3 bg-[#090D16] border border-amber-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-lg font-mono tracking-wider"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputPopId.trim()}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-98"
          >
            Entrar na Arena
          </button>
        </form>

        {pairings.length > 0 && (
          <div className="mt-8 text-left border-t border-slate-800 pt-4">
            <span className="text-[11px] text-amber-400/80 uppercase font-bold tracking-wider">
              Ou escolha seu nome na lista da rodada:
            </span>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {pairings.flatMap(p => [p.player1, p.player2]).filter(Boolean).map((p: any) => (
                <button
                  key={p.userid}
                  onClick={() => setPopId(p.userid)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 flex justify-between items-center transition-colors border border-slate-800/80"
                >
                  <span className="font-semibold text-white">{p.fullName}</span>
                  <span className="font-mono text-amber-400">{p.userid}</span>
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
      <div className="bg-[#101726] border border-amber-900/30 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-slate-400">Gladiador:</span>
          <span className="text-sm font-bold text-white">
            {activeMatch?.player.fullName || `ID: ${popId}`}
          </span>
          <span className="text-xs text-amber-400/90 font-mono">({popId})</span>
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
      <div className="grid grid-cols-3 gap-2 bg-[#101726] p-1 rounded-xl border border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveTab('match')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'match'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Minha Mesa</span>
        </button>
        <button
          onClick={() => setActiveTab('pairings')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pairings'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mesas ({pairings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'standings'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Classificação</span>
        </button>
      </div>

      {/* Tab 1: Active Match */}
      {activeTab === 'match' && (
        <div className="space-y-4">
          {activeMatch ? (
            <div className="bg-gradient-to-b from-[#101726] to-[#090D16] border border-amber-900/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Highlight table header */}
              <div className="flex items-center justify-between mb-6">
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-5 py-1.5 rounded-full text-lg font-black tracking-wider shadow-lg shadow-amber-500/20">
                  MESA {activeMatch.tableNumber}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80 flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Rodada {activeMatch.roundNumber}
                </span>
              </div>

              {/* Matchup view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {/* You */}
                <div className="bg-[#141d30] p-4 rounded-xl border border-amber-500/20 flex items-center space-x-3 shadow">
                  <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    VOCÊ
                  </div>
                  <div>
                    <p className="font-bold text-base text-white">{activeMatch.player.fullName}</p>
                    <p className="text-xs text-amber-400 font-mono">POP ID: {activeMatch.player.userid}</p>
                  </div>
                </div>

                {/* Opponent */}
                <div className="bg-[#141d30] p-4 rounded-xl border border-red-900/30 flex items-center space-x-3 shadow">
                  <div className="w-11 h-11 rounded-full bg-red-700 text-white font-black text-xs flex items-center justify-center shadow-md">
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
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                    <p className="text-sm text-amber-300 font-medium">
                      Duelo na Arena em andamento! Ao finalizar, registre o resultado abaixo.
                    </p>
                  </div>
                )}
                {activeMatch.status === 'PENDING_CONFIRMATION' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    <p className="text-sm text-yellow-300 font-medium">
                      Resultado enviado. Aguardando confirmação do seu oponente.
                    </p>
                  </div>
                )}
                {activeMatch.status === 'CONFIRMED' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-green-300 font-bold">
                      Resultado oficial confirmado!{' '}
                      {activeMatch.isTie
                        ? 'Empate'
                        : activeMatch.confirmedWinnerId === activeMatch.player.userid
                        ? 'Vitória sua!'
                        : 'Vitória do Oponente'}
                    </p>
                  </div>
                )}
                {activeMatch.status === 'DISPUTED' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                    <p className="text-sm text-red-300 font-bold">
                      Divergência nos reports! Por favor, chame o Juiz da Coliseu à mesa {activeMatch.tableNumber}.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {activeMatch.status !== 'CONFIRMED' && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-xl text-base transition-all shadow-xl shadow-amber-500/25 active:scale-98"
                >
                  Reportar Vencedor da Partida
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#101726] border border-slate-800 rounded-2xl p-8 text-center">
              <Clock className="w-10 h-10 text-amber-500/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Aguardando Pareamento</h3>
              <p className="text-sm text-slate-400">
                Aguarde o organizador da Coliseu TCG gerar a próxima rodada no TOM. A tela atualizará automaticamente.
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
              className="w-full pl-10 pr-4 py-2 bg-[#101726] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            {filteredPairings.map((p) => (
              <div
                key={p.matchId}
                className="bg-[#101726] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-amber-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm shadow">
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
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                      Concluído
                    </span>
                  ) : p.status === 'DISPUTED' ? (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                      Disputa
                    </span>
                  ) : p.status === 'PENDING_CONFIRMATION' ? (
                    <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                      Pendente
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium">
                      Em duelo
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
        <div className="bg-[#101726] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Classificação Coliseu TCG
            </h3>
            <span className="text-xs text-amber-400/80 font-mono font-bold">{standings.length} Jogadores</span>
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
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : s.place === 2
                        ? 'bg-slate-300 text-slate-950'
                        : s.place === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
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
          <div className="bg-[#101726] border border-amber-900/40 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-center mb-1">
              <ColiseuIcon size={44} />
            </div>
            <h3 className="text-lg font-black text-white text-center">Reportar Mesa {activeMatch.tableNumber}</h3>
            <p className="text-xs text-amber-200/70 text-center">
              Selecione o vencedor da partida. Seu oponente receberá a notificação para confirmar na arena.
            </p>

            <div className="space-y-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleReport(activeMatch.player.userid, false)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98"
              >
                Eu Venci ({activeMatch.player.fullName})
              </button>

              {activeMatch.opponent && (
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReport(activeMatch.opponent!.userid, false)}
                  className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98"
                >
                  Oponente Venceu ({activeMatch.opponent.fullName})
                </button>
              )}

              <button
                disabled={isSubmitting}
                onClick={() => handleReport(null, true)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-sm transition-all border border-amber-900/40"
              >
                Empate (Tie)
              </button>
            </div>

            <button
              onClick={() => setReportModalOpen(false)}
              className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
