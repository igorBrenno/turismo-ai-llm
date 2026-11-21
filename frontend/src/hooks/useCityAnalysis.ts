import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { TouristSpotDashboard } from '../models/Spot';

export type AnalysisStatus = 'idle' | 'processing' | 'error';

export interface CityAlert {
  id: string;
  place_id?: string;
  review_id?: string;
  tipo_perigo?: string;
  justificativa?: string;
  reporter?: string;
  danger_points_added?: number;
  resolvida?: boolean;
  // Campos derivados para exibição
  localidade: string;
  problema: string;
  severidade: 'Alto' | 'Médio';
  horario: string;
}

type RawCityAlert = Omit<CityAlert, 'localidade' | 'problema' | 'severidade' | 'horario'>;


interface CityScoped<T> {
  cityId: string;
  data: T;
}

const fromCity = <T,>(state: CityScoped<T> | null, cityId: string | null | undefined, fallback: T): T =>
  state && state.cityId === cityId ? state.data : fallback;

const NO_SPOTS: TouristSpotDashboard[] = [];
const NO_ALERTS: RawCityAlert[] = [];

// Status da deep analysis da cidade (deep_analysis_status/{cidade})
export function useDeepAnalysisStatus(cityId?: string | null): AnalysisStatus {
  const [state, setState] = useState<CityScoped<AnalysisStatus> | null>(null);

  useEffect(() => {
    if (!cityId) return;

    return onSnapshot(
      doc(db, 'deep_analysis_status', cityId),
      (docSnap) => setState({ cityId, data: (docSnap.data()?.analysis_status as AnalysisStatus) || 'idle' }),
      (error) => console.error('Erro ao escutar status da análise:', error),
    );
  }, [cityId]);

  return fromCity(state, cityId, 'idle');
}

// Spots analisados da cidade (deep_analysis_status/{cidade}/spots), atualizados em tempo real
export function useAnalyzedSpots(cityId?: string | null): TouristSpotDashboard[] {
  const [state, setState] = useState<CityScoped<TouristSpotDashboard[]> | null>(null);

  useEffect(() => {
    if (!cityId) return;

    return onSnapshot(
      collection(db, 'deep_analysis_status', cityId, 'spots'),
      (snapshot) => setState({
        cityId,
        data: snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as TouristSpotDashboard)),
      }),
      (error) => console.error('Erro ao escutar spots do mapa:', error),
    );
  }, [cityId]);

  return fromCity(state, cityId, NO_SPOTS);
}

// Alertas não resolvidos da cidade (deep_analysis_status/{cidade}/alerts), em tempo real.
// `spots` é usado só para mostrar o nome do ponto turístico de cada alerta.
export function useCityAlerts(cityId: string | null | undefined, cityName: string | null | undefined, spots: TouristSpotDashboard[]) {
  const [state, setState] = useState<CityScoped<RawCityAlert[]> | null>(null);
  const [hidden, setHidden] = useState<CityScoped<Set<string>> | null>(null);

  useEffect(() => {
    if (!cityId) return;

    const alertsQuery = query(collection(db, 'deep_analysis_status', cityId, 'alerts'), where('resolvida', '==', false));
    return onSnapshot(
      alertsQuery,
      (snapshot) => setState({ cityId, data: snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) }),
      (error) => console.error('Erro ao escutar alertas da cidade:', error),
    );
  }, [cityId]);

  const rawAlerts = fromCity(state, cityId, NO_ALERTS);
  const hiddenIds = fromCity(hidden, cityId, null);

  const alerts = useMemo<CityAlert[]>(() => {
    const spotNames = new Map(spots.map(spot => [spot.id, spot.nome || spot.name]));
    return rawAlerts
      .filter(alert => !hiddenIds?.has(alert.id))
      .map(alert => ({
        ...alert,
        localidade: (alert.place_id && spotNames.get(alert.place_id)) || cityName || 'Local desconhecido',
        problema: alert.justificativa || alert.tipo_perigo || '',
        severidade: alert.tipo_perigo === 'CRIME_GRAVE' ? 'Alto' : 'Médio',
        horario: 'Recente',
      }));
  }, [rawAlerts, hiddenIds, spots, cityName]);

  // Esconde o alerta só nesta tela (não altera o banco)
  const hideAlert = useCallback((id: string) => {
    if (!cityId) return;
    setHidden(prev => ({ cityId, data: new Set(fromCity(prev, cityId, null)).add(id) }));
  }, [cityId]);

  return { alerts, hideAlert };
}
