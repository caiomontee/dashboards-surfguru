import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import { SUBSCRIPTIONS_HISTORY_TABLE, type SubscriptionsHistoryInsert, type SubscriptionsHistoryRow } from '../types/subscriptions';

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

// PayPal é atualizado manualmente — valor fixo até ser automatizado
const PAYPAL_FIXO = 11;

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
    if (dryRun) console.log('[syncSubscriptions] DRY_RUN=true — INSERT omitido.');

    const client = makePagarmeClient(getPagarmeSecretKey());

    console.log('[syncSubscriptions] Etapa 1/4 — Buscando totais no Pagar.me…');
    const [pagarmeActive, pagarmeTrial] = await Promise.all([
      fetchSubscriptionStatusTotal(client, 'active'),
      fetchSubscriptionStatusTotal(client, 'future'),
    ]);
    console.log(`  • status=active → ${pagarmeActive}`);
    console.log(`  • status=future → ${pagarmeTrial}`);

    console.log('[syncSubscriptions] Etapa 2/4 — Buscando último snapshot (carry-forward)…');
    const { data: lastRow, error: historyError } = await supabase
      .from(SUBSCRIPTIONS_HISTORY_TABLE)
      .select('"Data", "Total", "PIX", "Boleto", "Assinantes Via ADS"')
      .order('Data', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (historyError) throw historyError;

    const prev = lastRow as Pick<SubscriptionsHistoryRow,
      'Data' | 'Total' | 'PIX' | 'Boleto' | 'Assinantes Via ADS'> | null;

    // Carry-forward: reutiliza valores manuais da linha anterior
    const pix    = prev?.PIX                    ?? 0;
    const boleto = prev?.Boleto                 ?? 0;
    const ads    = prev?.['Assinantes Via ADS'] ?? 0;

    console.log(`  • Carry-forward — PIX: ${pix}, Boleto: ${boleto}, ADS: ${ads}, Paypal fixo: ${PAYPAL_FIXO}`);

    // Total correto = soma de todas as plataformas
    const total = pagarmeActive + pagarmeTrial + PAYPAL_FIXO + pix + boleto + ads;

    const previousTotal = prev?.Total ?? null;
    const crescimento   = previousTotal === null ? 0 : total - previousTotal;

    console.log('[syncSubscriptions] Etapa 3/4 — Crescimento:');
    if (previousTotal === null) {
      console.log('  • Sem snapshot anterior — Crescimento = 0.');
    } else {
      console.log(`  • Total anterior (${prev?.Data}): ${previousTotal}`);
      console.log(`  • Total atual: ${total} → Crescimento: ${crescimento}`);
    }

    const today = new Date().toISOString().split('T')[0];

    const insertRow: SubscriptionsHistoryInsert = {
      Data:                  today,
      'Total Pago Pagar.me': pagarmeActive,
      'Pagar.me (Trial)':    pagarmeTrial,
      Paypal:                PAYPAL_FIXO,
      PIX:                   pix,
      Boleto:                boleto,
      'Assinantes Via ADS':  ads,
      Total:                 total,
      Crescimento:           crescimento,
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
