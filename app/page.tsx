'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Gauge,
  LockKeyhole,
  Newspaper,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const positions = [
  { symbol: 'NVDA', allocation: 31, color: '#d7ff45' },
  { symbol: 'MSFT', allocation: 25, color: '#8ca6ff' },
  { symbol: 'META', allocation: 18, color: '#ff9f6e' },
  { symbol: 'QQQ', allocation: 16, color: '#64ddc7' },
  { symbol: 'CASH', allocation: 10, color: '#69717f' },
];

const fallbackGates = [
  ['Defined risk only', 'No naked short legs'],
  ['Liquidity', 'Spread 4.8% · OI 12.4k'],
  ['Premium budget', '$286 of $350'],
  ['Expiry window', '14 DTE · policy 7–30'],
];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

type CycleResult = {
  status: 'staged';
  executionEnabled: boolean;
  receiptId: string;
  generatedAt: string;
  account: { status: string; equity: number; buyingPower: number; tradingBlocked: boolean; positionCount: number };
  market: { isOpen: boolean; nextOpen?: string; underlying: string; spot: number; priceTimestamp?: string; feed: string };
  proposal: {
    strategy: string;
    expiration: string;
    long: { symbol: string; strike: number; bid: number; ask: number; delta: number | null };
    short: { symbol: string; strike: number; bid: number; ask: number; delta: number | null };
    netDebit: number;
    cost: number;
    width: number;
    maxProtection: number;
    contracts: number;
  };
  gates: Array<{ name: string; passed: boolean; detail: string }>;
  audit: {
    mandate: string;
    shockPercent: number;
    maxHedgeCost: number;
    targetStrike: number;
    scannedContracts: number;
    evaluatedCandidates: number;
    chainTruncated: boolean;
    orderPayload: unknown;
    orderSubmitted: false;
    reason: string;
  };
};

function ProtectionChart({ shock, budget }: { shock: number; budget: number }) {
  const floorLift = Math.min(1100, budget * 2.8);
  const points = Array.from({ length: 13 }, (_, index) => {
    const move = index - 8;
    const bare = 72 + move * 18;
    const protection = move < -1 ? floorLift / 34 * Math.abs(move + 1) : 0;
    return { x: 36 + index * 37, bare, hedged: Math.min(174, bare + protection) };
  });
  const toY = (value: number) => 240 - value;
  const barePath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${toY(p.bare)}`).join(' ');
  const hedgePath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${toY(p.hedged)}`).join(' ');
  const areaPath = `${hedgePath} L ${points.at(-1)?.x} ${toY(points.at(-1)?.bare ?? 0)} ${[...points].reverse().map((p) => `L ${p.x} ${toY(p.bare)}`).join(' ')} Z`;

  return (
    <div className="relative mt-2 overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#0b0d10] px-3 pb-2 pt-4">
      <div className="absolute left-4 top-3 z-10 flex items-center gap-4 text-[11px] text-[#8b929d]">
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-[#d7ff45]" />Hedged</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 border-t border-dashed border-[#616873]" />Unhedged</span>
      </div>
      <svg viewBox="0 0 520 270" className="h-[245px] w-full" aria-label="Portfolio value under market shock before and after protection">
        <title>Portfolio value under market shock before and after protection</title>
        <defs><linearGradient id="shieldArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d7ff45" stopOpacity=".23" /><stop offset="100%" stopColor="#d7ff45" stopOpacity="0" /></linearGradient></defs>
        {[62, 107, 152, 197].map((y) => <line key={y} x1="34" x2="488" y1={y} y2={y} stroke="#24282f" strokeWidth="1" />)}
        <line x1="330" x2="330" y1="44" y2="238" stroke="#343a44" strokeDasharray="4 5" />
        <path d={areaPath} fill="url(#shieldArea)" />
        <path d={barePath} fill="none" stroke="#616873" strokeWidth="2" strokeDasharray="6 6" />
        <path d={hedgePath} fill="none" stroke="#d7ff45" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="330" cy={toY(points[8].hedged)} r="5" fill="#0b0d10" stroke="#d7ff45" strokeWidth="3" />
        <text x="342" y={toY(points[8].hedged) - 8} fill="#d7ff45" fontSize="11" fontFamily="monospace">PROTECTION FLOOR</text>
        <text x="34" y="258" fill="#6f7784" fontSize="11">−12%</text><text x="169" y="258" fill="#6f7784" fontSize="11">−8%</text><text x="315" y="258" fill="#6f7784" fontSize="11">−4%</text><text x="472" y="258" fill="#6f7784" fontSize="11">+4%</text>
        <text x="35" y="52" fill="#6f7784" fontSize="10">PORTFOLIO VALUE</text><text x="440" y="52" fill="#6f7784" fontSize="10">SPY MOVE</text>
      </svg>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#d7ff45]/20 bg-[#11150f]/90 px-3 py-1.5 text-xs text-[#d7ff45] shadow-[0_0_24px_rgba(215,255,69,.08)]"><ShieldCheck className="size-3.5" /> {shock}% stress protected</div>
    </div>
  );
}

