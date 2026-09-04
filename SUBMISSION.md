# TailGuard AI — submission pack

## Project title

TailGuard AI — Autonomous Options Insurance

## Short description

TailGuard turns a plain-English downside-risk mandate into a live, deterministic QQQ put-spread proposal using Alpaca Paper account and market data, then proves every safety decision with a machine-readable receipt.

## Long description

Most trading agents optimize for returns. TailGuard optimizes for survival.

A user defines a maximum portfolio loss and hedge budget in plain English. TailGuard reads the connected Alpaca Paper account, market clock, QQQ price, and live indicative options chain. A deterministic optimizer—not the language model—selects the contract symbols, expiry, limit debit, and quantity. It rejects naked risk, stale or unusable quotes, excessive bid/ask spreads, premium-budget violations, inactive accounts, and expiries outside policy.

The winning defined-risk spread is transformed into a valid Alpaca multi-leg order payload and staged, not submitted. The dashboard then exposes the account state, market source, scanned-contract count, candidate count, payoff limits, policy gates, and complete JSON audit receipt. The production build deliberately keeps `ALLOW_PAPER_EXECUTION=false`, demonstrating a fail-closed boundary between AI interpretation and financial execution.

This makes TailGuard useful as a safety layer for retail portfolios, adviser tooling, or any autonomous trading system that needs explainable downside protection.

## Technology and category tags

Alpaca Trading API, Alpaca Market Data API, AI Agents, FinTech, Options, Risk Management, React, TypeScript, Cloudflare Workers, OpenAI Sites

## Demo application

- Platform: OpenAI Sites
- URL: https://tailguard-ai.airy-otter-8097.chatgpt.site/

## Repository

Add the public GitHub repository URL here after publishing the repository.

## 60-second demo script

1. Show “Alpaca Paper connected” and the live account equity.
2. Set a 5% stress scenario and a $350 maximum hedge cost.
3. Click **Run protection cycle**.
4. Point out the live QQQ price and the selected put debit spread.
5. Show all five policy gates passing and the “NOT SUBMITTED” safety status.
6. Open the machine-readable receipt and highlight the Alpaca multi-leg payload, contract scan count, and `orderSubmitted: false` field.

## Suggested presentation outline

1. Problem — autonomous traders chase upside but lack a dedicated downside governor.
2. Product — natural-language risk mandate to defined-risk options insurance.
3. Architecture — Alpaca data, deterministic optimizer, policy gates, staged order, receipt.
4. Demo — run a live protection cycle.
5. Safety and business value — fail-closed execution with auditable controls.

## Prepared visual assets

- Cover image: `submission-assets/TailGuard_AI_Cover.png`
- Pitch deck: `submission-assets/TailGuard_AI_Pitch_Deck.pptx`
- Narrated demo video: `submission-assets/TailGuard_AI_Demo_Video.mp4`

## Submission assets still requiring user-owned input

- A public GitHub repository URL.
- Upload the prepared demo video and paste its public URL.
- Change the deployed demo audience from owner-only to public.
- Upload the prepared deck and cover image to lablab.ai.
