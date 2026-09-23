import React from 'react';
import { Shield, User, RefreshCw } from 'lucide-react';
import { ColiseuIcon } from './ColiseuIcon';

interface HeaderProps {
  tournamentName: string;
  currentRound: number;
  viewMode: 'player' | 'admin';
  setViewMode: (mode: 'player' | 'admin') => void;
  onRefresh: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentName,
  currentRound,
  viewMode,
  setViewMode,
  onRefresh,
  isSyncing
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0C]/95 backdrop-blur border-b border-red-950/40 px-4 py-2.5 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/logo_coliseu_web.png"
            alt="Coliseu TCG"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_12px_rgba(220,38,38,0.25)]"
          />
          <div className="border-l border-zinc-800/80 pl-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white hidden sm:inline">
                ARENA <span className="text-red-500">TOM</span>
              </span>
              {currentRound > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[11px] px-2 py-0.5 rounded-full font-bold border border-red-500/30">
                  R{currentRound}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
              <span className="truncate max-w-[150px] sm:max-w-xs">{tournamentName || 'Torneio Pokémon TCG'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Ao Vivo</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className={`p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors ${
              isSyncing ? 'animate-spin text-red-500' : ''
            }`}
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="bg-zinc-900/90 p-1 rounded-xl flex items-center space-x-1 border border-zinc-800">
            <button
              onClick={() => setViewMode('player')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'player'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Jogador</span>
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'admin'
                  ? 'bg-zinc-800 text-red-400 border border-red-500/30 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Juiz / TO</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
