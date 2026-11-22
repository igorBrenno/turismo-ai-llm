import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CityExportService } from '../services/CityExportService';
import { downloadJson, slugify } from '../utils/downloadFile';

// Baixa os dados da cidade selecionada (cidade, spots e alertas) em um arquivo .json
export default function ExportCityJsonButton() {
  const { currentUser } = useAuth();
  const city = currentUser?.cityChoiceForAnalysis;
  const [exporting, setExporting] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleExport = async () => {
    if (!city?.placeId) return;

    setExporting(true);
    setFailed(false);
    try {
      const data = await CityExportService.buildCityExport(city.placeId, city.name);
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(`${slugify(city.name)}-${date}.json`, data);
    } catch (error) {
      console.error('Erro ao exportar dados da cidade:', error);
      setFailed(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!city?.placeId || exporting}
      title={failed ? 'Não foi possível exportar. Tente novamente.' : 'Baixar os dados da cidade em JSON'}
      className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
        failed ? 'border-red-200 bg-red-50 text-[#ba1a1a]' : 'border-[#E2E8F0] bg-white text-[#44474c] hover:bg-[#F1F5F9]'
      }`}
    >
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      {exporting ? 'Exportando...' : failed ? 'Falhou, tentar de novo' : 'Exportar JSON'}
    </button>
  );
}
