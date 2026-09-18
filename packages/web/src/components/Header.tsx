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
    <header className="sticky top-0 z-50 bg-[#090D16]/95 backdrop-blur border-b border-amber-900/30 px-4 py-3 shadow-xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ColiseuIcon size={40} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                COLISEU <span className="text-amber-400">TCG</span>
              </span>
              {currentRound > 0 && (
                <span className="bg-amber-400/20 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                  R{currentRound}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-200/60 flex items-center gap-1.5 font-medium">
              <span className="truncate max-w-[170px] sm:max-w-xs">{tournamentName || 'Arena Pokémon TCG'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">TOM Companion</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className={`p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors ${
              isSyncing ? 'animate-spin text-amber-400' : ''
            }`}
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="bg-slate-900/90 p-1 rounded-xl flex items-center space-x-1 border border-slate-800">
            <button
              onClick={() => setViewMode('player')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'player'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Jogador</span>
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'admin'
                  ? 'bg-red-700 text-white shadow-md shadow-red-700/20'
                  : 'text-slate-400 hover:text-white'
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
