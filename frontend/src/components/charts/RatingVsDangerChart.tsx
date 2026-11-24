import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TouristSpotDashboard } from '../../models/Spot';
import { getDangerScore } from '../../utils/dangerScore';
import ChartCard from './ChartCard';

interface RatingVsDangerChartProps {
  cityId?: string | null;
  spots: TouristSpotDashboard[];
}

interface Point {
  id: string;
  name: string;
  rating: number;
  score: number;
}


const COLORS = {
  series: '#2a78d6',
  surface: '#ffffff',
  grid: '#E2E8F0',
  zone: '#ba1a1a',
  textPrimary: '#041627',
  textSecondary: '#505f76',
};

const HEIGHT = 520;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 52 };
const RATING_MIN = 1;
const RATING_MAX = 5;
// Zona de atenção: bem avaliados no Google e entre os 25% mais perigosos da cidade
const HIGH_RATING = 4;
const DANGER_PERCENTILE = 0.75;

const spotName = (spot: TouristSpotDashboard) => spot.nome || spot.name || 'Local sem nome';

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

// Arredonda o topo do eixo para um valor "redondo" e gera 5 marcações
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 25, 50, 75, 100];
  const rawStep = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(s => s >= rawStep) ?? rawStep;
  return Array.from({ length: 5 }, (_, i) => Math.round(i * step));
}


function useWidth<T extends HTMLElement>() {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(0);

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    observerRef.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observerRef.current.observe(element);
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);
  return [ref, width] as const;
}

export default function RatingVsDangerChart({ cityId, spots }: RatingVsDangerChartProps) {
  const navigate = useNavigate();
  const [containerRef, width] = useWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<Point | null>(null);

  // Só spots com nota no Google e índice confiável (com reviews suficientes)
  const points: Point[] = spots.flatMap(spot => {
    const score = getDangerScore(spot);
    return score != null && spot.rating ? [{ id: spot.id, name: spotName(spot), rating: spot.rating, score }] : [];
  });

  const yTicks = niceTicks(Math.max(0, ...points.map(p => p.score)));
  const yMax = yTicks[yTicks.length - 1];
  const dangerThreshold = Math.max(1, percentile(points.filter(p => p.score > 0).map(p => p.score), DANGER_PERCENTILE));
  const inZone = (p: Point) => p.rating >= HIGH_RATING && p.score >= dangerThreshold;
  const zoneCount = points.filter(inZone).length;

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (rating: number) => MARGIN.left + ((rating - RATING_MIN) / (RATING_MAX - RATING_MIN)) * plotWidth;
  const y = (score: number) => MARGIN.top + plotHeight - (score / yMax) * plotHeight;

  const openSpot = (point: Point) => {
    if (cityId) navigate(`/graficos/spot/${cityId}/${point.id}`);
  };

  return (
    <ChartCard
      title="Nota no Google × Índice de perigo"
      description="Cada ponto é um local. A área destacada reúne lugares bem avaliados no Google, mas entre os mais perigosos da cidade."
    >
      {points.length === 0 ? (
        <p className="text-sm text-[#74777d] text-center py-10">Nenhum ponto com nota e índice de perigo para exibir.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#505f76]">
            <strong className="text-[#041627]">{zoneCount}</strong> {zoneCount === 1 ? 'local parece seguro' : 'locais parecem seguros'} pela nota,
            mas {zoneCount === 1 ? 'tem' : 'têm'} muitos relatos de perigo (nota ≥ {HIGH_RATING} e índice ≥ {Math.round(dangerThreshold)} pts).
          </p>

          <div ref={containerRef} className="relative w-full" style={{ height: HEIGHT }}>
            {width > 0 && (
              <svg width={width} height={HEIGHT} role="img" aria-label="Gráfico de dispersão: nota no Google por índice de perigo de cada local">
                
                <rect
                  x={x(HIGH_RATING)}
                  y={y(yMax)}
                  width={x(RATING_MAX) - x(HIGH_RATING)}
                  height={Math.max(0, y(Math.min(dangerThreshold, yMax)) - y(yMax))}
                  fill={COLORS.zone}
                  fillOpacity={0.06}
                />

                {/* Grade e eixo Y */}
                {yTicks.map(tick => (
                  <g key={tick}>
                    <line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(tick)} y2={y(tick)} stroke={COLORS.grid} strokeWidth={1} />
                    <text x={MARGIN.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={COLORS.textSecondary}>
                      {tick}
                    </text>
                  </g>
                ))}

                {/* Eixo X */}
                {[1, 2, 3, 4, 5].map(tick => (
                  <text key={tick} x={x(tick)} y={MARGIN.top + plotHeight + 18} textAnchor="middle" fontSize={11} fill={COLORS.textSecondary}>
                    {tick.toFixed(1)}
                  </text>
                ))}
                <text x={MARGIN.left + plotWidth / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={11} fill={COLORS.textSecondary}>
                  Nota no Google
                </text>
                <text
                  transform={`translate(12 ${MARGIN.top + plotHeight / 2}) rotate(-90)`}
                  textAnchor="middle"
                  fontSize={11}
                  fill={COLORS.textSecondary}
                >
                  Índice de perigo (pts / 100 reviews)
                </text>

                
                {points.map(point => (
                  <g
                    key={point.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`${point.name}: nota ${point.rating.toFixed(1)}, ${Math.round(point.score)} pts. Abrir detalhes`}
                    style={{ cursor: 'pointer', outline: 'none' }}
                    onMouseEnter={() => setHovered(point)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(point)}
                    onBlur={() => setHovered(null)}
                    onClick={() => openSpot(point)}
                    onKeyDown={(e) => e.key === 'Enter' && openSpot(point)}
                  >
                    <circle cx={x(point.rating)} cy={y(point.score)} r={10} fill="transparent" pointerEvents="all" />
                    <circle
                      cx={x(point.rating)}
                      cy={y(point.score)}
                      r={hovered?.id === point.id ? 6 : 4.5}
                      fill={COLORS.series}
                      stroke={COLORS.surface}
                      strokeWidth={2}
                    />
                  </g>
                ))}
              </svg>
            )}

            {/* Tooltip */}
            {hovered && width > 0 && (
              <div
                className="absolute pointer-events-none bg-white border border-[#E2E8F0] rounded-lg shadow-md px-3 py-2 text-xs whitespace-nowrap"
                style={{
                  left: Math.min(x(hovered.rating) + 12, width - 180),
                  top: Math.max(0, y(hovered.score) - 56),
                }}
              >
                <p className="font-bold text-[#041627] max-w-[160px] truncate">{hovered.name}</p>
                <p className="text-[#505f76]">Nota: <strong className="text-[#041627]">{hovered.rating.toFixed(1)}</strong></p>
                <p className="text-[#505f76]">Perigo: <strong className="text-[#041627]">{Math.round(hovered.score)} pts</strong></p>
                {inZone(hovered) && <p className="text-[#ba1a1a] font-semibold mt-0.5">Na zona de atenção</p>}
                <p className="text-[#2563eb] font-semibold mt-1">Clique para ver mais</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#74777d]">
            Clique em um ponto para ver os detalhes do local. Locais sem nota ou com menos de 5 reviews não aparecem.
          </p>

          
          <table className="sr-only">
            <caption>Nota no Google e índice de perigo por local</caption>
            <thead>
              <tr><th>Local</th><th>Nota</th><th>Índice de perigo</th></tr>
            </thead>
            <tbody>
              {points.map(point => (
                <tr key={point.id}><td>{point.name}</td><td>{point.rating}</td><td>{Math.round(point.score)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
