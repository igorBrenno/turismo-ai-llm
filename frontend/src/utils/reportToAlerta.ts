import type { TipoPerigo, UserReport } from '../models/Report';
import { TIPO_PERIGO_LABELS } from '../models/Report';
import type { Alerta } from '../models/Visual';

const SEVERIDADE: Record<TipoPerigo, Alerta['severidade']> = {
  CRIME_GRAVE: 'Alto',
  FURTO: 'Alto',
  GOLPE: 'Alto',
  INFRAESTRUTURA_PERIGOSA: 'Médio',
  OUTRO: 'Baixo',
};

const ICONE: Record<TipoPerigo, Alerta['tipo']> = {
  CRIME_GRAVE: 'shield',
  FURTO: 'shield',
  GOLPE: 'shield',
  INFRAESTRUTURA_PERIGOSA: 'map',
  OUTRO: 'home',
};

function tempoRelativo(iso: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `Há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  return `Há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

export function reportToAlerta(report: UserReport): Alerta {
  return {
    id: report.id,
    localidade: report.place_name,
    problema: `${TIPO_PERIGO_LABELS[report.tipo_perigo]}: ${report.justificativa}`,
    severidade: SEVERIDADE[report.tipo_perigo],
    horario: tempoRelativo(report.criado_em),
    tipo: ICONE[report.tipo_perigo],
    origem: 'usuario',
  };
}
