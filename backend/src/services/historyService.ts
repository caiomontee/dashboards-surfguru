import { supabase } from '../lib/supabase';
import { SUBSCRIPTIONS_HISTORY_TABLE, type SubscriptionsHistoryRow } from '../types/subscriptions';

const WEEKS_WINDOW = 52;

export async function getHistoricalSubscriptions(): Promise<SubscriptionsHistoryRow[]> {
  try {
    const cutoffDate = new Date(Date.now() - WEEKS_WINDOW * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // 'YYYY-MM-DD'

    const { data, error } = await supabase
      .from(SUBSCRIPTIONS_HISTORY_TABLE)
      .select('*')
      .gte('Data', cutoffDate)
      .order('Data', { ascending: false })
      .limit(WEEKS_WINDOW);

    if (error) throw error;

    const rows = (data ?? []) as SubscriptionsHistoryRow[];
    return [...rows].reverse(); // cronológico crescente
  } catch (err) {
    console.error('[historyService.getHistoricalSubscriptions]', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
