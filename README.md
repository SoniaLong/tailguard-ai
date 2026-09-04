# TailGuard AI

TailGuard is an autonomous options-insurance agent for the Alpaca AI Trading Agents Hackathon. It turns a natural-language risk mandate into a deterministic, defined-risk hedge and records every decision in a machine-readable flight recorder.

## The 60-second demo

1. Set a downside scenario and premium budget.
2. TailGuard parses the mandate and scores current catalyst risk.
3. The deterministic optimizer searches the live Alpaca indicative options chain.
4. Policy gates reject naked risk, poor liquidity, budget breaches, and invalid expiries.
5. The winning put debit spread is converted into an Alpaca multi-leg Paper order payload, but not submitted.
6. The dashboard shows the before/after loss profile and audit receipt.

## Safety boundary

The AI may interpret the mandate and summarize catalysts. It may not invent option symbols, prices, quantities, or order IDs. Contract selection, payoff math, sizing, and risk gates are deterministic. Execution is Paper-only and disabled by default.

## Stack

- Vinext / React / TypeScript
- Alpaca Trading API and official MCP server
- Tailwind CSS and Shadcn primitives
- Cloudflare-compatible OpenAI Sites deployment

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` only when connecting the dedicated Alpaca Paper account. Hosted credentials are encrypted runtime secrets and never reach the browser. `ALLOW_PAPER_EXECUTION=false` keeps the submission build in staging-only mode.

## Submission architecture

`Account + positions + stock snapshot + options chain → mandate parser → deterministic hedge optimizer → policy gates → staged Alpaca Paper order payload → audit receipt`

Paper trading is a simulation and TailGuard is not investment advice.
