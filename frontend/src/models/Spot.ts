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