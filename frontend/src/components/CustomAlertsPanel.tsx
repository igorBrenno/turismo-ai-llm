import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Check, RefreshCw, Settings2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AlertRulesService } from '../services/AlertRulesService';
import type { AlertRun, AlertTrigger } from '../models/AlertRule';
import type { TouristSpot } from '../models/Spot';

interface CustomAlertsPanelProps {
  spots: TouristSpot[];
}

const RUN_STATUS_LABEL: Record<string, string> = {
  iniciando: 'Iniciando...',
  buscando_comentarios: 'Buscando comentários novos no Google (pode levar alguns minutos)...',
  analisando: 'Analisando comentários com a IA...',
};

export default function CustomAlertsPanel({ spots }: CustomAlertsPanelProps) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [triggers, setTriggers] = useState<AlertTrigger[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<AlertRun | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!uid) return;
    return AlertRulesService.subscribeTriggers(uid, setTriggers);
  }, [uid]);

  useEffect(() => {
    if (!runId) return;
    return AlertRulesService.subscribeRun(runId, setRun);
  }, [runId]);

  const isRunning = runId !== null && (run === null || !['concluido', 'erro'].includes(run.status));

  const handleRun = async () => {
    setErrorMessage('');
    setRun(null);
    try {
      setRunId(await AlertRulesService.startRun(spots.slice(0, 200)));
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
      setRunId(null);
      setErrorMessage('Não foi possível iniciar a verificação. Tente novamente.');
    }
  };

  const handleResolve = async (trigger: AlertTrigger) => {
    await AlertRulesService.setTriggerStatus(trigger.id, 'resolvido');
  };

  const openTriggers = triggers.filter((t) => t.status !== 'resolvido');

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-8 shadow-sm space-y-6 scroll-mt-24" id="alertas-personalizados">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-[#041627]" />
            <h3 className="text-xl sm:text-2xl font-bold text-[#041627] tracking-tight">Meus Alertas</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#505f76] mt-1">
            Comentários dos pontos da sua cidade que se encaixam nos alertas que você configurou.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/alertas"
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] text-[#44474c] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" /> Configurar alertas
          </Link>
          <button
            onClick={handleRun}
            disabled={isRunning || spots.length === 0}
            title={spots.length === 0 ? 'Aguardando carregar os pontos da cidade' : undefined}
            className="px-4 py-2 bg-[#041627] hover:bg-[#1a2b3c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Verificando...' : 'Verificar novos comentários'}
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-sm text-[#505f76] space-y-2">
          <p className="font-semibold text-[#041627]">{RUN_STATUS_LABEL[run?.status ?? 'iniciando']}</p>
          {run?.status === 'analisando' && run.avaliacoes_pendentes > 0 && (
            <>
              <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#041627] transition-all"
                  style={{ width: `${(run.avaliacoes_feitas / run.avaliacoes_pendentes) * 100}%` }}
                />
              </div>
              <p className="text-xs">{run.avaliacoes_feitas} de {run.avaliacoes_pendentes} avaliações · {run.disparos} alerta(s) acionado(s)</p>
            </>
          )}
        </div>
      )}

      {run?.status === 'concluido' && (
        <p className="text-sm text-emerald-700 font-semibold">
          Verificação concluída: {run.avaliacoes_pendentes} avaliação(ões) feita(s) em {run.total_comentarios} comentários, {run.disparos} alerta(s) acionado(s).
          {!!run.lotes_com_falha && (
            <span className="block text-amber-700 font-normal mt-1">
              Alguns comentários não puderam ser avaliados agora e serão verificados na próxima vez.
            </span>
          )}
        </p>
      )}
      {(run?.status === 'erro' || errorMessage) && (
        <p className="text-sm text-[#ba1a1a] font-semibold">{run?.erro ?? errorMessage}</p>
      )}

      {openTriggers.length === 0 ? (
        <div className="border border-dashed border-[#c4c6cd] rounded-xl p-8 text-center text-sm text-[#505f76]">
          Nenhum alerta acionado.
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
          {openTriggers.map((trigger) => (
            <div key={trigger.id} className="border border-[#E2E8F0] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-grow min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#d2e4fb] text-[#0b1d2d]">{trigger.rule_nome}</span>
                  <Link to={`/spot/${trigger.place_id}`} className="text-sm font-bold text-[#041627] hover:underline">
                    {trigger.place_nome || 'Local'}
                  </Link>
                  {trigger.created_at && (
                    <span className="text-[11px] text-[#74777d]">{trigger.created_at.toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
                {trigger.trecho && <p className="text-sm font-semibold text-[#ba1a1a]">"{trigger.trecho}"</p>}
                <p className="text-xs text-[#505f76] break-words">{trigger.review_texto}</p>
              </div>
              <button
                onClick={() => handleResolve(trigger)}
                className="shrink-0 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Resolver
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
