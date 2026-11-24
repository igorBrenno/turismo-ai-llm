import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { AlertTriangle, Flame } from 'lucide-react';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

interface InfractionCounts {
  cityId: string;
  ativas: number; // alertas com resolvida == false
  total: number;  // todos os alertas da cidade, resolvidos ou não
}

// Card "Infrações Ativas": quantos alertas da cidade ainda não foram resolvidos e quantos existem no total
export default function Infractions() {
  const { currentUser } = useAuth();
  const cityId = currentUser?.cityChoiceForAnalysis?.placeId;
  const [counts, setCounts] = useState<InfractionCounts | null>(null);

  useEffect(() => {
    if (!cityId) return;
    const alertsRef = collection(db, 'deep_analysis_status', cityId, 'alerts');

    Promise.all([
      getCountFromServer(query(alertsRef, where('resolvida', '==', false))),
      getCountFromServer(alertsRef),
    ])
      .then(([ativas, total]) => setCounts({ cityId, ativas: ativas.data().count, total: total.data().count }))
      .catch(error => console.error('Erro ao contar as infrações:', error));
  }, [cityId]);

  // Ignora contagens de outra cidade enquanto as da cidade atual carregam
  const current = counts?.cityId === cityId ? counts : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Infrações Ativas</p>
          <h3 className="text-[36px] font-bold text-[#041627] mt-2 tracking-tight">{current?.ativas ?? 0}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-50 text-[#ba1a1a] flex items-center justify-center transition-transform group-hover:scale-105">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
      <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-[#ba1a1a]">
          <Flame className="w-3 h-3" /> Atenção Imediata
        </span>
        <span className="text-[#74777d]">{current?.total ?? 0} Alertas no total</span>
      </div>
    </div>
  );
}
