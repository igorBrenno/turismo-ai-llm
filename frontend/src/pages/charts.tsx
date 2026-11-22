import ChartCard from '../components/charts/ChartCard';
import ChartsPageHeader from '../components/charts/ChartsPageHeader';

export default function Charts() {
  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <ChartsPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Novo gráfico" description="Espaço reservado para o primeiro gráfico." />
      </div>
    </div>
  );
}
