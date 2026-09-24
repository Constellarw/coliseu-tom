import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Lock, X } from 'lucide-react';
import { UserRecord } from '../types/auth';

interface PopIdBindingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  user: UserRecord;
  token: string;
  onSuccess: (updatedUser: UserRecord) => void;
  canDismiss?: boolean;
}

export const PopIdBindingModal: React.FC<PopIdBindingModalProps> = ({
  isOpen,
  onClose,
  user,
  token,
  onSuccess,
  canDismiss = false
}) => {
  const [popIdInput, setPopIdInput] = useState(user.pop_id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popIdInput.trim()) {
      setErrorMessage('Por favor, informe seu POP ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/bind-popid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          popId: popIdInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao vincular POP ID.');
      }

      onSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao vincular POP ID.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Vincular POP ID Oficial
              </h3>
              <p className="text-xs text-zinc-400">Identificação de Jogador Pokémon</p>
            </div>
          </div>
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Informational banner */}
        <div className="px-6 py-3.5 bg-red-950/20 border-b border-red-900/30 flex items-start space-x-3">
          <Lock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-zinc-300 leading-relaxed space-y-1">
            <p>
              Olá, <strong>{user.name}</strong>! Informe seu <strong>POP ID (Player ID)</strong> oficial para vincular à sua conta Google. Assim você poderá reportar e confirmar os resultados das suas partidas com total segurança.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              POP ID (Pokémon Player ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={popIdInput}
              onChange={(e) => setPopIdInput(e.target.value)}
              placeholder="Ex: 987654321"
              required
              className="w-full px-4 py-2.5 bg-[#0A0A0C] border border-zinc-800 rounded-xl text-white font-mono placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm tracking-wider"
              autoFocus
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Seu ID oficial da Pokémon Company / Play! Pokémon.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !popIdInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/25 active:scale-98 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
            >
              {isLoading ? (
                <span>Vinculando POP ID...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vincular Meu POP ID</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
