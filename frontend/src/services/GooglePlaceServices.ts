import type { TouristSpot } from '../models/Spot';

interface SearchDefinition {
    /** Texto da busca; a cidade é concatenada ao final */
    query: string;
    /** Tipo oficial do Google Places (https://developers.google.com/maps/documentation/places/web-service/supported_types) */
    type?: string;
}

// Categorias que consideramos como ponto turístico / de interesse para o visitante
const SEARCHES: SearchDefinition[] = [
    // Atrações gerais
    { query: 'pontos turísticos em', type: 'tourist_attraction' },
    { query: 'o que visitar em' },
    { query: 'estabelecimentos em', type: 'establishment' },
    { query: 'comércios em', type: 'store' },

    // Cultura e história
    { query: 'museus em', type: 'museum' },
    { query: 'galerias de arte em', type: 'art_gallery' },
    { query: 'igrejas históricas em', type: 'church' },
    { query: 'monumentos e centro histórico em' },
    { query: 'teatros e centros culturais em' },
    { query: 'bibliotecas em', type: 'library' },

    // Natureza e lazer ao ar livre
    { query: 'parques em', type: 'park' },
    { query: 'praias em' },
    { query: 'mirantes em' },
    { query: 'cachoeiras e trilhas em' },
    { query: 'zoológico em', type: 'zoo' },
    { query: 'aquário em', type: 'aquarium' },
    { query: 'parques de diversões em', type: 'amusement_park' },
    { query: 'campings em', type: 'campground' },

    // Gastronomia e vida noturna
    { query: 'restaurantes em', type: 'restaurant' },
    { query: 'comida típica em' },
    { query: 'cafés em', type: 'cafe' },
    { query: 'padarias em', type: 'bakery' },
    { query: 'bares em', type: 'bar' },
    { query: 'casas noturnas em', type: 'night_club' },

    // Compras
    { query: 'shoppings em', type: 'shopping_mall' },
    { query: 'mercados públicos e feiras de artesanato em' },

    // Hospedagem
    { query: 'hotéis em', type: 'lodging' },
    { query: 'pousadas em' },

    // Entretenimento
    { query: 'estádios em', type: 'stadium' },
    { query: 'cinemas em', type: 'movie_theater' },
    { query: 'cassinos e entretenimento em' },
];

// O token da próxima página só fica válido ~2s depois da resposta (exigência do Google)
const NEXT_PAGE_DELAY_MS = 2000;
// Quantas buscas rodam ao mesmo tempo, para não estourar OVER_QUERY_LIMIT
const MAX_CONCURRENT_SEARCHES = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GooglePlaceService {
    private static DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';

    public static async fetchSpots(searchTerm: string): Promise<TouristSpot[]> {
        if (!searchTerm.trim() || !(window as any).google?.maps.places) {
            return [];
        }

        const cleanQuery = searchTerm.split(',')[0].trim();
        const cityQuery = cleanQuery.toLowerCase();
        const dummyElement = document.createElement('div');
        const service = new (window as any).google.maps.places.PlacesService(dummyElement);

        const rawResults = await this.runWithConcurrency(
            SEARCHES,
            MAX_CONCURRENT_SEARCHES,
            (search) => this.executeTextSearch(service, `${search.query} ${cleanQuery}`, search.type),
        );

        const spotMap = new Map<string, TouristSpot>();

        for (const place of rawResults.flat()) {
            const address = (place.formatted_address ?? place.vicinity ?? '').toLowerCase();
            if (!address.includes(cityQuery)) {
                continue;
            }

            const spot = this.mapToPlaceToSpot(place, cleanQuery);
            if (spot.id && !spotMap.has(spot.id)) {
                spotMap.set(spot.id, spot);
            }
        }

        return Array.from(spotMap.values());
    }

    /** Executa as tarefas em lotes de `limit` simultâneas, preservando a ordem dos resultados */
    private static async runWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
        const results: R[] = new Array(items.length);
        let next = 0;

        const worker = async () => {
            while (next < items.length) {
                const index = next++;
                results[index] = await task(items[index]);
            }
        };

        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
        return results;
    }

    /** Faz a busca e segue todas as páginas de resultado (o Google entrega 20 por página) */
    private static executeTextSearch(service: any, query: string, type?: string): Promise<any[]> {
        const placesStatus = (window as any).google.maps.places.PlacesServiceStatus;

        return new Promise((resolve) => {
            const collected: any[] = [];
            const request: any = { query };
            if (type) request.type = type;

            service.textSearch(request, async (results: any[], status: any, pagination: any) => {
                if (status !== placesStatus.OK || !results) {
                    if (status !== placesStatus.ZERO_RESULTS) {
                        console.warn(`[GooglePlaces] "${query}" retornou ${status}`);
                    }
                    resolve(collected);
                    return;
                }

                collected.push(...results);

                if (pagination?.hasNextPage) {
                    await sleep(NEXT_PAGE_DELAY_MS);
                    // Chama o mesmo callback novamente com a próxima página
                    pagination.nextPage();
                } else {
                    resolve(collected);
                }
            });
        });
    }

    private static mapToPlaceToSpot(place: any, city: string): TouristSpot {
        let photoUrl = this.DEFAULT_IMAGE;
        if (place.photos && place.photos.length > 0) {
            photoUrl = place.photos[0].getUrl({ maxWidth: 600, maxHeight: 400 });
        }

        return {
            id: place.place_id || Math.random().toString(),
            city: city,
            name: place.name,
            description: place.formatted_address || 'Ponto turístico local',
            category: place.types || 'Não identificado',
            image_url: photoUrl,
            rating: place.rating,
            lat: place.geometry?.location ? place.geometry.location.lat() : 0,
            lng: place.geometry?.location ? place.geometry.location.lng() : 0,
        };
    }
}
