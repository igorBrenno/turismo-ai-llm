from .base import GooglePlacesProviderAdapter
import requests

class GooglePlacesAdapter(GooglePlacesProviderAdapter):
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    def get_city_spots_ids(self, city_name: str) -> list:
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        
        # A mesma lógica de pesquisa que traria os pontos no frontend
        query = f"pontos turísticos em {city_name}"
        
        params = {
            "query": query,
            "key": self.api_key,
            "language": "pt-BR"
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        spot = []
        if data.get("status") == "OK":
            for place in data.get("results", []):
                if "place_id" in place:
                    geometry = place.get("geometry")
                    spot.append({
                        "place_id" : place["place_id"],
                        "lat" : geometry.get("lat"),
                        "lng" : geometry.get("lng")
                        }
                    )
                    
        print(f"[GOOGLE API] Encontrados {len(spot)} locais em {city_name}")
        return spot