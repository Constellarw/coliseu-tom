import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertCircle, Key, ExternalLink, Settings, CheckCircle2 } from 'lucide-react';
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
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      localStorage.getItem('coliseu_google_client_id') ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      ''
    );
  });
  const [inputClientId, setInputClientId] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDevFallback, setShowDevFallback] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch dynamic config from backend on open
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setSaveSuccess(false);
      return;
    }

    let isMounted = true;

    async function loadConfig() {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          if (data.googleClientId && isMounted && !googleClientId) {
            setGoogleClientId(data.googleClientId);
          }
        }
      } catch (err) {
        console.warn('Could not fetch auth config from server:', err);
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Initialize real Google Identity Services (GSI) when clientId and DOM are ready
  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    let checkInterval: any = null;

    const initGoogleGsi = () => {
      if (!window.google?.accounts?.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              await handleGoogleCredential(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
            logo_alignment: 'left'
          });
        }

        // Try Google One Tap prompt
        try {
          window.google.accounts.id.prompt();
        } catch {}

        return true;
      } catch (err: any) {
        console.warn('Google GSI render error:', err);
        setErrorMessage(`Erro ao carregar botão do Google: ${err.message || 'Verifique o Client ID'}`);
        return false;
      }
    };

    // Try immediately
    if (!initGoogleGsi()) {
      // Retry in case script is still loading
      checkInterval = setInterval(() => {
        if (initGoogleGsi()) {
          clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, googleClientId, isConfiguring]);

  // 3. Send real Google JWT credential to backend
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
        throw new Error(data.error || 'Falha ao autenticar conta Google.');
      }

      const { user, token } = await res.json();
      onSuccess(user, token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado durante login com o Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Save manual Client ID
  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputClientId.trim();
    if (!cleanId) return;

    localStorage.setItem('coliseu_google_client_id', cleanId);
    setGoogleClientId(cleanId);
    setIsConfiguring(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // 5. Explicit dev login (only visible under advanced accordion)
  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: devEmail.trim(),
          name: devName.trim() || devEmail.split('@')[0]
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao realizar login simulado.');
      }

      const { user, token } = await res.json();
      onSuccess(user, token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro no login simulado.');
    } finally {
      setIsLoading(false);
    }
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
                Login com Google
              </h3>
              <p className="text-xs text-zinc-400">Autenticação oficial para jogadores</p>
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
            Seu login oficial garante que <strong>apenas você</strong> possa acessar e reportar o resultado da sua mesa no torneio Pokémon TCG, impedindo fraudes.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Google Client ID configurado com sucesso!</span>
            </div>
          )}

          {/* MAIN GOOGLE LOGIN SECTION */}
          {googleClientId && !isConfiguring ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Clique abaixo para autenticar com sua conta oficial do Google (<span className="text-zinc-200">@gmail.com</span>):
              </p>

              {/* Real Google GSI iframe button container */}
              <div className="flex justify-center min-h-[46px] my-3">
                <div ref={googleBtnContainerRef} className="flex justify-center w-full" />
              </div>

              {isLoading && (
                <div className="text-xs text-red-400 font-medium animate-pulse">
                  Validando autenticação Google com o servidor...
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="truncate max-w-[200px]" title={googleClientId}>
                  Client: {googleClientId.slice(0, 15)}...
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInputClientId(googleClientId);
                    setIsConfiguring(true);
                  }}
                  className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>Alterar Client ID</span>
                </button>
              </div>
            </div>
          ) : (
            /* CONFIGURATION SECTION WHEN CLIENT ID IS MISSING */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Configuração do Google OAuth necessária</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Para abrir a janela oficial do Google no navegador, informe o <strong>OAuth Client ID</strong> da sua aplicação Google Cloud.
                </p>
              </div>

              <form onSubmit={handleSaveClientId} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    placeholder="ex: 123456789-abcdef.apps.googleusercontent.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!inputClientId.trim()}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                  >
                    Ativar Login Google
                  </button>

                  {googleClientId && (
                    <button
                      type="button"
                      onClick={() => setIsConfiguring(false)}
                      className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1.5">
                <div className="font-bold text-zinc-300 flex items-center justify-between">
                  <span>Como obter seu Client ID:</span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    Google Cloud <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-400">
                  1. Crie uma credencial <strong>OAuth 2.0 Client ID</strong> (Web Application).<br />
                  2. Em <strong>Origens JavaScript autorizadas</strong>, adicione:<br />
                  <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">https://coliseu-tom.vercel.app</code>
                </p>
              </div>
            </div>
          )}

          {/* Collapsible offline fallback for local tests */}
          <div className="pt-2 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setShowDevFallback(!showDevFallback)}
              className="text-[10px] text-zinc-500 hover:text-zinc-400 transition-colors w-full text-center flex items-center justify-center gap-1"
            >
              <span>{showDevFallback ? 'Ocultar testes offline' : 'Opções avançadas / Teste offline'}</span>
            </button>

            {showDevFallback && (
              <form onSubmit={handleDevLogin} className="mt-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 space-y-2">
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Simulação offline apenas para testes de interface:
                </p>
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="Nome do Jogador"
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !devEmail.trim()}
                  className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Entrar como Teste Offline
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
