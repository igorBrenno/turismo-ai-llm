import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { 
  MapPin, 
  Search, 
  Compass, 
  Loader2, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

interface TouristSpot {
  id: string;
  city: string;
  name: string;
  description: string;
  category?: string;
  image_url?: string;
}

const MOCK_SPOTS: TouristSpot[] = [
  {
    id: '1',
    city: 'Rio de Janeiro',
    name: 'Cristo Redentor',
    description: 'Uma das sete maravilhas do mundo moderno, localizada no topo do morro do Corcovado.',
    category: 'Histórico',
    image_url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '2',
    city: 'Rio de Janeiro',
    name: 'Pão de Açúcar',
    description: 'Famoso complexo de morros localizado no bairro da Urca com o tradicional passeio de boninho.',
    category: 'Natureza',
    image_url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3',
    city: 'Paris',
    name: 'Torre Eiffel',
    description: 'O monumento pago mais visitado do mundo, ícone global da França localizado no Champ de Mars.',
    category: 'Arquitetura',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80'
  }
];

export default function CitySearch() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [cityName, setCityName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Injeta e monitora o carregamento real do script do Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    
    // Se o recurso já estiver completamente pronto na janela, atualiza o estado
    if ((window as any).google?.maps?.places?.Autocomplete) {
      setApiReady(true);
      return;
    }

    // Caso o script ainda não exista no DOM, nós o criamos
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Cria um intervalo curto para checar quando os objetos do Google terminam de se estruturar na Window
    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps?.places?.Autocomplete) {
        setApiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  // Inicializa o Autocomplete assim que a API estiver confirmada como pronta
  useEffect(() => {
    if (!apiReady || !inputRef.current) return;

    try {
      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setCityName(place.formatted_address);
        } else if (place.name) {
          setCityName(place.name);
        }
      });
    } catch (e) {
      console.error("Erro ao iniciar autocomplete:", e);
    }
  }, [apiReady]);

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    setLoading(true);
    setHasSearched(true);

    const cleanCityQuery = cityName.split(',')[0].trim().toLowerCase();

    setTimeout(() => {
      const filteredResults = MOCK_SPOTS.filter(spot => 
        spot.city.toLowerCase().includes(cleanCityQuery)
      );
      setSpots(filteredResults);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#fbf9fa] text-[#1b1c1d] font-sans antialiased selection:bg-[#d2e4fb]">
      <Header searchTerm={globalSearch} setSearchTerm={setGlobalSearch} />

      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1b1c1d] mb-1 tracking-tight">Explore Cities</h1>
          <p className="text-sm text-[#44474c]">Discover the best tourist attractions using smart autocomplete intelligence.</p>
        </div>

        {/* Formulário de Busca */}
        <section className="bg-white p-6 rounded-xl border border-[#c4c6cd] shadow-sm mb-8">
          <form onSubmit={handleCitySearch} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs font-semibold text-[#44474c]" htmlFor="cityInput">
                Enter City Name
              </label>
              
              <div className="relative">
                <input 
                  id="cityInput"
                  ref={inputRef}
                  type="text"
                  placeholder={apiReady ? "Type 'Rio de Janeiro' or 'Paris' to test..." : "Loading Google Maps API..."}
                  className="w-full bg-[#f5f3f4] border border-[#74777d] rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#041627] focus:ring-1 focus:ring-[#041627] transition-all disabled:opacity-60"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  disabled={!apiReady}
                  required
                />
                <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#44474c] z-10" />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading || !apiReady}
              className="w-full sm:w-auto min-w-[140px] bg-[#041627] hover:bg-[#1a2b3c] text-white font-bold text-xs rounded-lg py-3 px-6 transition-all shadow-sm active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-85"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>
        </section>

        {/* Área de Resultados */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4 border-b border-[#c4c6cd] pb-3">
            <Compass className="w-5 h-5 text-[#041627]" />
            <h3 className="text-xs font-bold text-[#1b1c1d] uppercase tracking-widest">
              {loading ? 'Searching Attractions...' : 'Tourist Attractions'}
            </h3>
          </div>

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#041627] animate-spin" />
              <p className="text-sm font-medium text-[#44474c]">Filtering mock records from component state...</p>
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="bg-[#efedef] p-6 rounded-lg flex items-start gap-4 border border-[#c4c6cd]/40">
              <Info className="w-5 h-5 text-[#54647a] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#1b1c1d]">Prototype Interface (Ready for Google API)</h4>
                <p className="text-xs leading-normal text-[#54647a] mt-0.5">
                  Try typing one of the built-in targets (<strong>Rio de Janeiro</strong> or <strong>Paris</strong>) to simulate response cards.
                </p>
              </div>
            </div>
          )}

          {!loading && hasSearched && spots.length === 0 && (
            <div className="bg-[#ffdad6]/20 border border-[#ba1a1a]/20 p-6 rounded-lg flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#ba1a1a]">No Attractions Found</h4>
                <p className="text-xs leading-normal text-[#44474c] mt-0.5">
                  No spots mapped locally for "{cityName}".
                </p>
              </div>
            </div>
          )}

          {!loading && spots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spots.map((spot) => (
                <div key={spot.id} className="bg-white rounded-xl border border-[#c4c6cd] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-48 bg-[#e4e2e3] relative">
                    <img 
                      src={spot.image_url} 
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                    {spot.category && (
                      <span className="absolute top-3 left-3 bg-[#041627] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                        {spot.category}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-lg font-bold text-[#1b1c1d] tracking-tight">{spot.name}</h4>
                      <p className="text-xs text-[#44474c] mt-1.5 leading-relaxed">{spot.description}</p>
                    </div>
                    <div className="pt-3 border-t border-[#efedef] flex justify-end">
                      <button type="button" className="text-xs font-bold text-[#041627] hover:underline uppercase tracking-wider">
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}