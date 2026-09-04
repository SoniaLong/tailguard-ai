const PAPER_BASE = 'https://paper-api.alpaca.markets';
const DATA_BASE = 'https://data.alpaca.markets';

type Snapshot = {
  latestQuote?: { ap?: number; bp?: number; as?: number; bs?: number; t?: string };
  latestTrade?: { p?: number; t?: string };
  greeks?: { delta?: number };
};

type OptionLeg = {
  symbol: string;
  strike: number;
  expiration: string;
  bid: number;
  ask: number;
  delta: number | null;
};

function authHeaders(key: string, secret: string) {
  return { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret };
}

async function alpacaJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error(`Alpaca request failed (${response.status})`);
  return response.json() as Promise<T>;
}

async function submitPaperOrder<T>(url: string, headers: Record<string, string>, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const payload = await response.json() as T & { message?: string; code?: number };
  if (!response.ok) throw new Error(`Alpaca order rejected (${response.status}): ${payload.message ?? 'unknown reason'}`);
  return payload;
}

function optionLeg(symbol: string, snapshot: Snapshot): OptionLeg | null {
  const match = symbol.match(/^QQQ(\d{6})P(\d{8})$/);
  const bid = Number(snapshot.latestQuote?.bp);
  const ask = Number(snapshot.latestQuote?.ap);
  if (!match || !Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0 || ask < bid) return null;
  const [, date, strikeRaw] = match;
  return {
    symbol,
    strike: Number(strikeRaw) / 1000,
    expiration: `20${date.slice(0, 2)}-${date.slice(2, 4)}-${date.slice(4, 6)}`,
    bid,
    ask,
    delta: Number.isFinite(Number(snapshot.greeks?.delta)) ? Number(snapshot.greeks?.delta) : null,
  };
}

