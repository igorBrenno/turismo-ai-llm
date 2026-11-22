import { AlertTriangle, Bot, User } from 'lucide-react';
import type { PagedList, SpotAlert } from '../../hooks/useSpotDetails';
import LoadMoreButton from './LoadMoreButton';

const DANGER_LABELS: Record<string, string> = {
  CRIME_GRAVE: 'Crime grave',
  FURTO: 'Furto',
  GOLPE: 'Golpe',
  INFRAESTRUTURA_PERIGOSA: 'Infraestrutura perigosa',
  OUTRO: 'Outro',
};

export default function SpotAlertsList({ alerts }: { alerts: PagedList<SpotAlert> }) {
  const { items, total, hasMore, loadMore } = alerts;

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
            return (
              <li key={alert.id} className="border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-red-50 text-[#ba1a1a] border border-red-200">
                    {DANGER_LABELS[alert.tipo_perigo ?? ''] ?? alert.tipo_perigo ?? 'Outro'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#505f76] flex items-center gap-1">
                    {byHuman ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    {byHuman ? 'Ocorrência registrada' : 'Detectado pela IA'}
                  </span>
                  <span className="text-[#74777d] font-semibold">+{alert.danger_points_added ?? 0} pts</span>
                  {alert.resolvida && <span className="text-emerald-700">Resolvido</span>}
                </div>
                {alert.justificativa && <p className="text-sm text-[#1b1c1d]">"{alert.justificativa}"</p>}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && <LoadMoreButton onClick={loadMore} />}
    </section>
  );
}
