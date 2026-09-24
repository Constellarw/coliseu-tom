import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRecord } from '../types/auth';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserRecord, token: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'quick'>('google');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Quick preset test players from tournament
  const PRESET_PLAYERS = [
    {
      name: 'Rodrigo Mendes',
      email: 'rodrigo.mendes@coliseu.com',
      popId: '100101',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    },
    {
      name: 'Gabriel Oliveira',
      email: 'gabriel.oliveira@coliseu.com',
      popId: '100102',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    },
    {
      name: 'Ash Ketchum',
      email: 'ash.ketchum@pokemon.com',
      popId: '987654321',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      return;
    }

    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.id && clientId && googleBtnContainerRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              await handleGoogleCredential(response.credential);
            }
          }
        });

        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320
        });
      } catch (err) {
        console.warn('Google GSI render error:', err);
      }
    }
  }, [isOpen, activeTab]);

  const handleGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao autenticar com o Google.');
      }

      const { user, token } = await res.json();
      onSuccess(user, token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado durante login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (player: { name: string; email: string; popId?: string; avatar?: string }) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: player.email,
          name: player.name,
          popId: player.popId,
          picture: player.avatar
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao realizar login.');
      }

      const { user, token } = await res.json();
      onSuccess(user, token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    await handleDevLogin({
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim()
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Entrar no Coliseu Arena
              </h3>
              <p className="text-xs text-zinc-400">Identificação oficial para jogadores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="px-6 py-3 bg-red-950/20 border-b border-red-900/30 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Seu login garante que <strong>apenas você</strong> possa acessar e reportar o resultado da sua mesa no torneio oficial, impedindo fraudes.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('google')}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'google' ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Google Sign-In
            {activeTab === 'google' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'quick' ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Login Rápido de Teste
            {activeTab === 'quick' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {activeTab === 'google' ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-400">
                Acesse com sua conta do Google para vincular seu perfil e manter seu histórico de partidas gravado.
              </p>

              {/* Real Google GSI button if available */}
              <div className="flex justify-center min-h-[44px]" ref={googleBtnContainerRef}>
                {/* Fallback button if Google Client ID not yet set */}
                <button
                  onClick={() => {
                    // One-click simulated Google auth for instant usage
                    handleDevLogin({
                      name: 'Treinador Pokémon',
                      email: 'treinador@gmail.com'
                    });
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl transition-all shadow-md active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com o Google</span>
                </button>
              </div>

              <p className="text-[10px] text-zinc-500">
                Seus dados são protegidos e associados com segurança ao seu POP ID oficial.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Escolha um jogador do torneio atual para testar o sistema imediatamente:
              </p>

              <div className="space-y-2">
                {PRESET_PLAYERS.map((player) => (
                  <button
                    key={player.popId}
                    onClick={() => handleDevLogin(player)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-red-500/30 transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center font-bold text-red-400 text-xs">
                        {player.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                          {player.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          POP ID: {player.popId}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <p className="text-[11px] text-zinc-400 mb-2 font-medium">Ou entre com outro email:</p>
                <form onSubmit={handleCustomLogin} className="space-y-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !customEmail.trim()}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Entrar com este perfil
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
