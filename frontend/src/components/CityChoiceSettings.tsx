import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, MapPin } from 'lucide-react';
import { useAuth, type cityChoice } from '../contexts/AuthContext';
import { updateUserCityChoice } from '../utils/Firebase';

export default function CityChoiceSettings() {
  const { currentUser, setCurrentUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [apiReady, setApiReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState<cityChoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentCity = currentUser?.cityChoiceForAnalysis ?? null;

  // Carrega o script do Google Maps (Places) caso ainda não esteja na página
  useEffect(() => {
    if ((window as any).google?.maps?.places) {
      setApiReady(true);
      return;
    }

    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps?.places) {
        setApiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  // Liga o Autocomplete de cidades ao input
  useEffect(() => {
    if (!apiReady || !inputRef.current) return;

    const googleMaps = (window as any).google.maps;
    const autocomplete = new googleMaps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      setErrorMessage('');
      setIsSaved(false);

      if (place?.geometry?.location && place.place_id) {
        setSelectedCity({
          name: place.formatted_address ?? place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        });
      } else {
        setSelectedCity(null);
        setErrorMessage('Selecione uma cidade da lista de sugestões.');
      }
    });

    return () => googleMaps.event.removeListener(listener);
  }, [apiReady]);

  const isSameCity = !!selectedCity && selectedCity.placeId === currentCity?.placeId;

  const handleSave = async () => {
    if (!currentUser || !selectedCity || isSameCity) return;

    setIsSaving(true);
    setErrorMessage('');
    try {
      await updateUserCityChoice(currentUser.uid, selectedCity);
      // Atualiza o contexto para o dashboard e os demais componentes trocarem de cidade na hora
      setCurrentUser({ ...currentUser, cityChoiceForAnalysis: selectedCity });

      setSelectedCity(null);
      if (inputRef.current) inputRef.current.value = '';
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (error: any) {
      console.error('Erro ao atualizar cidade de análise:', error);
      setErrorMessage(`Não foi possível salvar a cidade: ${error.message ?? error}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-[#c4c6cd] pb-3">
        <MapPin className="w-5 h-5 text-[#041627]" />
        <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">Cidade de Análise</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-[#efedef] p-4 rounded-lg flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#54647a]">Cidade atual</p>
            <p className="text-sm font-bold text-[#1b1c1d]">{currentCity?.name ?? 'Nenhuma cidade selecionada'}</p>
          </div>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
              <Check className="w-4 h-4" /> Atualizada
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-[#44474c]" htmlFor="analysisCity">Nova cidade</label>
            <input
              ref={inputRef}
              id="analysisCity"
              type="text"
              disabled={!apiReady || isSaving}
              placeholder={apiReady ? 'Digite e selecione uma cidade...' : 'Carregando Google Maps...'}
              onChange={() => selectedCity && setSelectedCity(null)}
              // Enter escolhe a sugestão do Autocomplete; não deve enviar o formulário do perfil
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedCity || isSameCity || isSaving}
            className="min-w-[150px] px-6 py-3 bg-[#041627] hover:bg-[#1a2b3c] text-white font-bold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'Salvando...' : 'Trocar cidade'}
          </button>
        </div>

        {isSameCity && <p className="text-xs text-[#54647a]">Essa já é a sua cidade de análise atual.</p>}
        {errorMessage && <p className="text-xs text-red-700">{errorMessage}</p>}
      </div>
    </section>
  );
}
