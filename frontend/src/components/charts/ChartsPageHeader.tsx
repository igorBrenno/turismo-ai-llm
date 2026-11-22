import { useAuth } from '../../contexts/AuthContext';
import ExportCityJsonButton from '../ExportCityJsonButton';

export default function ChartsPageHeader() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#505f76] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#041627]"></span>
          {currentUser?.cityChoiceForAnalysis?.name ?? 'Sua cidade'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#041627] tracking-tight">Gráficos</h2>
        <p className="text-sm text-[#505f76] mt-1 max-w-2xl">
          Visualize os indicadores de segurança dos pontos turísticos da cidade.
        </p>
      </div>
      <div className="self-start md:self-auto">
        <ExportCityJsonButton />
      </div>
    </div>
  );
}
