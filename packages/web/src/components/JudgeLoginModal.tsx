import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, X, KeyRound } from 'lucide-react';

interface JudgeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JudgeLoginModal: React.FC<JudgeLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      if (res.ok) {
        setPassword('');
        onSuccess();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Senha incorreta. Acesso exclusivo para Juízes.');
      }
    } catch {
      // Fallback local check if offline
      if (password.trim() === 'coliseu123') {
        setPassword('');
        onSuccess();
      } else {
        setError('Senha incorreta. Acesso exclusivo para Juízes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-red-600/15 border border-red-500/30 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-950/40">
          <Shield className="w-6 h-6" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-black text-white">Acesso do Juiz / TO</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Área restrita para juízes e organizadores da Coliseu Arena. Digite sua senha de acesso.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Digite a senha do Juiz"
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0C] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-600/25 active:scale-98 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Verificando...' : 'Acessar Painel do Juiz'}</span>
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full py-1 text-xs text-zinc-500 hover:text-zinc-300 font-medium text-center transition-colors"
        >
          Voltar para visualização do jogador
        </button>
      </div>
    </div>
  );
};
