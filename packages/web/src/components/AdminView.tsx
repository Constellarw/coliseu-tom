import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, RefreshCw, ShieldAlert, FileText, Check, Trophy, Clock, AlertTriangle } from 'lucide-react';

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

  const formatPlayerReport = (report: string | null, p1Id: string, p1Name: string, p2Id: string, p2Name: string) => {
    if (!report) return 'Pendente';
    if (report === 'TIE' || report === 'EMPATE' || report.toLowerCase() === 'tie') {
      return 'Empate';
    }
    if (report === p1Id) return `Vitória de ${p1Name}`;
    if (report === p2Id) return `Vitória de ${p2Name}`;
    return report;
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
        className={`bg-[#121216] border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragOver ? 'border-red-500 bg-red-500/10' : 'border-zinc-800 hover:border-zinc-700'
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

        <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30">
          <Upload className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          Importar Arquivo do TOM (.tdf)
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
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
          <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            <span>Torneio e pareamentos sincronizados com sucesso!</span>
          </div>
        )}
      </div>

      {/* Live reports queue */}
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Fila de Resultados &amp; Juiz
            </h3>
            <p className="text-xs text-zinc-400">
              Acompanhe os reports enviados pelos jogadores e confirme para lançamento no TOM.
            </p>
          </div>
          <span className="text-xs bg-zinc-900 text-zinc-300 font-mono px-2.5 py-1 rounded-full border border-zinc-800">
            {reportsQueue.length} mesa(s)
          </span>
        </div>

        {reportsQueue.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Nenhum resultado reportado nesta rodada ainda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {reportsQueue.map((m) => {
              const isTie = m.is_tie === 1 || m.tom_outcome === '3';
              const winnerName = m.confirmed_winner_id === m.player1_id ? m.p1_name : m.p2_name;

              return (
                <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-center font-black text-sm shadow shrink-0">
                      {m.table_number}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {m.p1_name} vs {m.p2_name}
                        </span>
                        {m.status === 'CONFIRMED' && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
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

                      {/* Clear report description */}
                      <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80">
                          <strong className="text-zinc-300 font-semibold">{m.p1_name.split(' ')[0]}:</strong>{' '}
                          <span className={m.p1_reported_winner ? 'text-zinc-200' : 'text-zinc-500'}>
                            {formatPlayerReport(m.p1_reported_winner, m.player1_id, m.p1_name, m.player2_id, m.p2_name)}
                          </span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80">
                          <strong className="text-zinc-300 font-semibold">{m.p2_name.split(' ')[0]}:</strong>{' '}
                          <span className={m.p2_reported_winner ? 'text-zinc-200' : 'text-zinc-500'}>
                            {formatPlayerReport(m.p2_reported_winner, m.player1_id, m.p1_name, m.player2_id, m.p2_name)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual outcome for the Judge - No action buttons on confirmed matches */}
                  {m.status === 'CONFIRMED' ? (
                    <div className="flex items-center space-x-3 bg-zinc-950 px-4 py-2.5 rounded-xl border border-zinc-800 shrink-0">
                      {isTie ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center font-bold text-sm">
                            =
                          </div>
                          <div>
                            <p className="text-xs font-black text-yellow-400 uppercase tracking-wide">
                              Empate Confirmado
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Lançar no TOM: <span className="text-white font-bold">Código 3 (Empate)</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                            <Trophy className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                              Vitória: {winnerName}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Lançar no TOM:{' '}
                              <span className="text-white font-bold">
                                {m.confirmed_winner_id === m.player1_id ? 'Código 1 (P1 Venceu)' : 'Código 2 (P2 Venceu)'}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : m.status === 'PENDING_CONFIRMATION' ? (
                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 px-3 py-2 rounded-xl text-yellow-400 text-xs shrink-0 font-medium">
                      <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                      <span>Aguardando oponente confirmar</span>
                    </div>
                  ) : m.status === 'DISPUTED' ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-red-950/20 p-2.5 rounded-xl border border-red-500/30 shrink-0">
                      <span className="text-xs text-red-300 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        Resolver Disputa:
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onJudgeOverride(m.id, m.player1_id, false)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs rounded-lg font-bold border border-zinc-700 transition-colors"
                        >
                          {m.p1_name.split(' ')[0]} Venceu
                        </button>
                        <button
                          onClick={() => onJudgeOverride(m.id, m.player2_id, false)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs rounded-lg font-bold border border-zinc-700 transition-colors"
                        >
                          {m.p2_name.split(' ')[0]} Venceu
                        </button>
                        <button
                          onClick={() => onJudgeOverride(m.id, null, true)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-yellow-400 text-xs rounded-lg font-bold border border-zinc-700 transition-colors"
                        >
                          Empate
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
