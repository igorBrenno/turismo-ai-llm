import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { TouristSpotDashboard } from '../../models/Spot';
import ChartCard from './ChartCard';

interface CriticalSpotsListProps {
  cityId?: string | null;
  spots: TouristSpotDashboard[];
}

const spotName = (spot: TouristSpotDashboard) => spot.nome || spot.name || 'Local sem nome';

// Lista os spots da cidade do mais perigoso para o menos perigoso, com link para os detalhes
export default function CriticalSpotsList({ cityId, spots }: CriticalSpotsListProps) {
  const ordered = [...spots].sort((a, b) => (b.danger_score ?? 0) - (a.danger_score ?? 0));
  // As barras são relativas ao spot mais perigoso da cidade, já que o índice não tem teto
  const maxScore = Math.max(0, ...ordered.map(spot => spot.danger_score ?? 0));

  return (
    <ChartCard title="Zonas críticas" description="Índice de perigo de cada ponto turístico (pts / 100 reviews).">
      {ordered.length === 0 ? (
        <p className="text-sm text-[#74777d] text-center py-10">Nenhum ponto analisado nesta cidade.</p>
      ) : (
        <ul className="divide-y divide-[#F1F5F9] max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
          {ordered.map(spot => {
            const score = spot.danger_score ?? 0;
            const width = maxScore > 0 ? (score / maxScore) * 100 : 0;
            return (
              <li key={spot.id} className="py-2.5 flex items-center gap-4">
                <div className="flex-grow min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-[#041627] truncate">{spotName(spot)}</span>
                    <span className="text-xs font-bold text-[#505f76] whitespace-nowrap">{Math.round(score)} pts</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ba1a1a] rounded-full" style={{ width: `${width}%` }} />
                  </div>
                </div>
                {cityId && (
                  <Link
                    to={`/graficos/spot/${cityId}/${spot.id}`}
                    className="shrink-0 text-xs font-semibold text-[#2563eb] hover:text-[#041627] flex items-center gap-0.5"
                  >
                    Ver mais <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}
