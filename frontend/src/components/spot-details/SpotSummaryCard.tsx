import { Clock, ShieldAlert, Sparkles, Star } from 'lucide-react';
import type { TouristSpotDashboard } from '../../models/Spot';

interface SpotSummaryCardProps {
  spot: TouristSpotDashboard;
  totalReviews: number;
}

const formatDate = (value: unknown): string | null => {
  const timestamp = value as { toDate?: () => Date } | null;
  if (typeof timestamp?.toDate !== 'function') return null;
  return timestamp.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function SpotSummaryCard({ spot, totalReviews }: SpotSummaryCardProps) {
  const lastScan = formatDate(spot.ultima_varredura);

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Índice de perigo
          </p>
          <p className="text-2xl font-extrabold text-[#041627] mt-1">
            {Math.round(spot.danger_score ?? 0)} <span className="text-sm font-semibold text-[#505f76]">pts / 100 reviews</span>
          </p>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#505f76] flex items-center gap-1">
            <Star className="w-3.5 h-3.5" /> Nota no Google
          </p>
          <p className="text-2xl font-extrabold text-[#041627] mt-1">{spot.rating ? spot.rating.toFixed(1) : '—'}</p>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#505f76] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Última varredura
          </p>
          <p className="text-sm font-bold text-[#041627] mt-2">{lastScan ?? 'Não informada'}</p>
          <p className="text-[11px] text-[#74777d]">{totalReviews} reviews analisadas</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#505f76] flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Resumo da IA
        </p>
        <p className="text-sm text-[#1b1c1d] leading-relaxed">{spot.resumo_ia || 'Sem resumo disponível.'}</p>
      </div>
    </section>
  );
}
