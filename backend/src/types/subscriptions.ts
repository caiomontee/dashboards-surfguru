/**
 * Tipagens alinhadas à tabela `public.acompanhamento_assinantes` (Supabase / Postgres).
 *
 * | Coluna                | Tipo SQL |
 * |-----------------------|----------|
 * | id                    | int8     |
 * | Data                  | date     |
 * | Total Pago Pagar.me   | int8     |
 * | Pagar.me (Trial)      | int8     |
 * | Paypal                | int8     |
 * | PIX                   | int8     |
 * | Boleto                | int8     |
 * | Assinantes Via ADS    | int8     |
 * | Total                 | int8     |
 * | Crescimento           | int8     |
 */

export const SUBSCRIPTIONS_HISTORY_TABLE = 'acompanhamento_assinantes' as const;

export type SubscriptionsHistoryTableName = typeof SUBSCRIPTIONS_HISTORY_TABLE;

/** Linha completa retornada por SELECT. */
export interface SubscriptionsHistoryRow {
  id: number;
  Data: string;                    // date → 'YYYY-MM-DD'
  'Total Pago Pagar.me': number;
  'Pagar.me (Trial)': number;
  Paypal: number;
  PIX: number;
  Boleto: number;
  'Assinantes Via ADS': number;
  Total: number;
  Crescimento: number;
}

/** INSERT: `id` é serial/auto-increment — omitir. */
export type SubscriptionsHistoryInsert = Omit<SubscriptionsHistoryRow, 'id'>;

/** UPDATE parcial. */
export type SubscriptionsHistoryUpdate = Partial<Omit<SubscriptionsHistoryRow, 'id'>>;

export type SubscriptionHistorySnapshot = SubscriptionsHistoryRow;
