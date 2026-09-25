import React, { useState } from 'react';
import {
  Swords,
  Trophy,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  LogOut,
  ShieldCheck,
  User,
  ArrowRight,
  Eye,
  Award
} from 'lucide-react';
import { ColiseuIcon } from './ColiseuIcon';
import { UserRecord } from '../types/auth';

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
  user: UserRecord | null;
  onOpenGoogleLogin: () => void;
  onOpenBindModal: () => void;
  onOpenProfile: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  popId,
  setPopId,
  activeMatch,
  pairings,
  standings,
  onReportMatch,
  isLoading,
  user,
  onOpenGoogleLogin,
  onOpenBindModal,
  onOpenProfile
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'pairings' | 'standings'>('match');
  const [viewingAsGuest, setViewingAsGuest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // 1. Not logged in and not in guest mode
  if (!user && !viewingAsGuest) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-[#121216] rounded-2xl border border-zinc-800 shadow-2xl text-center animate-fadeIn">
        <div className="flex justify-center mb-4">
          <img
            src="/logo_coliseu_web.png"
            alt="Coliseu TCG"
            className="h-16 w-auto object-contain drop-shadow-[0_4px_16px_rgba(220,38,38,0.25)]"
          />
        </div>
        <h2 className="text-xl font-black text-white mb-1 tracking-tight">
          Coliseu Arena
        </h2>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Entre com sua conta Google para acompanhar sua mesa em tempo real, consultar seu histórico oficial e reportar resultados com proteção de identidade.
        </p>

        <div className="space-y-3">
          <button
            onClick={onOpenGoogleLogin}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 active:scale-98 flex items-center justify-center space-x-2 text-sm"
          >
            <User className="w-4 h-4" />
            <span>Entrar com o Google</span>
          </button>

          <button
            onClick={() => {
              setViewingAsGuest(true);
              setActiveTab('pairings');
            }}
            className="w-full py-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl transition-colors border border-zinc-800 flex items-center justify-center space-x-2 text-xs"
          >
            <Eye className="w-4 h-4 text-zinc-400" />
            <span>Consultar Mesas e Tabela (Visitante)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Logged in but has not bound their POP ID yet
  if (user && !user.pop_id && !viewingAsGuest) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-[#121216] rounded-2xl border border-zinc-800 shadow-2xl text-center animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-white mb-1 tracking-tight">
          Vincular POP ID Oficial
        </h2>
        <p className="text-xs text-zinc-300 mb-1">
          Olá, <strong className="text-white">{user.name}</strong>!
        </p>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Para garantir que ninguém reporte partidas no seu lugar, vincule seu POP ID registrado no torneio.
        </p>

        <div className="space-y-3">
          <button
            onClick={onOpenBindModal}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 active:scale-98 flex items-center justify-center space-x-2 text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Vincular Meu POP ID Agora</span>
          </button>

          <button
            onClick={() => {
              setViewingAsGuest(true);
              setActiveTab('pairings');
            }}
            className="w-full py-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors text-xs"
          >
            Apenas consultar mesas por enquanto
          </button>
        </div>
      </div>
    );
  }

  const filteredPairings = pairings.filter((p) => {
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
    if (!user) {
      onOpenGoogleLogin();
      return;
    }
    if (!user.pop_id) {
      onOpenBindModal();
      return;
    }

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
      {/* Guest Mode Notice */}
      {(!user || !user.pop_id) && viewingAsGuest && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Você está no <strong>Modo Visitante</strong>. Para ver sua mesa e reportar, entre com seu perfil oficial.</span>
          </div>
          <button
            onClick={user ? onOpenBindModal : onOpenGoogleLogin}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] whitespace-nowrap ml-2"
          >
            {user ? 'Vincular ID' : 'Fazer Login'}
          </button>
        </div>
      )}

      {/* Authenticated Player Status Bar */}
      {user && user.pop_id && (
        <div className="bg-[#121216] border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400">Gladiador:</span>
                <span className="text-sm font-bold text-white">
                  {user.name}
                </span>
                <span className="text-xs text-red-400 font-mono">({user.pop_id})</span>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenProfile}
            className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Meu Histórico</span>
          </button>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="grid grid-cols-3 gap-2 bg-[#121216] p-1 rounded-xl border border-zinc-800 shadow-sm">
        <button
          onClick={() => setActiveTab('match')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'match'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Minha Mesa</span>
        </button>
        <button
          onClick={() => setActiveTab('pairings')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pairings'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mesas ({pairings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'standings'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Classificação</span>
        </button>
      </div>

      {/* Tab 1: Active Match */}
      {activeTab === 'match' && (
        <div className="space-y-4">
          {!user || !user.pop_id ? (
            <div className="bg-[#121216] border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
              <Swords className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Visualização de Mesa Bloqueada</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Para carregar a sua mesa e rodada atual automaticamente, autentique-se e vincule seu POP ID oficial.
              </p>
              <button
                onClick={user ? onOpenBindModal : onOpenGoogleLogin}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs"
              >
                {user ? 'Vincular POP ID' : 'Fazer Login com Google'}
              </button>
            </div>
          ) : activeMatch ? (
            <div className="bg-gradient-to-b from-[#16161C] to-[#0D0D10] border border-red-950/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Highlight table header */}
              <div className="flex items-center justify-between mb-6">
                <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-1.5 rounded-full text-lg font-black tracking-wider shadow-lg shadow-red-600/30">
                  MESA {activeMatch.tableNumber}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  Rodada {activeMatch.roundNumber}
                </span>
              </div>

              {/* Matchup Duel display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {/* Player 1 (You) */}
                <div className="bg-[#121216] p-4 rounded-xl border border-red-900/40 relative">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block mb-1">
                    Você
                  </span>
                  <p className="text-lg font-black text-white">{activeMatch.player.fullName}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">POP ID: {activeMatch.player.userid}</p>
                </div>

                {/* Opponent */}
                <div className="bg-[#121216] p-4 rounded-xl border border-zinc-800 relative">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
                    Oponente
                  </span>
                  {activeMatch.opponent ? (
                    <>
                      <p className="text-lg font-black text-white">{activeMatch.opponent.fullName}</p>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">POP ID: {activeMatch.opponent.userid}</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-amber-400 italic">BYE (Vitória Automática)</p>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="border-t border-zinc-800 pt-4">
                {activeMatch.status === 'CONFIRMED' ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">Resultado Oficial Confirmado</h4>
                      <p className="text-xs text-zinc-300">
                        {activeMatch.isTie
                          ? 'Empate validado com sucesso.'
                          : activeMatch.confirmedWinnerId === popId
                          ? 'Parabéns, sua vitória foi registrada!'
                          : 'Derrota confirmada.'}
                      </p>
                    </div>
                  </div>
                ) : activeMatch.status === 'PENDING_CONFIRMATION' ? (
                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">Aguardando Confirmação</h4>
                        <p className="text-xs text-zinc-300">
                          Um jogador reportou o resultado. O oponente precisa confirmar na arena.
                        </p>
                      </div>
                    </div>
                    {/* Confirm Button for Opponent */}
                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-amber-600/20"
                    >
                      Confirmar ou Ajustar Resultado
                    </button>
                  </div>
                ) : activeMatch.status === 'DISPUTED' ? (
                  <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-4 flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-bounce" />
                    <div>
                      <h4 className="text-sm font-bold text-red-300">Conflito de Reports!</h4>
                      <p className="text-xs text-zinc-300">
                        Os reports divergiram. Chame o <strong>Juiz do torneio</strong> na mesa {activeMatch.tableNumber}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-red-600/30 active:scale-98 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reportar Resultado da Partida</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#121216] border border-zinc-800 rounded-2xl p-8 text-center">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Nenhuma mesa ativa no momento</h3>
              <p className="text-xs text-zinc-400">
                Aguarde o Juiz iniciar ou publicar a próxima rodada do torneio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pairings */}
      {activeTab === 'pairings' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por mesa, jogador ou POP ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#121216] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="space-y-2">
            {filteredPairings.length === 0 ? (
              <p className="text-center py-8 text-xs text-zinc-500">Nenhum emparceiramento encontrado.</p>
            ) : (
              filteredPairings.map((p) => {
                const isMyTable =
                  popId && (p.player1?.userid === popId || p.player2?.userid === popId);
                return (
                  <div
                    key={p.matchId}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isMyTable
                        ? 'bg-red-950/20 border-red-600/60 shadow-md shadow-red-950/30'
                        : 'bg-[#121216] border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-red-500 text-xs">
                        M{p.tableNumber}
                      </span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{p.player1?.fullName || 'BYE'}</span>
                          <span className="text-zinc-500 font-normal">vs</span>
                          <span>{p.player2?.fullName || 'BYE'}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {p.player1 ? `${p.player1.userid}` : '-'} &bull; {p.player2 ? `${p.player2.userid}` : '-'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {p.status === 'CONFIRMED' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                          Finalizada
                        </span>
                      ) : p.status === 'DISPUTED' ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px]">
                          Conflito
                        </span>
                      ) : p.status === 'PENDING_CONFIRMATION' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                          Pendente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold text-[10px]">
                          Em Jogo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Standings */}
      {activeTab === 'standings' && (
        <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Classificação Geral
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">{standings.length} jogadores</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {standings.map((s) => (
              <div
                key={`${s.category}_${s.player.userid}`}
                className="px-4 py-3 flex items-center justify-between hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      s.place === 1
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                        : s.place === 2
                        ? 'bg-zinc-600 text-white'
                        : s.place === 3
                        ? 'bg-zinc-700 text-zinc-200'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {s.place}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{s.player.fullName}</p>
                    <p className="text-xs text-zinc-400 font-mono">POP ID: {s.player.userid}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Result Modal */}
      {reportModalOpen && activeMatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-center mb-1">
              <ColiseuIcon size={44} />
            </div>
            <h3 className="text-lg font-black text-white text-center">Reportar Mesa {activeMatch.tableNumber}</h3>
            <p className="text-xs text-zinc-400 text-center">
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
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-sm transition-all border border-zinc-800"
              >
                Empate
              </button>
            </div>

            <button
              onClick={() => setReportModalOpen(false)}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white font-semibold text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
