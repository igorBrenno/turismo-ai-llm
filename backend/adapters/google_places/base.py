from abc import ABC, abstractmethod

class GooglePlacesProviderAdapter(ABC):
    
    @abstractmethod
    def get_city_spots_ids():
        # Pega os ids dos spots pela api do google
        pass
    
    