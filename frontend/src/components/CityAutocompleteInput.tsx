import { useEffect, useRef, useState } from 'react';
import type { cityChoice } from '../contexts/AuthContext';

interface CityAutocompleteInputProps {
  id: string;
  value: cityChoice | null;
  onChange: (city: cityChoice | null) => void;
  disabled?: boolean;
}

// O SDK do Google Maps é carregado por script, sem tipos no projeto
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const googleMaps = (): any => (window as unknown as { google?: { maps?: unknown } }).google?.maps;

const isPlacesReady = () => !!googleMaps()?.places;

// Carrega o script do Google Maps (Places) caso ainda não esteja na página
function useGooglePlaces() {
  const [ready, setReady] = useState(isPlacesReady);

  useEffect(() => {
    if (ready) return;

    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if (isPlacesReady()) {
        setReady(true);
        clearInterval(checkInterval);
      }
    }, 100);
    return () => clearInterval(checkInterval);
  }, [ready]);

  return ready;
}

// Campo de texto com sugestões de cidades do Google Places
export default function CityAutocompleteInput({ id, value, onChange, disabled }: CityAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const apiReady = useGooglePlaces();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Mostra a cidade selecionada no campo (sem apagar o texto enquanto a pessoa digita)
  useEffect(() => {
    if (inputRef.current && value) inputRef.current.value = value.name;
  }, [value]);

  useEffect(() => {
    if (!apiReady || !inputRef.current) return;

    const maps = googleMaps();
    const autocomplete = new maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place?.geometry?.location && place.place_id) {
        setErrorMessage('');
        onChangeRef.current({
          name: place.formatted_address ?? place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        });
      } else {
        setErrorMessage('Selecione uma cidade da lista de sugestões.');
        onChangeRef.current(null);
      }
    });

    return () => maps.event.removeListener(listener);
  }, [apiReady]);

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        id={id}
        type="text"
        disabled={!apiReady || disabled}
        placeholder={apiReady ? 'Digite e selecione uma cidade...' : 'Carregando Google Maps...'}
        // Digitar invalida a cidade escolhida até uma nova sugestão ser selecionada
        onChange={() => value && onChangeRef.current(null)}
        // Enter escolhe a sugestão do Autocomplete; não deve enviar o formulário
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        className="w-full px-4 py-2.5 bg-[#fbf9fa] border border-[#c4c6cd] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#041627] focus:border-[#041627] disabled:opacity-60"
      />
      {errorMessage && <p className="text-[11px] text-[#ba1a1a]">{errorMessage}</p>}
    </div>
  );
}
