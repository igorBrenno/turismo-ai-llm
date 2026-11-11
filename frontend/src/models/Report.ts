export type TipoPerigo =
  | 'CRIME_GRAVE'
  | 'GOLPE'
  | 'FURTO'
  | 'INFRAESTRUTURA_PERIGOSA'
  | 'OUTRO';

export const TIPO_PERIGO_LABELS: Record<TipoPerigo, string> = {
  CRIME_GRAVE: 'Crime grave',
  GOLPE: 'Golpe',
  FURTO: 'Furto',
  INFRAESTRUTURA_PERIGOSA: 'Infraestrutura perigosa',
  OUTRO: 'Outro',
};

export interface UserReportInput {
  place_id: string;
  place_name: string;
  place_address?: string;
  tipo_perigo: TipoPerigo;
  justificativa: string;
  data_ocorrencia: string;
  rating?: number;
}

export interface UserReport {
  id: string;
  place_id: string;
  place_name: string;
  tipo_perigo: TipoPerigo;
  justificativa: string;
  data_ocorrencia: string;
  status: string;
  criado_em: string;
}
