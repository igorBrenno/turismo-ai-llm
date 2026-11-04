import { useEffect, useRef, useState } from 'react';
import type { TouristSpotDashboard } from '../models/Spot';
import { useAuth } from '../contexts/AuthContext';
import { collorChoosing } from '../utils/collorChoosingOnMarker';

interface SpotsMapDashboardProps {
  spots: TouristSpotDashboard[];
  selectedSpot?: TouristSpotDashboard | null;
  onSpotClick?: (spot: TouristSpotDashboard) => void;
  height?: string;
  setSpots?: any; // Mantido para não quebrar a tipagem com o pai
}

export default function DashboardSpotsMap({ 
  spots, 
  selectedSpot, 
  onSpotClick, 
  height = "400px",
  setSpots // Não será mais usado aqui, os dados já chegam prontos do Firebase
}: SpotsMapDashboardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lat = auth.currentUser?.cityChoiceForAnalysis?.lat;
  const lng = auth.currentUser?.cityChoiceForAnalysis?.lng;

  const [apiReady, setApiReady] = useState<boolean>(false);

  // Carrega a API do Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if((window as any).google?.maps?.importLibrary){
      setApiReady(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');

    if(!existingScript){
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps?.importLibrary) {
        setApiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);
    return () => clearInterval(checkInterval);
  }, []);

  // Inicializa o Mapa e Plota os Pinos
  useEffect(() => {
    let cancelled = false;
    
    const initMap = async () => {
      if (!mapRef.current || !(window as any).google?.maps || lat === undefined || lng === undefined || !apiReady) return;

      try {
        const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");
        const { Map, InfoWindow } = await (window as any).google.maps.importLibrary("maps");
        const { LatLngBounds } = await (window as any).google.maps.importLibrary("core");

        if (cancelled) return;

        if (!googleMapRef.current ) {
          googleMapRef.current = new Map(mapRef.current, {
            mapId: 'DEMO_MAP_ID', // Troque pelo seu Map ID real se quiser customizações de mapa base
            zoom: selectedSpot ? 16 : 12,
            center: { lat: lat , lng: lng },
            mapTypeControl: false,
            streetViewControl: false,
          });
        }

        const map = googleMapRef.current;
        
        // Limpa os pinos velhos antes de desenhar os novos
        markersRef.current.forEach(m => { m.map = null });
        markersRef.current = [];

        // --- FUNÇÃO DE CRIAÇÃO DO PINO ANIMADO ---
        const createCustomPin = (rating: number, perigoScore: number = 0) => {
          const isDangerous = perigoScore > 0;
          const { background, borderColor } = collorChoosing(rating);
          
          const pinDiv = document.createElement('div');
          pinDiv.className = `custom-advanced-pin ${isDangerous ? 'danger-pulse' : ''}`;
          
          pinDiv.style.backgroundColor = background;
          pinDiv.style.borderColor = isDangerous ? '#dc2626' : borderColor;
          
          if (isDangerous) {
            pinDiv.innerHTML = `<span style="font-size: 14px;">⚠️</span>`;
          }
          return pinDiv;
        };

        // MODO DETALHES (Modo Ponto Único)
        if (selectedSpot && selectedSpot.lat) {
          const position = { lat: selectedSpot.lat, lng: selectedSpot.lng };
          
          map.setCenter(position);
          map.setZoom(17); 
          
          const rating = selectedSpot.rating ?? 0;
          const perigoScore = (selectedSpot as any).perigo_score || 0; // Previne erro do TS
            
          const pinDiv = createCustomPin(rating, perigoScore);

          const marker = new AdvancedMarkerElement({
            position,
            map,
            title: selectedSpot.name,
            content : pinDiv,
          });

          const infoWindow = new InfoWindow({
            content: `
              <div style="padding: 4px; max-width: 180px;">
                <strong style="font-size: 13px; color: #1b1c1d;">${selectedSpot.name}</strong>
                <p style="font-size: 11px; color: #54647a; margin-top: 4px;">
                   ${(selectedSpot as any).resumo_ia || selectedSpot.description || ''}
                </p>
              </div>
            `,
          });

          marker.addEventListener('gmp-click', () => infoWindow.open(map, marker));
          infoWindow.open(map, marker);
          markersRef.current.push(marker);
          return;
        }

        // MODO VISÃO GERAL (Múltiplos Pontos)
        if (spots.length > 0) {
          const bounds = new LatLngBounds();

          spots.forEach((spot) => {
            if (!spot.lat || !spot.lng) return;

            const position = { lat: spot.lat, lng: spot.lng };
            bounds.extend(position);

            const rating = spot.rating ?? 0;
            const danger_score = (spot as any).danger_score || 0;
            
            const pinDiv = createCustomPin(rating, danger_score);

            const marker = new AdvancedMarkerElement({
              position,
              map,
              title: spot.name,
              content: pinDiv,
            });

            marker.addEventListener('gmp-click', () => {
              if (onSpotClick) onSpotClick(spot);
            });

            markersRef.current.push(marker);
          });

          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error("Erro ao carregar mapa", error);
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [spots, selectedSpot, lat, lng, apiReady]);

  return (
    <div 
      ref={mapRef} 
      className="w-full rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden" 
      style={{ height }}
    />
  );
}