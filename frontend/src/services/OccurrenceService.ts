import { auth } from '../firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';


export const DANGER_TYPES = [
  { value: 'CRIME_GRAVE', label: 'Crime grave' },
  { value: 'FURTO', label: 'Furto' },
  { value: 'GOLPE', label: 'Golpe' },
  { value: 'INFRAESTRUTURA_PERIGOSA', label: 'Infraestrutura perigosa' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

export type DangerType = typeof DANGER_TYPES[number]['value'];

export interface NewOccurrence {
  cityPlaceId: string;
  placeId: string;
  spotNome: string;
  tipoPerigo: DangerType;
  descricao: string;
}

export class OccurrenceService {
  
  public static async create(occurrence: NewOccurrence): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Usuário não autenticado.');

    const response = await fetch(`${API_URL}/api/occurrences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        city_place_id: occurrence.cityPlaceId,
        place_id: occurrence.placeId,
        spot_nome: occurrence.spotNome,
        tipo_perigo: occurrence.tipoPerigo,
        descricao: occurrence.descricao,
      }),
    });
    if (!response.ok) throw new Error(`Erro ao registrar ocorrência (${response.status}).`);

    const data = await response.json();
    return data.id;
  }
}
