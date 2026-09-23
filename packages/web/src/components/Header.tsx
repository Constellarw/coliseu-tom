import React from 'react';
import { Shield, User, RefreshCw, Lock, LogOut } from 'lucide-react';

interface HeaderProps {
  tournamentName: string;
  viewMode: 'player' | 'admin';
  setViewMode: (mode: 'player' | 'admin') => void;
  isJudgeAuthenticated: boolean;
  onOpenJudgeLogin: () => void;
  onJudgeLogout: () => void;
  onRefresh: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentName,
  viewMode,
  setViewMode,
  isJudgeAuthenticated,
  onOpenJudgeLogin,
  onJudgeLogout,
  onRefresh,
  isSyncing
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0C]/95 backdrop-blur border-b border-zinc-800/80 px-4 py-2.5 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Project Name */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo_coliseu_web.png"
            alt="Coliseu TCG"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_12px_rgba(220,38,38,0.25)]"
          />
          <div className="border-l border-zinc-800/80 pl-3">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-1.5">
              COLISEU <span className="text-red-500">ARENA</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium truncate max-w-[160px] sm:max-w-xs">
              {tournamentName || 'Torneio Pokémon TCG'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className={`p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ${
              isSyncing ? 'animate-spin text-red-500' : ''
            }`}
            title="Atualizar dados da arena"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Judge controls: only visible if authenticated or subtle login button */}
          {isJudgeAuthenticated ? (
            <div className="bg-zinc-900/90 p-1 rounded-xl flex items-center space-x-1 border border-zinc-800">
              <button
                onClick={() => setViewMode('player')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'player'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Modo Jogador"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Jogador</span>
              </button>
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'admin'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Painel do Juiz"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Juiz / TO</span>
              </button>
              <button
                onClick={onJudgeLogout}
                className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Sair do modo Juiz"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenJudgeLogin}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800/80 text-xs font-medium transition-all"
              title="Acesso exclusivo para Juízes e Organizadores"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Área do Juiz</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
