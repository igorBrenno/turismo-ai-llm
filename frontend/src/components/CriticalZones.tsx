import { MapPin } from 'lucide-react';
import type { TouristSpotDashboard } from '../models/Spot';
import { getDangerScore } from '../utils/dangerScore';

interface CriticalZonesProps {
  spots: TouristSpotDashboard[];
}

// Cores por posição no ranking (1º, 2º, 3º)
const CORES_POR_POSICAO = [
  { texto: 'text-[#ba1a1a]', fundo: 'bg-[#ba1a1a]', badge: 'bg-red-50 border-red-200' },
  { texto: 'text-[#d97706]', fundo: 'bg-[#d97706]', badge: 'bg-amber-50 border-amber-200' },
  { texto: 'text-[#505f76]', fundo: 'bg-[#505f76]', badge: 'bg-slate-100 border-slate-200' },
];

// Top 3 spots com maior índice de perigo (só os com risco > 0 e reviews suficientes)
const topZonasCriticas = (spots: TouristSpotDashboard[]) =>
  [...spots]
    .filter(spot => (getDangerScore(spot) ?? 0) > 0)
    .sort((a, b) => (getDangerScore(b) ?? 0) - (getDangerScore(a) ?? 0))
    .slice(0, CORES_POR_POSICAO.length);

export default function CriticalZones({ spots }: CriticalZonesProps) {
  const zonasCriticas = topZonasCriticas(spots);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-[#F1F5F9] pb-3">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-[#041627]">Zonas Mais Críticas</h4>
            <p className="text-xs text-[#74777d]">Índice de vulnerabilidade territorial</p>
          </div>
          <span className="text-[11px] bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full">Top 3</span>
        </div>
        <div className="space-y-5">
          {zonasCriticas.length === 0 ? (
            <p className="text-xs text-[#74777d] text-center py-6">Nenhuma zona com risco identificado.</p>
          ) : (
            zonasCriticas.map((spot, index) => {
              const cor = CORES_POR_POSICAO[index];
              const score = getDangerScore(spot) ?? 0;
              return (
                <div key={spot.id} className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <div className="flex justify-between items-center text-xs font-semibold mb-2 gap-2">
                    <span className="flex items-center gap-1.5 text-[#041627] font-bold min-w-0">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${cor.texto}`} />
                      <span className="truncate">{spot.nome || spot.name || 'Local Sem Nome'}</span>
                    </span>
                    <span className={`${cor.texto} ${cor.badge} font-bold px-2 py-0.5 rounded border whitespace-nowrap`}>
                      {Math.round(score)} pts / 100 reviews
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                    <div className={`${cor.fundo} h-full rounded-full`} style={{ width: `${Math.min(score, 100)}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
