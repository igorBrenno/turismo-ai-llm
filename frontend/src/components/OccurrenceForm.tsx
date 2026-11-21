import { useState } from 'react';
import { Check, Loader2, Siren } from 'lucide-react';
import { useAuth, type cityChoice } from '../contexts/AuthContext';
import { useAnalyzedSpots } from '../hooks/useCityAnalysis';
import { DANGER_TYPES, OccurrenceService, type DangerType } from '../services/OccurrenceService';
import CityAutocompleteInput from './CityAutocompleteInput';

const FIELD_CLASS = 'w-full px-4 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627] disabled:opacity-60';
const LABEL_CLASS = 'text-xs font-semibold text-[#041627] tracking-wide';

// Registro manual de ocorrência: vai direto para os alertas da cidade, sem IA e sem somar pontos de perigo
export default function OccurrenceForm() {
  const { currentUser } = useAuth();

  const [city, setCity] = useState<cityChoice | null>(currentUser?.cityChoiceForAnalysis ?? null);
  const [placeId, setPlaceId] = useState('');
  const [tipoPerigo, setTipoPerigo] = useState<DangerType | ''>('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const spots = useAnalyzedSpots(city?.placeId);
  const selectedSpot = spots.find(spot => spot.id === placeId);
  const canSubmit = !!city?.placeId && !!selectedSpot && !!tipoPerigo && descricao.trim().length >= 3 && !saving;

  const handleCityChange = (newCity: cityChoice | null) => {
    setCity(newCity);
    setPlaceId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !city?.placeId || !selectedSpot || !tipoPerigo) return;

    setSaving(true);
    setSaved(false);
    setErrorMessage('');
    try {
      await OccurrenceService.create({
        cityPlaceId: city.placeId,
        placeId: selectedSpot.id,
        spotNome: selectedSpot.nome || selectedSpot.name || '',
        tipoPerigo,
        descricao: descricao.trim(),
      });
      setPlaceId('');
      setTipoPerigo('');
      setDescricao('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      setErrorMessage('Não foi possível registrar a ocorrência. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
        <Siren className="w-5 h-5 text-[#ba1a1a]" />
        <div>
          <h3 className="text-sm font-bold text-[#041627] uppercase tracking-wider">Registrar ocorrência</h3>
          <p className="text-[11px] text-[#74777d]">Aparece nos alertas da cidade no Dashboard. Não altera o índice de perigo do ponto.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={LABEL_CLASS} htmlFor="occurrenceCity">Cidade</label>
          <CityAutocompleteInput id="occurrenceCity" value={city} onChange={handleCityChange} disabled={saving} />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLASS} htmlFor="occurrenceSpot">Ponto turístico</label>
          <select
            id="occurrenceSpot"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            disabled={!city?.placeId || spots.length === 0 || saving}
            className={FIELD_CLASS}
          >
            <option value="">{spots.length === 0 ? 'Nenhum ponto analisado nesta cidade' : 'Selecione o ponto'}</option>
            {spots.map(spot => (
              <option key={spot.id} value={spot.id}>{spot.nome || spot.name || 'Local sem nome'}</option>
            ))}
          </select>
          {city?.placeId && spots.length === 0 && (
            <p className="text-[11px] text-[#74777d]">Faça a varredura da cidade no Dashboard para carregar os pontos.</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="occurrenceType">Tipo de perigo</label>
        <select
          id="occurrenceType"
          value={tipoPerigo}
          onChange={(e) => setTipoPerigo(e.target.value as DangerType)}
          disabled={saving}
          className={FIELD_CLASS}
        >
          <option value="">Selecione o tipo</option>
          {DANGER_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="occurrenceDescription">O que aconteceu?</label>
        <textarea
          id="occurrenceDescription"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: turista teve o celular furtado próximo ao quiosque principal, por volta das 14h."
          rows={3}
          maxLength={500}
          disabled={saving}
          className={`${FIELD_CLASS} resize-y`}
        />
      </div>

      {errorMessage && <p className="text-xs text-[#ba1a1a] font-semibold">{errorMessage}</p>}
      {saved && (
        <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
          <Check className="w-4 h-4" /> Ocorrência registrada.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs rounded-lg py-3 px-6 transition-all shadow-sm uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
        {saving ? 'Registrando...' : 'Registrar ocorrência'}
      </button>
    </form>
  );
}
