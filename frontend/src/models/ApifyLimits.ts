export interface ApifyLimits {
  gasto_atual_usd: number;
  limite_mensal_usd: number;
  saldo_restante_usd: number;
  porcentagem_usada: number;
  status: 'ok' | 'low_balance' | 'error' | 'unsupported';
}