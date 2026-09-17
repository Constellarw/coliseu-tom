import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, RefreshCw, ShieldAlert, FileText, Check } from 'lucide-react';

interface AdminMatchReport {
  id: string;
  table_number: number;
  round_number: number;
  player1_id: string;
  player2_id: string;
  p1_name: string;
  p2_name: string;
  status: string;
  p1_reported_winner: string | null;
  p2_reported_winner: string | null;
  confirmed_winner_id: string | null;
  is_tie: number;
  tom_outcome: string;
}

interface AdminViewProps {
  tournamentId: string;
  reportsQueue: AdminMatchReport[];
  onUploadTdf: (content: string) => Promise<void>;
  onJudgeOverride: (matchId: string, winnerId: string | null, isTie: boolean) => Promise<void>;
  isUploading: boolean;
}

export const AdminView: React.FC<AdminViewProps> = ({
  tournamentId,
  reportsQueue,
  onUploadTdf,
  onJudgeOverride,
  isUploading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      await onUploadTdf(text);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      alert(`Falha ao ler arquivo: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        className={`bg-slate-900 border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragOver ? 'border-yellow-400 bg-yellow-400/5' : 'border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".tdf,.xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30">
          <Upload className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          Importar Arquivo do TOM (.tdf)
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Arraste o arquivo <strong>.tdf</strong> salvo pelo TOM da rodada atual ou clique no botão abaixo para atualizar as mesas e pareamentos de todos os jogadores instantaneamente.
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processando TDF...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Selecionar Arquivo .tdf</span>
            </>
          )}
        </button>

        {uploadSuccess && (
          <div className="mt-3 text-xs text-green-400 font-semibold flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            <span>Torneio e pareamentos sincronizados com sucesso!</span>
          </div>
        )}
      </div>

      {/* Live reports queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-yellow-400" />
              Fila de Resultados &amp; Juiz
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe os reports enviados pelos jogadores e confirme para lançamento no TOM.
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-1 rounded-full border border-slate-700">
            {reportsQueue.length} mesa(s)
          </span>
        </div>

        {reportsQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum resultado reportado nesta rodada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {reportsQueue.map((m) => (
              <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-black text-sm">
                    {m.table_number}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {m.p1_name} vs {m.p2_name}
                      </span>
                      {m.status === 'CONFIRMED' && (
                        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-500/30">
                          CONFIRMADO
                        </span>
                      )}
                      {m.status === 'PENDING_CONFIRMATION' && (
                        <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-yellow-500/30">
                          AGUARDANDO OPONENTE
                        </span>
                      )}
                      {m.status === 'DISPUTED' && (
                        <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-500/30 animate-pulse">
                          DISPUTA!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Report P1: <span className="text-slate-300">{m.p1_reported_winner || '—'}</span> | Report P2:{' '}
                      <span className="text-slate-300">{m.p2_reported_winner || '—'}</span>
                    </p>
                  </div>
                </div>

                {/* Judge actions */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    onClick={() => onJudgeOverride(m.id, m.player1_id, false)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium transition-colors border border-slate-700"
                    title="Definir Jogador 1 como Vencedor"
                  >
                    P1 Venceu
                  </button>
                  <button
                    onClick={() => onJudgeOverride(m.id, m.player2_id, false)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium transition-colors border border-slate-700"
                    title="Definir Jogador 2 como Vencedor"
                  >
                    P2 Venceu
                  </button>
                  <button
                    onClick={() => onJudgeOverride(m.id, null, true)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium transition-colors border border-slate-700"
                    title="Definir Empate"
                  >
                    Empate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
