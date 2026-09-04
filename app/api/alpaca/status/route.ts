const PAPER_ACCOUNT_URL = 'https://paper-api.alpaca.markets/v2/account';

export async function GET() {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;

  if (!key || !secret) {
    return Response.json({ configured: false, mode: 'replay', equity: 100000 });
  }

  try {
    const response = await fetch(PAPER_ACCOUNT_URL, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return Response.json({ configured: false, mode: 'paper', equity: 100000, error: 'Paper account unavailable' }, { status: 502 });
    }

    const account = await response.json() as { equity?: string; status?: string };
    return Response.json({
      configured: true,
      mode: 'paper',
      equity: Number(account.equity) || 100000,
      accountStatus: account.status ?? 'UNKNOWN',
    });
  } catch {
    return Response.json({ configured: false, mode: 'replay', equity: 100000, error: 'Paper connection failed closed' }, { status: 502 });
  }
}
