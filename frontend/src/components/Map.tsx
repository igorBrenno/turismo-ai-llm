import { useEffect, useRef } from 'react';
import type { TouristSpot } from '../models/Spot';
import { collorChoosing } from '../utils/collorChoosingOnMarker';

export interface SpotsMapProps {
  spots: TouristSpot[];
  selectedSpot?: TouristSpot | null;
  onSpotClick?: (spot: TouristSpot) => void;
  height?: string;
}

export default function SpotsMap({ 
  spots, 
  selectedSpot, 
  onSpotClick, 
  height = "400px" 
}: SpotsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    
    const initMap = async () => {
      if (!mapRef.current || !(window as any).google?.maps) return;
      
      try {
       
        const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker");
        const { Map, InfoWindow } = await (window as any).google.maps.importLibrary("maps");
        const { LatLngBounds } = await (window as any).google.maps.importLibrary("core");
        
        if (cancelled) return;

        if(!googleMapRef.current) {
          // 2. CORRIGIDO: Usando direto a classe Map importada acima
          googleMapRef.current = new Map(mapRef.current, {
            mapId : 'DEMO_MAP_ID',
            zoom: selectedSpot ? 16 : 12,
            center: selectedSpot 
              ? { lat: selectedSpot.lat, lng: selectedSpot.lng }
              : { lat: -14.235, lng: -51.925 }, 
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }
        
        const map = googleMapRef.current;

        // 3. CORRIGIDO: AdvancedMarkerElement não usa setMap(null), usa m.map = null
        markersRef.current.forEach(m => { m.map = null });
        markersRef.current = [];

        

        // MODO DETALHES (Modo Ponto Único)
        if (selectedSpot && selectedSpot.lat) {
          const position = { lat: selectedSpot.lat, lng: selectedSpot.lng };
          
          map.setCenter(position);
          map.setZoom(17); 
          const rating = selectedSpot.rating;
            
          const { background, borderColor, glyphColor } = collorChoosing(rating ?? 0);
          const spotPin = new PinElement({
              background,
              borderColor,
              glyphColor,
            });
          const marker = new AdvancedMarkerElement({
            position,
            map,
            title: selectedSpot.name,
            content : spotPin,
          });
          console.log(rating)

          // CORRIGIDO: Usando direto a classe InfoWindow
          const infoWindow = new InfoWindow({
            content: `
              <div style="padding: 4px; max-width: 180px;">
                <strong style="font-size: 13px; color: #1b1c1d;">${selectedSpot.name}</strong>
                <p style="font-size: 11px; color: #54647a; margin-top: 4px;">${selectedSpot.description}</p>
              </div>
            `,
          });

          marker.addListener('click', () => infoWindow.open(map, marker));
          infoWindow.open(map, marker);
          markersRef.current.push(marker);
          return;
        }

        
        // MODO PESQUISA (Múltiplos Pontos)
        if (spots.length > 0) {
          const bounds = new LatLngBounds();

          spots.forEach((spot) => {
            if (!spot.lat || !spot.lng) return;

            const position = { lat: spot.lat, lng: spot.lng };
            bounds.extend(position);
            const rating = spot.rating;
            
            const { background, borderColor, glyphColor } = collorChoosing(rating ?? 0);
            
            // Cria um novo PinElement exclusivo para este marcador
            const spotPin = new PinElement({
              background,
              borderColor,
              glyphColor,
            });

            const marker = new AdvancedMarkerElement({
              position,
              map,
              title: spot.name,
              content: spotPin, // Usa o elemento recém-criado
            });

            marker.addListener('click', () => {
              if (onSpotClick) onSpotClick(spot);
            });

            markersRef.current.push(marker);
          });

          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error("Erro ao carregar o AdvancedMarkerElement", error);
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [spots, selectedSpot]);

  return (
    <div 
      ref={mapRef} 
      className="w-full rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden" 
      style={{ height }}
    />
  );
}