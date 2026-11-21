import { X, MapPin, Star, ShieldAlert, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import type { TouristSpotDashboard } from '../models/Spot';

interface SpotInfoPanelProps {
  spot: TouristSpotDashboard;
  alertas?: any[];
  onClose: () => void;
}

// Classifica o nível de risco a partir do danger_score
const nivelDeRisco = (score: number) => {
  if (score >= 60) return { label: 'Alto Risco', texto: 'text-[#ba1a1a]', fundo: 'bg-[#ba1a1a]', badge: 'bg-red-50 border-red-200' };
  if (score > 0) return { label: 'Risco Moderado', texto: 'text-[#d97706]', fundo: 'bg-[#d97706]', badge: 'bg-amber-50 border-amber-200' };
  return { label: 'Seguro', texto: 'text-emerald-700', fundo: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200' };
};

const formatarData = (valor: any) => {
  if (!valor) return null;
  const data = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
  if (isNaN(data.getTime())) return null;
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function SpotInfoPanel({ spot, alertas = [], onClose }: SpotInfoPanelProps) {
  const score = spot.danger_score ?? 0;
  const risco = nivelDeRisco(score);
  const nome = spot.nome || spot.name || 'Local Sem Nome';
  const resumo = spot.resumo_ia || spot.description;
  const ultimaVarredura = formatarData(spot.ultima_varredura);

  return (
    <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[340px] max-h-[calc(100%-24px)] overflow-y-auto custom-scrollbar bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-10 select-text">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-[#F1F5F9]">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${risco.badge} border`}>
            <MapPin className={`w-4 h-4 ${risco.texto}`} />
          </div>
          <div className="min-w-0">
            <h5 className="text-sm font-bold text-[#041627] leading-tight break-words">{nome}</h5>
            {spot.category && <p className="text-[11px] text-[#74777d] mt-0.5">{spot.category}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-[#041627] hover:bg-slate-100 transition-colors shrink-0"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Indicadores */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#505f76]">Avaliação</p>
            <p className="flex items-center gap-1 text-sm font-bold text-[#041627] mt-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              {spot.rating ? spot.rating.toFixed(1) : '—'}
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#505f76]">Alertas</p>
            <p className="flex items-center gap-1 text-sm font-bold text-[#041627] mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
              {alertas.length}
            </p>
          </div>
        </div>

        {/* Barra de risco */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1 text-[#041627]">
              <ShieldAlert className={`w-3.5 h-3.5 ${risco.texto}`} /> Índice de Perigo
            </span>
            <span className={`${risco.texto} ${risco.badge} border font-bold px-2 py-0.5 rounded text-[11px]`}>
              {Math.round(score)} pts / 100 reviews · {risco.label}
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div className={`${risco.fundo} h-full rounded-full`} style={{ width: `${Math.min(score, 100)}%` }} />
          </div>
        </div>

        {/* Resumo da IA */}
        {resumo && (
          <div>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#505f76] mb-1">
              <Sparkles className="w-3 h-3" /> Resumo da IA
            </p>
            <p className="text-xs text-[#44474c] leading-relaxed">{resumo}</p>
          </div>
        )}

        {/* Alertas do spot */}
        {alertas.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#505f76] mb-1.5">Alertas Recentes</p>
            <ul className="space-y-1.5">
              {alertas.slice(0, 3).map((a) => (
                <li key={a.id} className="text-xs bg-red-50/60 border border-red-100 rounded-md px-2.5 py-1.5 text-[#1b1c1d]">
                  <span className="font-bold text-[#93000a]">{a.tipo_perigo || a.severidade}</span>
                  {a.problema && <span className="text-[#44474c]"> — {a.problema}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ultimaVarredura && (
          <p className="flex items-center gap-1 text-[11px] text-[#74777d] pt-2 border-t border-[#F1F5F9]">
            <Clock className="w-3 h-3" /> Última varredura: {ultimaVarredura}
          </p>
        )}
      </div>
    </div>
  );
}
