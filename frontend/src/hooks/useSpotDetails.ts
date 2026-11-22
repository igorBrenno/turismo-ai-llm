import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, limit, onSnapshot, query, where, type Query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { TouristSpotDashboard } from '../models/Spot';
import type { CityAlert } from './useCityAnalysis';

export const PAGE_SIZE = 20;

export interface SpotReview {
  id: string;
  author?: string;
  rating?: number;
  text?: string;
  date?: string;
}

export type SpotAlert = Omit<CityAlert, 'localidade' | 'problema' | 'severidade'>;

export interface PagedList<T> {
  items: T[];
  total: number | null;
  hasMore: boolean;
  loadMore: () => void;
}

// Guarda o dado junto com a chave (cidade/spot) a que pertence, para não misturar spots ao navegar
interface Keyed<T> {
  key: string;
  data: T;
}

const fromKey = <T,>(state: Keyed<T> | null, key: string, fallback: T): T =>
  state && state.key === key ? state.data : fallback;

const spotRefs = (cityId: string, spotId: string) => {
  const cityRef = doc(db, 'deep_analysis_status', cityId);
  const spotRef = doc(cityRef, 'spots', spotId);
  return {
    spotRef,
    alertsQuery: query(collection(cityRef, 'alerts'), where('place_id', '==', spotId)),
    reviewsQuery: query(collection(spotRef, 'reviews')),
  };
};

const onError = (error: unknown) => console.error('Erro ao carregar detalhes do spot:', error);

// Escuta uma coleção de 20 em 20: busca 1 item a mais só para saber se ainda há próxima página
function usePagedCollection<T>(key: string, baseQuery: Query | null): PagedList<T> {
  const [pages, setPages] = useState<Keyed<number> | null>(null);
  const [result, setResult] = useState<Keyed<{ items: T[]; hasMore: boolean }> | null>(null);
  const [total, setTotal] = useState<Keyed<number> | null>(null);

  const pageCount = fromKey(pages, key, 1);

  useEffect(() => {
    if (!baseQuery) return;
    const pageLimit = pageCount * PAGE_SIZE;
    return onSnapshot(query(baseQuery, limit(pageLimit + 1)), snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
      setResult({ key, data: { items: docs.slice(0, pageLimit), hasMore: docs.length > pageLimit } });
    }, onError);
    // A query é recriada a cada render; a chave identifica quando ela muda de fato
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pageCount]);

  useEffect(() => {
    if (!baseQuery) return;
    getCountFromServer(baseQuery)
      .then(snap => setTotal({ key, data: snap.data().count }))
      .catch(onError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loadMore = useCallback(() => {
    setPages(prev => ({ key, data: fromKey(prev, key, 1) + 1 }));
  }, [key]);

  const current = fromKey(result, key, { items: [] as T[], hasMore: false });
  return { ...current, total: fromKey(total, key, null), loadMore };
}

// Dados que a deep analysis já salvou do spot. Só lê o Firestore: não chama Apify nem OpenAI.
export function useSpotDetails(cityId?: string, spotId?: string) {
  const key = `${cityId}/${spotId}`;
  const refs = cityId && spotId ? spotRefs(cityId, spotId) : null;
  const [spotState, setSpotState] = useState<Keyed<TouristSpotDashboard | null> | null>(null);

  useEffect(() => {
    if (!cityId || !spotId) return;
    return onSnapshot(spotRefs(cityId, spotId).spotRef, snap => {
      setSpotState({ key, data: snap.exists() ? ({ id: snap.id, ...snap.data() } as TouristSpotDashboard) : null });
    }, onError);
  }, [cityId, spotId, key]);

  const alerts = usePagedCollection<SpotAlert>(key, refs?.alertsQuery ?? null);
  const reviews = usePagedCollection<SpotReview>(key, refs?.reviewsQuery ?? null);

  const spotLoaded = spotState?.key === key;
  return {
    spot: spotLoaded ? spotState.data : null,
    loading: !!refs && !spotLoaded,
    alerts,
    reviews,
  };
}
