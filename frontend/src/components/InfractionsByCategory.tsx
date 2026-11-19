import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Shield, AlertTriangle, Wallet, Construction, HelpCircle, BarChart2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';

// Tipos de perigo que a IA pode gerar (ver PESOS_REVIEWS em backend/adapters/ai/open_ai.py)
const CATEGORIAS = [
  { tipo: 'CRIME_GRAVE', label: 'Crime Grave', Icon: Shield, barra: 'bg-[#041627]', hover: 'group-hover:bg-[#041627]', icone: 'text-[#041627]' },
  { tipo: 'FURTO', label: 'Furto', Icon: Wallet, barra: 'bg-[#ba1a1a]', hover: 'group-hover:bg-[#ba1a1a]', icone: 'text-[#ba1a1a]' },
  { tipo: 'GOLPE', label: 'Golpe', Icon: AlertTriangle, barra: 'bg-[#d97706]', hover: 'group-hover:bg-[#d97706]', icone: 'text-[#d97706]' },
  { tipo: 'INFRAESTRUTURA_PERIGOSA', label: 'Infraestrutura', Icon: Construction, barra: 'bg-[#505f76]', hover: 'group-hover:bg-[#505f76]', icone: 'text-[#505f76]' },
  { tipo: 'OUTRO', label: 'Outros', Icon: HelpCircle, barra: 'bg-[#93c5fd]', hover: 'group-hover:bg-blue-600', icone: 'text-blue-600' },
];

export default function InfractionsByCategory() {
  const auth = useAuth();
  const cityId = auth.currentUser?.cityChoiceForAnalysis?.placeId;

  const [contagem, setContagem] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cityId) return;

    const fetchAlertas = async () => {
      setLoading(true);
      try {
        const alertsRef = collection(db, 'deep_analysis_status', cityId, 'alerts');
        const snapshot = await getDocs(alertsRef);

        const novaContagem: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const tipo = (doc.data() as { tipo_perigo?: string }).tipo_perigo;
          // Tipo desconhecido ou ausente conta como "OUTRO"
          const chave = CATEGORIAS.some(c => c.tipo === tipo) ? tipo! : 'OUTRO';
          novaContagem[chave] = (novaContagem[chave] || 0) + 1;
        });
        setContagem(novaContagem);
      } catch (error) {
        console.error('Erro ao buscar alertas por categoria: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertas();
  }, [cityId]);

  const total = Object.values(contagem).reduce((soma, qtd) => soma + qtd, 0);
  const maior = Math.max(0, ...Object.values(contagem));

  return (
    <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#505f76] mb-0.5">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> Distribuição Temática
          </div>
          <h4 className="text-xl sm:text-2xl font-bold text-[#041627]">Infrações por Categoria</h4>
          <p className="text-xs text-[#74777d] mt-0.5">Alertas identificados pela IA na análise da cidade · {total} no total</p>
        </div>
      </div>

      <div className="pt-4 pb-2">
        {loading ? (
          <div className="h-64 sm:h-72 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#041627] animate-spin" />
          </div>
        ) : total === 0 ? (
          <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-[#74777d]">
            Nenhum alerta encontrado para esta cidade.
          </div>
        ) : (
          <div className="flex items-end justify-around gap-2 sm:gap-4 h-64 sm:h-72 px-1 sm:px-6 relative border-b border-[#E2E8F0]">
            {CATEGORIAS.map(({ tipo, label, Icon, barra, hover, icone }) => {
              const qtd = contagem[tipo] || 0;
              // Altura relativa à maior categoria; percentual relativo ao total de alertas
              const altura = maior > 0 ? `${(qtd / maior) * 100}%` : '0%';
              const percentual = total > 0 ? ((qtd / total) * 100).toFixed(1) : '0.0';
              return (
                <div key={tipo} className="flex flex-col items-center gap-3 flex-1 max-w-28 min-w-0 group cursor-pointer h-full justify-end">
                  <span className={`text-xs font-bold text-[#041627] bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap group-hover:-translate-y-1 ${hover} group-hover:text-white transition-all`}>
                    {qtd} {qtd === 1 ? 'caso' : 'casos'}
                  </span>
                  <div className={`w-full ${barra} rounded-t-lg transition-all duration-300 group-hover:opacity-90 shadow-md`} style={{ height: altura }}></div>
                  <div className="text-center mt-1 min-w-0">
                    <span className="text-[11px] sm:text-xs text-[#041627] font-bold flex items-center justify-center gap-1">
                      <Icon className={`w-3 h-3 shrink-0 ${icone}`} /> <span className="truncate">{label}</span>
                    </span>
                    <span className="text-[11px] text-[#505f76]">{percentual}% do total</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
