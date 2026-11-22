import ChartCard from '../components/charts/ChartCard';
import ChartsPageHeader from '../components/charts/ChartsPageHeader';
import DangerPointsExplainer from '../components/charts/DangerPointsExplainer';
import InfractionsByCategory from '../components/InfractionsByCategory';
import CriticalZones from '../components/CriticalZones';
import CriticalSpotsList from '../components/charts/CriticalSpotsList';
import { useAuth } from '../contexts/AuthContext';
import { useAnalyzedSpots } from '../hooks/useCityAnalysis';

export default function Charts() {
  const { currentUser } = useAuth();
  const cityId = currentUser?.cityChoiceForAnalysis?.placeId;
  const spots = useAnalyzedSpots(cityId);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <ChartsPageHeader />

      <DangerPointsExplainer />

      <CriticalSpotsList cityId={cityId} spots={spots} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InfractionsByCategory />
        <CriticalZones spots={spots} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Novo gráfico" description="Espaço reservado para o primeiro gráfico." />
      </div>
    </div>
  );
}
