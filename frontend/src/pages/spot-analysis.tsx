import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSpotDetails } from '../hooks/useSpotDetails';
import SpotSummaryCard from '../components/spot-details/SpotSummaryCard';
import SpotAlertsList from '../components/spot-details/SpotAlertsList';
import SpotReviewsList from '../components/spot-details/SpotReviewsList';

// Detalhes de um spot a partir da deep analysis da cidade (rota /graficos/spot/:cityId/:spotId)
export default function SpotAnalysis() {
  const { cityId, spotId } = useParams();
  const { spot, alerts, reviews, loading } = useSpotDetails(cityId, spotId);

  return (
    <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <Link to="/graficos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#505f76] hover:text-[#041627]">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Gráficos
      </Link>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 text-[#041627] animate-spin" />
        </div>
      ) : !spot ? (
        <div className="bg-white border border-dashed border-[#c4c6cd] rounded-xl p-10 text-center text-sm text-[#505f76]">
          Ponto turístico não encontrado na análise desta cidade.
        </div>
      ) : (
        <>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#041627] tracking-tight">{spot.nome || spot.name || 'Local sem nome'}</h2>
          <SpotSummaryCard spot={spot} totalReviews={reviews.total ?? reviews.items.length} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {cityId && <SpotAlertsList cityId={cityId} alerts={alerts} />}
            <SpotReviewsList reviews={reviews} />
          </div>
        </>
      )}
    </div>
  );
}
