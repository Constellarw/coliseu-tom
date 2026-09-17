import React from 'react';
import { Shield, User, Trophy, RefreshCw } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 w-full h-1/2 bg-red-600" />
            <div className="absolute bottom-0 w-full h-1/2 bg-white" />
            <div className="absolute top-[42%] w-full h-1 bg-black z-10" />
            <div className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-black z-20" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight text-white flex items-center gap-2">
              {tournamentName || 'Pokémon TCG'}
              {currentRound > 0 && (
                <span className="bg-yellow-400/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-semibold border border-yellow-400/30">
                  R{currentRound}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">Companion &amp; Pareamento TOM</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ${
              isSyncing ? 'animate-spin text-yellow-400' : ''
            }`}
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="bg-slate-800 p-1 rounded-lg flex items-center space-x-1 border border-slate-700">
            <button
              onClick={() => setViewMode('player')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'player'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Jogador</span>
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'admin'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
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
