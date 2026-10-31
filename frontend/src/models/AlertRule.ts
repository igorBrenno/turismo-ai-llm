export interface AlertRule {
  id: string;
  nome: string;
  criterio: string;
  ativo: boolean;
}

export type AlertTriggerStatus = 'novo' | 'visto' | 'resolvido';

export interface AlertTrigger {
  id: string;
  rule_id: string;
  rule_nome: string;
  place_id: string;
  place_nome: string;
  review_texto: string;
  review_rating: number;
  review_data: string | null;
  trecho: string;
  status: AlertTriggerStatus;
  created_at: Date | null;
}

export type AlertRunStatus = 'iniciando' | 'buscando_comentarios' | 'analisando' | 'concluido' | 'erro';

export interface AlertRun {
  status: AlertRunStatus;
  total_locais: number;
  total_comentarios: number;
  avaliacoes_pendentes: number;
  avaliacoes_feitas: number;
  disparos: number;
  lotes_com_falha?: number;
  erro: string | null;
}
