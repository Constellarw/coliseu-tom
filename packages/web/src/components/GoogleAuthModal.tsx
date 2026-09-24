import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
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
    return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch dynamic config from backend
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      return;
    }

    let isMounted = true;

    async function loadConfig() {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          if (data.googleClientId && isMounted) {
            setGoogleClientId(data.googleClientId);
          }
        }
      } catch (err) {
        console.warn('Could not fetch auth config:', err);
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Initialize official Google Identity Services (GSI)
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

        try {
          window.google.accounts.id.prompt();
        } catch {}

        return true;
      } catch (err: any) {
        console.warn('Google GSI render error:', err);
        setErrorMessage('Não foi possível inicializar o login do Google no momento.');
        return false;
      }
    };

    if (!initGoogleGsi()) {
      checkInterval = setInterval(() => {
        if (initGoogleGsi()) {
          clearInterval(checkInterval);
        }
      }, 400);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, googleClientId]);

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
            Seu login oficial garante que <strong>apenas você</strong> possa acessar e reportar o resultado da sua mesa no torneio Pokémon TCG, impedindo fraudes.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left">
              {errorMessage}
            </div>
          )}

          <p className="text-xs text-zinc-400 leading-relaxed">
            Acesse com sua conta do Google para consultar sua mesa e enviar os reports de partida:
          </p>

          {/* Official Google GSI button container */}
          <div className="flex justify-center min-h-[46px] my-3">
            <div ref={googleBtnContainerRef} className="flex justify-center w-full" />
          </div>

          {isLoading && (
            <div className="text-xs text-red-400 font-medium animate-pulse">
              Validando autenticação Google com o servidor...
            </div>
          )}

          <p className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
            Seus dados são protegidos e associados com segurança ao seu POP ID oficial.
          </p>
        </div>
      </div>
    </div>
  );
};
