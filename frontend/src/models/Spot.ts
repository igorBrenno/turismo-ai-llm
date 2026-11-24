export interface TouristSpot {
  id: string;
  city: string;
  name: string;
  description: string;
  category?: string;
  image_url?: string;
  rating?: number;
  lat : number;
  lng : number;
  
}
export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface TouristSpotDashboard {
  id: string;
  city: string;
  name: string;
  description: string;
  category?: string;
  image_url?: string;
  rating?: number;
  lat : number;
  lng : number;
  alert : boolean;
  // Campos salvos pelo backend em deep_analysis_status/{cidade}/spots
  nome?: string;
  danger_score?: number | null; // null = poucas reviews para calcular
  total_reviews?: number;
  resumo_ia?: string;
  spot_id?: string;
  city_place_id?: string;
  ultima_varredura?: any; // Firestore Timestamp
}