export default function Home() {
  const [shock, setShock] = useState(5);
  const [budget, setBudget] = useState(350);
  const [phase, setPhase] = useState<'ready' | 'running' | 'complete'>('ready');
  const [mandate, setMandate] = useState('Keep my modeled 5% selloff loss below $2,000. Spend no more than $350 on protection.');
  const [connection, setConnection] = useState({ configured: false, equity: 100000 });
  const [cycle, setCycle] = useState<CycleResult | null>(null);
  const [cycleError, setCycleError] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);

  const metrics = useMemo(() => {
    const loss = shock * 860;
    const saved = Math.round(Math.min(loss * 0.62, budget * 8.1));
    return { loss, saved, hedged: Math.max(900, loss - saved) };
  }, [shock, budget]);

  const summaryCards: Array<{ label: string; value: string; detail: string; Icon: LucideIcon; color: string }> = [
    { label: 'Portfolio equity', value: money(connection.equity), detail: '+1.42%', Icon: ArrowUpRight, color: 'text-[#d7ff45]' },
    { label: 'Modeled stress loss', value: money(metrics.loss), detail: `SPY −${shock}%`, Icon: ArrowDownRight, color: 'text-[#ff8d7c]' },
    { label: 'Protected loss', value: money(metrics.hedged), detail: `${money(metrics.saved)} avoided`, Icon: ShieldCheck, color: 'text-[#d7ff45]' },
    { label: 'Hedge budget', value: money(budget), detail: '0.35% of equity', Icon: CircleDollarSign, color: 'text-[#9bacff]' },
  ];

  const eventTime = cycle ? new Date(cycle.generatedAt).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';
  const ledgerRows: Array<{ Icon: LucideIcon; time: string; title: string; detail: string; status: string }> = cycle ? [
    { Icon: Clock3, time: eventTime, title: 'Mandate validated', detail: `Stress −${shock}% · budget ${money(budget)}`, status: 'SCHEMA VALID' },
    { Icon: Activity, time: eventTime, title: 'Live Alpaca data read', detail: `QQQ ${money(cycle.market.spot)} · ${cycle.market.feed}`, status: cycle.market.isOpen ? 'MARKET OPEN' : 'MARKET CLOSED' },
    { Icon: TriangleAlert, time: eventTime, title: 'Candidates screened', detail: `${cycle.audit.scannedContracts} contracts · ${cycle.audit.evaluatedCandidates} valid spreads`, status: 'FAIL-CLOSED GATES' },
    { Icon: FileCheck2, time: eventTime, title: 'Paper order staged', detail: `${cycle.proposal.long.symbol} / ${cycle.proposal.short.symbol} · debit $${cycle.proposal.netDebit.toFixed(2)}`, status: 'NOT SUBMITTED' },
  ] : [
    { Icon: Clock3, time: '--:--:--', title: 'Mandate ready', detail: `Stress −${shock}% · budget ${money(budget)}`, status: 'AWAITING CYCLE' },
  ];

  async function requestCycle(parameters = { shockPercent: shock, maxHedgeCost: budget, mandate }) {
    setPhase('running');
    setCycleError('');
    const response = await fetch('/api/alpaca/cycle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parameters),
    });
    const payload = await response.json() as CycleResult | { error?: string };
    if (!response.ok || !('proposal' in payload)) {
      const message = 'error' in payload && payload.error ? payload.error : 'Protection cycle failed closed.';
      setCycleError(message);
      setPhase('ready');
      throw new Error(message);
    }
    setCycle(payload);
    setConnection({ configured: true, equity: payload.account.equity });
    setPhase('complete');
    return payload;
  }

  useEffect(() => {
    type WebMcpContext = {
      registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(context.registerTool({
      name: 'run_protection_cycle',
      title: 'Run protection cycle',
      description: 'Configure a downside stress test and hedge budget, then run TailGuard\'s visible paper-trading protection cycle.',
      inputSchema: {
        type: 'object',
        properties: {
          shockPercent: { type: 'number', minimum: 3, maximum: 12 },
          maxHedgeCost: { type: 'number', minimum: 100, maximum: 800 },
          mandate: { type: 'string', minLength: 12, maxLength: 300 },
        },
        required: ['shockPercent', 'maxHedgeCost', 'mandate'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const candidate = input as { shockPercent?: number; maxHedgeCost?: number; mandate?: string };
        if (!candidate || typeof candidate.shockPercent !== 'number' || candidate.shockPercent < 3 || candidate.shockPercent > 12 || typeof candidate.maxHedgeCost !== 'number' || candidate.maxHedgeCost < 100 || candidate.maxHedgeCost > 800 || typeof candidate.mandate !== 'string' || candidate.mandate.length < 12) {
          throw new Error('Invalid protection mandate. Use a 3–12% shock, $100–$800 budget, and a clear mandate.');
        }
        setShock(Math.round(candidate.shockPercent));
        setBudget(Math.round(candidate.maxHedgeCost / 25) * 25);
        setMandate(candidate.mandate);
        const result = await requestCycle({
          shockPercent: Math.round(candidate.shockPercent),
          maxHedgeCost: Math.round(candidate.maxHedgeCost / 25) * 25,
          mandate: candidate.mandate,
        });
        return { status: result.status, receiptId: result.receiptId, hedge: result.proposal.strategy, policyGatesPassed: result.gates.filter((gate) => gate.passed).length, orderSubmitted: false };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, [budget, mandate, shock]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/alpaca/status', { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ configured?: boolean; equity?: number }> : Promise.reject(new Error('status unavailable')))
      .then((status) => setConnection({
        configured: Boolean(status.configured),
        equity: Number(status.equity) || 100000,
      }))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function runCycle() {
    void requestCycle().catch(() => undefined);
  }

  const proposal = cycle?.proposal;
  const gateRows = cycle?.gates ?? fallbackGates.map(([name, detail]) => ({ name, detail, passed: true }));
  const longLabel = proposal ? `QQQ ${proposal.long.strike}P` : 'Run a live cycle';
  const shortLabel = proposal ? `QQQ ${proposal.short.strike}P` : 'Awaiting selection';
  const expiryLabel = proposal ? new Date(`${proposal.expiration}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase() : '7–30 DTE';

  return (
    <main className="min-h-screen bg-[#08090b] text-[#f3f5f7] selection:bg-[#d7ff45] selection:text-black">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#d7ff45] text-black shadow-[0_0_24px_rgba(215,255,69,.13)]"><ShieldCheck className="size-5" strokeWidth={2.4} /></div><div><div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">TailGuard <span className="text-[#d7ff45]">AI</span></div><div className="text-[10px] font-medium uppercase tracking-[.18em] text-[#6f7784]">Autonomous options insurance</div></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 text-xs text-[#89919d] sm:flex"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#d7ff45] opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-[#d7ff45]" /></span>{connection.configured ? 'Alpaca Paper connected' : 'Demo replay · Alpaca-ready'}</div><span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 font-mono text-[11px] text-[#a5acb7]">{money(connection.equity)}</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, detail, Icon, color }) => (
            <div key={label} className="panel flex items-start justify-between p-4"><div><p className="eyebrow">{label}</p><p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{value}</p><p className={`mt-1 text-xs ${color}`}>{detail}</p></div><div className="grid size-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.035]"><Icon className={`size-4 ${color}`} /></div></div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_330px]">
          <aside className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between"><div><p className="eyebrow">Protection mandate</p><h1 className="mt-1 text-lg font-semibold tracking-tight">Set the risk boundary</h1></div><Sparkles className="size-4 text-[#d7ff45]" /></div>
            <textarea value={mandate} onChange={(event) => setMandate(event.target.value)} aria-label="Natural language protection mandate" className="mt-4 min-h-[106px] w-full resize-none rounded-xl border border-white/[0.08] bg-[#0b0d10] p-3 text-sm leading-6 text-[#d7dce3] outline-none transition focus:border-[#d7ff45]/50 focus:ring-2 focus:ring-[#d7ff45]/10" />
            <div className="mt-5 space-y-6">
              <div><div className="mb-3 flex items-center justify-between text-sm"><span className="text-[#a8afb9]">Stress scenario</span><span className="font-mono text-[#ff9b8c]">−{shock}%</span></div><Slider min={3} max={12} step={1} value={[shock]} onValueChange={(value) => setShock(Number(value))} className="[&_[data-slot=slider-range]]:bg-[#ff8d7c]" /><div className="mt-2 flex justify-between font-mono text-[10px] text-[#555c67]"><span>−3%</span><span>−12%</span></div></div>
              <div><div className="mb-3 flex items-center justify-between text-sm"><span className="text-[#a8afb9]">Maximum hedge cost</span><span className="font-mono text-[#d7ff45]">{money(budget)}</span></div><Slider min={100} max={800} step={25} value={[budget]} onValueChange={(value) => setBudget(Number(value))} className="[&_[data-slot=slider-range]]:bg-[#d7ff45]" /><div className="mt-2 flex justify-between font-mono text-[10px] text-[#555c67]"><span>$100</span><span>$800</span></div></div>
            </div>
            <div className="my-5 h-px bg-white/[0.07]" />
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Execution safeguard</p><p className="mt-1 text-xs text-[#737b87]">Stage only · no order submission</p></div><Switch checked={false} disabled aria-label="Paper execution disabled" className="data-checked:bg-[#d7ff45]" /></div>
            <Button onClick={runCycle} disabled={phase === 'running'} className="mt-5 h-11 w-full bg-[#d7ff45] font-semibold text-[#0a0b0d] hover:bg-[#e3ff78]">{phase === 'running' ? <><Activity className="animate-pulse" /> Analyzing chain…</> : phase === 'complete' ? <><CheckCircle2 /> Cycle complete</> : <><Play className="fill-current" /> Run protection cycle</>}</Button>
            {cycleError ? <p role="alert" className="mt-3 text-center text-xs leading-5 text-[#ff8d7c]">{cycleError}</p> : <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#646c77]"><LockKeyhole className="size-3" /> Deterministic selector controls price and contracts</p>}
          </aside>

          <section className="panel min-w-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Protection envelope</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Loss profile after hedge</h2></div><div className="flex items-center gap-2 rounded-full border border-[#d7ff45]/20 bg-[#d7ff45]/[0.06] px-3 py-1.5 text-xs text-[#d7ff45]"><Gauge className="size-3.5" />Coverage 66%</div></div>
            <ProtectionChart shock={shock} budget={budget} />
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.15fr]">
              <div className="rounded-[16px] border border-white/[0.07] bg-[#0b0d10] p-4"><div className="mb-3 flex items-center justify-between"><p className="eyebrow">Portfolio concentration</p><span className="font-mono text-[10px] text-[#6f7784]">BETA 1.36</span></div><div className="flex h-2 overflow-hidden rounded-full">{positions.map((p) => <span key={p.symbol} style={{ width: `${p.allocation}%`, background: p.color }} />)}</div><div className="mt-4 grid grid-cols-5 gap-1">{positions.map((p) => <div key={p.symbol}><p className="font-mono text-[10px] text-[#aeb5bf]">{p.symbol}</p><p className="mt-1 text-[10px] text-[#5e6672]">{p.allocation}%</p></div>)}</div></div>
              <div className="rounded-[16px] border border-white/[0.07] bg-[#0b0d10] p-4"><div className="flex items-start gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#ff9f6e]/10 text-[#ff9f6e]"><Newspaper className="size-4" /></div><div><div className="flex items-center gap-2"><p className="text-sm font-medium">Catalyst risk detected</p><span className="rounded bg-[#ff9f6e]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#ff9f6e]">HIGH</span></div><p className="mt-1 text-xs leading-5 text-[#7f8792]">Semiconductor export guidance raises left-tail risk across 49% of portfolio exposure.</p></div></div></div>
            </div>
          </section>

          <aside className="panel overflow-hidden">
            <div className="border-b border-white/[0.07] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Selected hedge</p><h2 className="mt-1 text-lg font-semibold">{proposal?.strategy ?? 'Live chain selector'}</h2></div><span className="rounded-md border border-[#d7ff45]/25 bg-[#d7ff45]/[0.06] px-2 py-1 font-mono text-[10px] text-[#d7ff45]">{proposal ? 'STAGED' : 'READY'}</span></div></div>
            <div className="p-4 sm:p-5">
              <div className="rounded-xl border border-white/[0.07] bg-[#0b0d10] p-3 font-mono text-xs"><div className="flex items-center justify-between border-b border-white/[0.06] pb-3"><div><span className="mr-2 rounded bg-[#d7ff45]/10 px-1.5 py-0.5 text-[9px] text-[#d7ff45]">BUY</span><span className="text-[#dfe3e8]">{longLabel}</span></div><span className="text-[#838b96]">{expiryLabel}</span></div><div className="flex items-center justify-between pt-3"><div><span className="mr-2 rounded bg-[#ff8d7c]/10 px-1.5 py-0.5 text-[9px] text-[#ff8d7c]">SELL</span><span className="text-[#dfe3e8]">{shortLabel}</span></div><span className="text-[#838b96]">{expiryLabel}</span></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2">{[['Net debit', proposal ? `$${proposal.netDebit.toFixed(2)}` : '—'], ['Contracts', proposal ? `${proposal.contracts}×` : '—'], ['Live QQQ', cycle ? money(cycle.market.spot) : '—'], ['Max protection', proposal ? money(proposal.maxProtection) : '—']].map(([k, v]) => <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-[#656d78]">{k}</p><p className="mt-1.5 font-mono text-sm text-[#dfe3e8]">{v}</p></div>)}</div>
              <p className="eyebrow mb-3 mt-5">Policy gates · {gateRows.filter((gate) => gate.passed).length}/{gateRows.length} passed</p>
              <div className="space-y-2">{gateRows.map(({ name, detail, passed }) => <div key={name} className="flex items-start gap-2.5 rounded-lg border border-white/[0.05] bg-[#0b0d10]/80 px-3 py-2.5"><span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${passed ? 'bg-[#d7ff45] text-black' : 'bg-[#ff8d7c] text-black'}`}><Check className="size-2.5" strokeWidth={3} /></span><div><p className="text-xs text-[#cfd4da]">{name}</p><p className="mt-0.5 text-[10px] text-[#606873]">{detail}</p></div></div>)}</div>
            </div>
          </aside>
        </section>

        <section className="panel mt-4 overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:px-5"><div className="flex items-center gap-2"><Radio className="size-3.5 text-[#d7ff45]" /><p className="eyebrow">Agent flight recorder</p><span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-[#636b76]">MACHINE-READABLE RECEIPT</span></div><p className="font-mono text-[10px] text-[#555d68]">{cycle?.receiptId ?? 'awaiting_live_cycle'}</p></div>
          <div className="divide-y divide-white/[0.06]">
            {ledgerRows.map(({ Icon, time, title, detail, status }, index) => (
              <div key={title} className={`grid gap-2 px-4 py-3.5 sm:grid-cols-[32px_72px_180px_1fr_auto] sm:items-center sm:px-5 ${index === 3 && phase === 'complete' ? 'bg-[#d7ff45]/[0.025]' : ''}`}><div className="hidden size-7 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.025] sm:grid"><Icon className="size-3.5 text-[#858d98]" /></div><span className="font-mono text-[10px] text-[#565e69]">{time}</span><span className="text-xs font-medium text-[#cdd2d8]">{title}</span><span className="text-xs text-[#707884]">{detail}</span><span className={`justify-self-start rounded px-2 py-1 font-mono text-[9px] sm:justify-self-end ${status.includes('SENT') || index < 3 ? 'bg-[#d7ff45]/[0.08] text-[#d7ff45]' : 'bg-white/[0.04] text-[#69717c]'}`}>{status}</span></div>
            ))}
          </div>
          {receiptOpen && cycle ? <pre className="max-h-80 overflow-auto border-t border-white/[0.06] bg-[#050607] p-4 font-mono text-[10px] leading-5 text-[#8d96a3]">{JSON.stringify(cycle, null, 2)}</pre> : null}
          <button onClick={() => setReceiptOpen((open) => !open)} disabled={!cycle} className="flex w-full items-center justify-center gap-1 border-t border-white/[0.06] py-2.5 text-[11px] text-[#69717c] transition hover:bg-white/[0.02] hover:text-[#aeb5bf] disabled:cursor-not-allowed disabled:opacity-40">{receiptOpen ? 'Close' : 'Open'} machine-readable receipt <ChevronRight className={`size-3 transition ${receiptOpen ? 'rotate-90' : ''}`} /></button>
        </section>

        <footer className="flex flex-col justify-between gap-2 px-1 pb-2 pt-4 text-[10px] uppercase tracking-[.14em] text-[#414852] sm:flex-row"><span>Paper trading only · Not investment advice</span><span>Powered by Alpaca Trading API + MCP</span></footer>
      </div>
    </main>
  );
}
