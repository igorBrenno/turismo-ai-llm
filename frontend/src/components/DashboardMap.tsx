import { useEffect, useRef, useState } from 'react';
import type { TouristSpot } from '../models/Spot';
import { useAuth } from '../contexts/AuthContext';
import { collorChoosing } from '../utils/collorChoosingOnMarker';
import { GooglePlaceService } from '../services/GooglePlaceServices';


interface SpotsMapDashboardProps {
  spots: TouristSpot[];
  selectedSpot?: TouristSpot | null;
  onSpotClick?: (spot: TouristSpot) => void;
  height?: string;
  setSpots : any;
}

export default function DashboardSpotsMap({ 
  spots, 
  selectedSpot, 
  onSpotClick, 
  height = "400px" ,
  setSpots
}: SpotsMapDashboardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lat = auth.currentUser?.cityChoiceForAnalysis?.lat
  const lng = auth.currentUser?.cityChoiceForAnalysis?.lng


  const [apiReady, setApiReady] = useState<boolean>(false)


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
  }, [])


  useEffect(() => {
    let cancelled = false;
    
    const initMap = async () => {
      if (!mapRef.current || !(window as any).google?.maps || lat === undefined || lng === undefined || !apiReady) return;

      try {
        const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker");
        const { Map, InfoWindow } = await (window as any).google.maps.importLibrary("maps");
        const { LatLngBounds } = await (window as any).google.maps.importLibrary("core");

        if (cancelled) return;
        

        if (!googleMapRef.current ) {
          googleMapRef.current = new Map(mapRef.current, {
            mapId: 'DEMO_MAP_ID',
            zoom: selectedSpot ? 16 : 12,
            center: { lat: lat , lng: lng },
            mapTypeControl: false,
            streetViewControl: false,
            
          });
        }

        const map = googleMapRef.current;
        
        
        
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

          const infoWindow = new InfoWindow({
            content: `
              <div style="padding: 4px; max-width: 180px;">
                <strong style="font-size: 13px; color: #1b1c1d;">${selectedSpot.name}</strong>
                <p style="font-size: 11px; color: #54647a; margin-top: 4px;">${selectedSpot.description}</p>
              </div>
            `,
          });

          marker.addEventListener('gmp-click', () => infoWindow.open(map, marker));
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
            
            
            const spotPin = new PinElement({
              background,
              borderColor,
              glyphColor,
            });
            const marker = new AdvancedMarkerElement({
              position,
              map,
              title: spot.name,
              content: spotPin,
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

  useEffect(() => {
    const fetchCitySpots = async () => {
      const cityName = auth.currentUser?.cityChoiceForAnalysis?.name ?? null
          let results
          if(cityName){
            results = await GooglePlaceService.fetchSpots(cityName)
          }
          setSpots(results)
    }
    fetchCitySpots();
  },[auth.currentUser?.cityChoiceForAnalysis?.name, setSpots])


  return (
    <div 
      ref={mapRef} 
      className="w-full rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden" 
      style={{ height }}
    />
  );
}