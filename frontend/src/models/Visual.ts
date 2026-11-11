export interface Alerta {
  id: number | string;
  localidade: string;
  problema: string;
  severidade: 'Alto' | 'Médio' | 'Baixo';
  horario: string;
  tipo: 'map' | 'shield' | 'home';
  origem?: 'usuario';
}