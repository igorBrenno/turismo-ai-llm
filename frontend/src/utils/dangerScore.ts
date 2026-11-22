import type { TouristSpotDashboard } from '../models/Spot';

// Mesmo valor de MIN_REVIEWS_FOR_SCORE em backend/adapters/ai/open_ai.py
export const MIN_REVIEWS_FOR_SCORE = 5;

// Índice de perigo confiável do spot, ou null quando há poucas reviews para calcular.
// Spots analisados antes do mínimo existir não têm total_reviews e mantêm o valor salvo até a próxima varredura.
export function getDangerScore(spot: TouristSpotDashboard): number | null {
  if (spot.danger_score == null) return null;
  if (spot.total_reviews != null && spot.total_reviews < MIN_REVIEWS_FOR_SCORE) return null;
  return spot.danger_score;
}

export const INSUFFICIENT_DATA_LABEL = 'Dados insuficientes';
export const INSUFFICIENT_DATA_HINT = `Menos de ${MIN_REVIEWS_FOR_SCORE} reviews com texto para calcular o índice.`;
