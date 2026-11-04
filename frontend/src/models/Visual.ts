export interface Alerta {
  id: string | number;
  localidade: string;
  problema: string;
  severidade: 'Alto' | 'Médio' | 'Baixo' | 'Crítico' | 'Segurança' | 'Denúncia' | 'Conforme' | string;
  horario: string;
  tipo: 'map' | 'shield' | 'home' | string;
}