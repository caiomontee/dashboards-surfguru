import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import { SUBSCRIPTIONS_HISTORY_TABLE, type SubscriptionsHistoryInsert } from '../types/subscriptions';

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

interface PagarmeListResponse {
  paging: { total: number; previous?: string | null; next?: string | null };
}

function isDryRun(): boolean {
  return process.env.DRY_RUN?.trim().toLowerCase() === 'true';
}

function getPagarmeSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY?.trim();
  if (!key) throw new Error('PAGARME_SECRET_KEY não configurada no .env');
  return key;
}

function makePagarmeClient(secretKey: string): AxiosInstance {
  const token = Buffer.from(`${secretKey}:`).toString('base64');
  return axios.create({
    baseURL: PAGARME_BASE_URL,
    headers: { Authorization: `Basic ${token}` },
    timeout: 30000,
  });
}

async function fetchSubscriptionStatusTotal(
  client: AxiosInstance,
  status: 'active' | 'future',
): Promise<number> {
  const { data } = await client.get<PagarmeListResponse>('/subscriptions', {
    params: { status, size: 1, page: 1 },
  });
  return data.paging?.total ?? 0;
}

export async function syncSubscriptions(): Promise<void> {
  const dryRun = isDryRun();

  try {
    console.log('[syncSubscriptions] Início do job');
    if (dryRun) {
      console.log('[syncSubscriptions] DRY_RUN=true — INSERT no Supabase será omitido.');
    }

    const client = makePagarmeClient(getPagarmeSecretKey());

    console.log('[syncSubscriptions] Etapa 1/4 — Buscando totais no Pagar.me…');

    const [pagarmeActive, pagarmeTrial] = await Promise.all([
      fetchSubscriptionStatusTotal(client, 'active'),
      fetchSubscriptionStatusTotal(client, 'future'),
    ]);

    console.log(`  • status=active  → ${pagarmeActive}  (→ "Total Pago Pagar.me")`);
    console.log(`  • status=future  → ${pagarmeTrial}   (→ "Pagar.me (Trial)")`);

    const total = pagarmeActive + pagarmeTrial;
    console.log(`[syncSubscriptions] Etapa 2/4 — Total calculado: ${pagarmeActive} + ${pagarmeTrial} = ${total}`);

    console.log('[syncSubscriptions] Etapa 3/4 — Buscando último snapshot para calcular Crescimento…');

    const { data: lastRow, error: historyError } = await supabase
      .from(SUBSCRIPTIONS_HISTORY_TABLE)
      .select('"Total", "Data"')
      .order('Data', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (historyError) throw historyError;

    const previousTotal = lastRow?.Total ?? null;
    const crescimento = previousTotal === null ? 0 : total - previousTotal;

    if (previousTotal === null) {
      console.log('  • Sem snapshot anterior — Crescimento definido como 0 (baseline).');
    } else {
      console.log(`  • Total anterior (${lastRow?.Data}): ${previousTotal}`);
      console.log(`  • Crescimento: ${total} - ${previousTotal} = ${crescimento}`);
    }

    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const insertRow: SubscriptionsHistoryInsert = {
      Data: today,
      'Total Pago Pagar.me': pagarmeActive,
      'Pagar.me (Trial)': pagarmeTrial,
      Paypal: 0,
      PIX: 0,
      Boleto: 0,
      'Assinantes Via ADS': 0,
      Total: total,
      Crescimento: crescimento,
    };

    console.log('[syncSubscriptions] Etapa 4/4 — Payload:', JSON.stringify(insertRow));

    if (dryRun) {
      console.log('[syncSubscriptions] DRY_RUN — INSERT ignorado.');
    } else {
      const { error: insertError } = await supabase
        .from(SUBSCRIPTIONS_HISTORY_TABLE)
        .insert(insertRow);

      if (insertError) throw insertError;

      console.log('[syncSubscriptions] Sucesso — linha inserida em acompanhamento_assinantes.');
    }
  } catch (err) {
    console.error('[syncSubscriptions] Falha:', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

if (require.main === module) {
  syncSubscriptions()
    .then(() => {
      console.log('[syncSubscriptions] Worker encerrado com sucesso.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}