export async function POST(request: Request) {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  if (!key || !secret) return Response.json({ error: 'Alpaca Paper is not configured.' }, { status: 503 });

  let input: { shockPercent?: number; maxHedgeCost?: number; mandate?: string; confirmPaperOrder?: boolean };
  try {
    input = await request.json() as typeof input;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const shock = Math.round(Number(input.shockPercent));
  const budget = Math.round(Number(input.maxHedgeCost));
  if (!Number.isFinite(shock) || shock < 3 || shock > 12 || !Number.isFinite(budget) || budget < 100 || budget > 800 || typeof input.mandate !== 'string' || input.mandate.trim().length < 12) {
    return Response.json({ error: 'Use a 3–12% shock, $100–$800 budget, and a clear mandate.' }, { status: 400 });
  }

  const headers = authHeaders(key, secret);
  const now = new Date();
  const from = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const chainUrl = `${DATA_BASE}/v1beta1/options/snapshots/QQQ?feed=indicative&type=put&expiration_date_gte=${from}&expiration_date_lte=${to}&limit=1000`;

  try {
    const [account, clock, positions, stock, chain] = await Promise.all([
      alpacaJson<{ status?: string; equity?: string; buying_power?: string; trading_blocked?: boolean }>(`${PAPER_BASE}/v2/account`, headers),
      alpacaJson<{ is_open?: boolean; next_open?: string; next_close?: string }>(`${PAPER_BASE}/v2/clock`, headers),
      alpacaJson<Array<{ symbol?: string }>>(`${PAPER_BASE}/v2/positions`, headers),
      alpacaJson<{ latestTrade?: { p?: number; t?: string } }>(`${DATA_BASE}/v2/stocks/QQQ/snapshot?feed=iex`, headers),
      alpacaJson<{ snapshots?: Record<string, Snapshot>; next_page_token?: string | null }>(chainUrl, headers),
    ]);

    const spot = Number(stock.latestTrade?.p);
    const legs = Object.entries(chain.snapshots ?? {}).map(([symbol, snapshot]) => optionLeg(symbol, snapshot)).filter((leg): leg is OptionLeg => Boolean(leg));
    const targetStrike = spot * (1 - shock / 100);
    const expirations = [...new Set(legs.map((leg) => leg.expiration))].sort();
    const expiration = expirations[0];
    const expiryLegs = legs.filter((leg) => leg.expiration === expiration).sort((a, b) => b.strike - a.strike);

    const candidates: Array<{ long: OptionLeg; short: OptionLeg; debit: number; width: number; protection: number; spreadRatio: number; score: number }> = [];
    for (const long of expiryLegs) {
      for (const short of expiryLegs) {
        const width = long.strike - short.strike;
        if (width < 5 || width > 15) continue;
        const debit = Number((long.ask - short.bid).toFixed(2));
        const cost = debit * 100;
        const spreadRatio = (long.ask - long.bid) / Math.max(long.ask, 0.01);
        if (debit <= 0 || cost > budget || spreadRatio > 0.35) continue;
        const protection = Math.round((width - debit) * 100);
        const score = protection - Math.abs(long.strike - targetStrike) * 18 - spreadRatio * 100;
        candidates.push({ long, short, debit, width, protection, spreadRatio, score });
      }
    }

    const winner = candidates.sort((a, b) => b.score - a.score)[0];
    if (!winner || !Number.isFinite(spot)) {
      return Response.json({ error: 'No liquid defined-risk spread fits the current mandate. TailGuard failed closed.', rejectedCandidates: legs.length }, { status: 422 });
    }

    const orderPayload = {
      order_class: 'mleg',
      qty: '1',
      type: 'limit',
      time_in_force: 'day',
      limit_price: winner.debit.toFixed(2),
      legs: [
        { symbol: winner.long.symbol, side: 'buy', ratio_qty: '1', position_intent: 'buy_to_open' },
        { symbol: winner.short.symbol, side: 'sell', ratio_qty: '1', position_intent: 'sell_to_open' },
      ],
    };
    const executionEnabled = process.env.ALLOW_PAPER_EXECUTION === 'true';
    const receiptId = `tg_${now.toISOString().replace(/\D/g, '').slice(0, 14)}_${winner.long.symbol.slice(-8)}`;
    const accountReady = account.status === 'ACTIVE' && !account.trading_blocked;
    const allGatesPassed = winner.debit * 100 <= budget && accountReady;
    const shouldSubmit = executionEnabled && input.confirmPaperOrder === true && allGatesPassed;
    const brokerOrder = shouldSubmit
      ? await submitPaperOrder<{
          id: string;
          client_order_id?: string;
          status: string;
          created_at?: string;
          submitted_at?: string;
          filled_at?: string | null;
          filled_qty?: string;
          limit_price?: string;
          order_class?: string;
          legs?: Array<{ id?: string; symbol?: string; side?: string; status?: string }>;
        }>(`${PAPER_BASE}/v2/orders`, headers, { ...orderPayload, client_order_id: receiptId })
      : null;

    return Response.json({
      status: brokerOrder ? 'submitted' : 'staged',
      executionEnabled,
      receiptId,
      generatedAt: now.toISOString(),
      account: {
        status: account.status ?? 'UNKNOWN',
        equity: Number(account.equity) || 0,
        buyingPower: Number(account.buying_power) || 0,
        tradingBlocked: Boolean(account.trading_blocked),
        positionCount: Array.isArray(positions) ? positions.length : 0,
      },
      market: {
        isOpen: Boolean(clock.is_open),
        nextOpen: clock.next_open,
        nextClose: clock.next_close,
        underlying: 'QQQ',
        spot,
        priceTimestamp: stock.latestTrade?.t,
        feed: 'IEX equities + indicative options',
      },
      proposal: {
        strategy: 'QQQ put debit spread',
        expiration: winner.long.expiration,
        long: winner.long,
        short: winner.short,
        netDebit: winner.debit,
        cost: Math.round(winner.debit * 100),
        width: winner.width,
        maxProtection: winner.protection,
        contracts: 1,
      },
      gates: [
        { name: 'Defined risk only', passed: true, detail: `$${winner.width.toFixed(0)} vertical; no naked short leg` },
        { name: 'Live quote integrity', passed: true, detail: `Long-leg spread ${(winner.spreadRatio * 100).toFixed(1)}%` },
        { name: 'Premium budget', passed: winner.debit * 100 <= budget, detail: `$${Math.round(winner.debit * 100)} of $${budget}` },
        { name: 'Expiry window', passed: true, detail: `${winner.long.expiration} · policy 7–30 DTE` },
        { name: 'Paper account', passed: accountReady, detail: `${account.status ?? 'UNKNOWN'} · ${account.trading_blocked ? 'blocked' : 'unblocked'}` },
      ],
      audit: {
        mandate: input.mandate.trim(),
        shockPercent: shock,
        maxHedgeCost: budget,
        targetStrike: Number(targetStrike.toFixed(2)),
        scannedContracts: legs.length,
        evaluatedCandidates: candidates.length,
        chainTruncated: Boolean(chain.next_page_token),
        orderPayload,
        orderSubmitted: Boolean(brokerOrder),
        reason: brokerOrder
          ? `Alpaca Paper accepted order ${brokerOrder.id} with status ${brokerOrder.status}.`
          : executionEnabled
            ? 'Order prepared; submit only with confirmPaperOrder=true.'
            : 'ALLOW_PAPER_EXECUTION is false.',
        brokerOrder,
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Protection cycle failed closed.' }, { status: 502 });
  }
}
