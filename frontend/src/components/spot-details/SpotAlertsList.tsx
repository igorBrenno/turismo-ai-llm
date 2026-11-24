import { useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Loader2, User } from 'lucide-react';
import type { PagedList, SpotAlert } from '../../hooks/useSpotDetails';
import { CityAlertsService } from '../../services/CityAlertsService';
import LoadMoreButton from './LoadMoreButton';

const DANGER_LABELS: Record<string, string> = {
  CRIME_GRAVE: 'Crime grave',
  FURTO: 'Furto',
  GOLPE: 'Golpe',
  INFRAESTRUTURA_PERIGOSA: 'Infraestrutura perigosa',
  OUTRO: 'Outro',
};

interface SpotAlertsListProps {
  cityId: string;
  alerts: PagedList<SpotAlert>;
}

export default function SpotAlertsList({ cityId, alerts }: SpotAlertsListProps) {
  const { items, total, hasMore, loadMore } = alerts;
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  // A lista escuta o Firestore em tempo real, então o alerta aparece como resolvido assim que salvar
  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    setFailedId(null);
    try {
      await CityAlertsService.resolve(cityId, alertId);
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      setFailedId(alertId);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-[#041627] flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" /> Alertas ({total ?? items.length})
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-[#74777d]">Nenhum alerta registrado para este ponto.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(alert => {
            const byHuman = alert.reporter === 'ocorrencia';
            const resolving = resolvingId === alert.id;
            return (
              <li
                key={alert.id}
                className={`border rounded-xl p-3.5 space-y-2 ${alert.resolvida ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#E2E8F0]'}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-red-50 text-[#ba1a1a] border border-red-200">
                    {DANGER_LABELS[alert.tipo_perigo ?? ''] ?? alert.tipo_perigo ?? 'Outro'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#505f76] flex items-center gap-1">
                    {byHuman ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    {byHuman ? 'Ocorrência registrada' : 'Detectado pela IA'}
                  </span>
                  <span className="text-[#74777d] font-semibold">+{alert.danger_points_added ?? 0} pts</span>
                </div>

                {alert.justificativa && <p className="text-sm text-[#1b1c1d]">"{alert.justificativa}"</p>}

                <div className="flex items-center justify-end gap-2">
                  {failedId === alert.id && <span className="text-[11px] text-[#ba1a1a]">Não foi possível salvar.</span>}
                  {alert.resolvida ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolvido
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolving}
                      className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 transition-colors disabled:opacity-60"
                    >
                      {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {resolving ? 'Salvando...' : 'Marcar como resolvido'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && <LoadMoreButton onClick={loadMore} />}
    </section>
  );
}
