import React from 'react';
import { Shield, User, RefreshCw, Lock, LogOut } from 'lucide-react';
import { UserRecord } from '../types/auth';

interface HeaderProps {
  tournamentName: string;
  viewMode: 'player' | 'admin';
  setViewMode: (mode: 'player' | 'admin') => void;
  isJudgeAuthenticated: boolean;
  onOpenJudgeLogin: () => void;
  onJudgeLogout: () => void;
  onRefresh: () => void;
  isSyncing?: boolean;
  user: UserRecord | null;
  onOpenGoogleLogin: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentName,
  viewMode,
  setViewMode,
  isJudgeAuthenticated,
  onOpenJudgeLogin,
  onJudgeLogout,
  onRefresh,
  isSyncing,
  user,
  onOpenGoogleLogin,
  onOpenProfile
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0C]/95 backdrop-blur border-b border-zinc-800/80 px-3 sm:px-4 py-2.5 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Project Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <img
            src="/logo_coliseu_web.png"
            alt="Coliseu TCG"
            className="h-9 sm:h-12 w-auto object-contain drop-shadow-[0_2px_12px_rgba(220,38,38,0.25)]"
          />
          <div className="border-l border-zinc-800/80 pl-2.5 sm:pl-3">
            <h1 className="text-sm sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-1.5">
              COLISEU <span className="text-red-500">ARENA</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate max-w-[120px] sm:max-w-xs">
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

          {/* User Account / Login */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-left group"
              title="Meu Perfil e Histórico"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-6 h-6 rounded-lg object-cover border border-red-500/30"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-[11px]">
                  {user.name[0]?.toUpperCase() || 'P'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-none group-hover:text-red-400 transition-colors">
                  {user.name.split(' ')[0]}
                </div>
                {user.pop_id ? (
                  <div className="text-[10px] text-emerald-400 font-mono leading-none mt-1 flex items-center gap-0.5">
                    POP: {user.pop_id}
                  </div>
                ) : (
                  <div className="text-[9px] text-red-400 font-bold leading-none mt-1">
                    Vincular POP
                  </div>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenGoogleLogin}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 active:scale-98"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}

          {/* Judge controls: only visible if authenticated or subtle login button */}
          {isJudgeAuthenticated ? (
            <div className="bg-zinc-900/90 p-1 rounded-xl flex items-center space-x-1 border border-zinc-800">
              <button
                onClick={() => setViewMode('player')}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
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
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'admin'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Painel do Juiz"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Juiz</span>
              </button>
              <button
                onClick={onJudgeLogout}
                className="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Sair do modo Juiz"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenJudgeLogin}
              className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800/80 text-xs font-medium transition-all"
              title="Acesso exclusivo para Juízes e Organizadores"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Juiz</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
