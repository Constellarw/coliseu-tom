import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Swords,
  Percent,
  Calendar,
  ChevronDown,
  ChevronUp,
  LogOut,
  ShieldCheck,
  Award,
  RefreshCw,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { UserRecord, PlayerStats, PlayerTournamentHistoryItem } from '../types/auth';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord;
  token: string;
  onLogout: () => void;
  onOpenBindModal: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  token,
  onLogout,
  onOpenBindModal
}) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<PlayerTournamentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTourneyId, setExpandedTourneyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch stats
        const statsRes = await fetch('/api/users/profile/stats', { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch tournament history
        const historyRes = await fetch('/api/users/profile/tournaments', { headers });
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
          if (historyData.length > 0) {
            setExpandedTourneyId(historyData[0].tournamentId);
          }
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [isOpen, token, user.pop_id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center space-x-3.5">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover border border-red-500/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-lg shadow-md shadow-red-600/20">
                {user.name[0]?.toUpperCase() || 'P'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{user.name}</h3>
                {user.is_verified === 1 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" /> Verificado
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">{user.email}</p>
              {user.pop_id ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    POP ID: <strong className="text-white">{user.pop_id}</strong>
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBindModal();
                    }}
                    className="text-[10px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    title="Alterar POP ID"
                  >
                    <Edit2 className="w-2.5 h-2.5" /> Editar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBindModal();
                  }}
                  className="mt-1 text-[11px] text-red-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <ShieldCheck className="w-3 h-3" /> Vincular POP ID oficial agora
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-xl hover:bg-zinc-800 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-red-500" />
              Estatísticas do Jogador
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Torneios</div>
                <div className="text-xl font-black text-white mt-1">
                  {stats ? stats.totalTournaments : 0}
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Partidas</div>
                <div className="text-xl font-black text-white mt-1">
                  {stats ? stats.totalMatches : 0}
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">V - E - D</div>
                <div className="text-lg font-black text-white mt-1">
                  <span className="text-emerald-400">{stats ? stats.wins : 0}</span>-
                  <span className="text-amber-400">{stats ? stats.ties : 0}</span>-
                  <span className="text-red-400">{stats ? stats.losses : 0}</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Win Rate</div>
                <div className="text-xl font-black text-red-500 mt-1">
                  {stats ? `${stats.winRate}%` : '0%'}
                </div>
              </div>
            </div>
          </div>

          {/* Tournament History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Histórico de Torneios
              </h4>
              <span className="text-[11px] text-zinc-500">
                {history.length} {history.length === 1 ? 'torneio registrado' : 'torneios registrados'}
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                <span>Carregando histórico oficial...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl p-6 bg-zinc-900/20">
                <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Nenhum histórico encontrado para este POP ID.</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Assim que você jogar partidas na arena ou seus torneios passados forem importados, eles aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((tourney) => {
                  const isExpanded = expandedTourneyId === tourney.tournamentId;
                  return (
                    <div
                      key={tourney.tournamentId}
                      className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60"
                    >
                      {/* Tournament card header */}
                      <button
                        onClick={() =>
                          setExpandedTourneyId(isExpanded ? null : tourney.tournamentId)
                        }
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {tourney.tournamentName}
                            </span>
                            {tourney.place && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                tourney.place === 1
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : tourney.place <= 4
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}>
                                {tourney.place}º Lugar
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                            {tourney.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                {tourney.startDate}
                              </span>
                            )}
                            {tourney.city && <span>&bull; {tourney.city}</span>}
                            <span>&bull;</span>
                            <span className="font-mono text-zinc-300">
                              {tourney.wins}V - {tourney.ties}E - {tourney.losses}D
                            </span>
                          </div>
                        </div>

                        <div className="text-zinc-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Matches List */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 bg-[#0A0A0C]/50 space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-1">
                            Partidas Rodada a Rodada
                          </div>

                          {tourney.matches.length === 0 ? (
                            <p className="text-xs text-zinc-500 py-2">Nenhuma partida finalizada nesta edição.</p>
                          ) : (
                            tourney.matches.map((m) => (
                              <div
                                key={m.matchId}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-xs"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-[11px]">
                                    R{m.roundNumber}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white">
                                      vs {m.opponentName}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono">
                                      Mesa {m.tableNumber} {m.opponentPopId && `• POP: ${m.opponentPopId}`}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  {m.result === 'VITÓRIA' && (
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                      VITÓRIA
                                    </span>
                                  )}
                                  {m.result === 'EMPATE' && (
                                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px]">
                                      EMPATE
                                    </span>
                                  )}
                                  {m.result === 'DERROTA' && (
                                    <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[10px]">
                                      DERROTA
                                    </span>
                                  )}
                                  {m.result === 'EM_ANDAMENTO' && (
                                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px]">
                                      EM ANDAMENTO
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
