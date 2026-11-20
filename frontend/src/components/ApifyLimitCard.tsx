import { useCallback, useEffect, useState } from 'react';
import type { ApifyLimits } from '../models/ApifyLimits';

const API_URL = 'http://localhost:8000/api/apify-limits';

const ERROR_LIMITS: ApifyLimits = {
  gasto_atual_usd: 0,
  limite_mensal_usd: 0,
  saldo_restante_usd: 0,
  porcentagem_usada: 0,
  status: 'error',
};

// Garante que campos ausentes/nulos vindos do backend não quebrem o .toFixed()
const normalizeLimits = (data: Partial<ApifyLimits>): ApifyLimits => ({
  gasto_atual_usd: Number(data.gasto_atual_usd) || 0,
  limite_mensal_usd: Number(data.limite_mensal_usd) || 0,
  saldo_restante_usd: Number(data.saldo_restante_usd) || 0,
  porcentagem_usada: Number(data.porcentagem_usada) || 0,
  status: data.status ?? 'error',
});

interface ApifyLimitsCardProps {
  /** Passe um gatilho opcional (ex: status da análise) para recarregar o saldo automaticamente ao finalizar */
  refreshTrigger?: unknown;
}

export default function ApifyLimitsCard({ refreshTrigger }: ApifyLimitsCardProps) {
  const [apifyLimits, setApifyLimits] = useState<ApifyLimits | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchApifyLimits = useCallback(async (isManual = false, signal?: AbortSignal) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await fetch(API_URL, { signal });
      if (!response.ok) throw new Error(`Falha ao buscar limites da Apify (HTTP ${response.status})`);

      const data: Partial<ApifyLimits> = await response.json();
      setApifyLimits(normalizeLimits(data));
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Erro ao buscar limites da Apify:', error);
      setApifyLimits(ERROR_LIMITS);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchApifyLimits(false, controller.signal);
    return () => controller.abort();
  }, [fetchApifyLimits, refreshTrigger]);

  // Skeleton enquanto carrega pela primeira vez
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-4 shadow-sm animate-pulse space-y-3">
        <div className="h-3.5 w-32 bg-slate-200 rounded" />
        <div className="h-7 w-24 bg-slate-200 rounded" />
        <div className="h-2 w-full bg-slate-200 rounded-full" />
      </div>
    );
  }

  if (!apifyLimits || apifyLimits.status === 'unsupported') {
    return null;
  }

  const isLow = apifyLimits.status === 'low_balance';
  const isError = apifyLimits.status === 'error';

  return (
    <div className="bg-white rounded-xl border border-[#CBD5E1] p-4 shadow-sm flex flex-col justify-between gap-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isError
                ? 'bg-slate-400'
                : isLow
                ? 'bg-red-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#54647a]">
            Cota Apify Scraper
          </span>
        </div>

        <button
          type="button"
          onClick={() => fetchApifyLimits(true)}
          disabled={refreshing}
          title="Atualizar saldo"
          className="text-xs font-medium text-[#54647a] hover:text-[#1b1c1d] bg-[#F4F6F8] hover:bg-slate-200/70 disabled:opacity-50 px-2.5 py-1 rounded-lg border border-[#CBD5E1] transition-colors cursor-pointer"
        >
          {refreshing ? 'Atualizando...' : '↻ Atualizar'}
        </button>
      </div>

      {/* Valor Principal */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold text-[#1b1c1d] tracking-tight">
            {isError ? '--' : `$${apifyLimits.saldo_restante_usd.toFixed(2)}`}
          </span>
          {!isError && (
            <span className="text-xs text-[#54647a] ml-1.5">disponíveis</span>
          )}
        </div>

        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
            isError
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : isLow
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {isError ? 'Indisponível' : isLow ? 'Saldo Crítico' : 'Operacional'}
        </span>
      </div>

      {/* Barra de Progresso e Rodapé */}
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-[#F4F6F8] rounded-full overflow-hidden border border-[#CBD5E1]/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              apifyLimits.porcentagem_usada >= 85
                ? 'bg-red-500'
                : apifyLimits.porcentagem_usada >= 60
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${isError ? 0 : Math.min(100, Math.max(0, apifyLimits.porcentagem_usada))}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-[#54647a] font-medium">
          <span>
            Consumido:{' '}
            <strong className="text-[#1b1c1d]">
              {isError ? '--' : `$${apifyLimits.gasto_atual_usd.toFixed(2)}`}
            </strong>{' '}
            / {isError ? '--' : `$${apifyLimits.limite_mensal_usd.toFixed(2)}`}
          </span>
          <span>{isError ? '--' : `${apifyLimits.porcentagem_usada.toFixed(1)}% usado`}</span>
        </div>
      </div>
    </div>
  );
}