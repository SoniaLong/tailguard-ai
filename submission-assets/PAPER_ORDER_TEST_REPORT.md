# Alpaca Paper order test report

Test date: 4 September 2026

TailGuard submitted two defined risk QQQ put debit spreads to the Alpaca Paper endpoint. Alpaca accepted both orders and returned broker order IDs. The test then canceled both queued orders so they could not fill later.

| Scenario | Long put | Short put | Limit debit | Maximum premium | Alpaca order ID | Accepted status | Final status | Filled quantity |
| --- | --- | --- | ---: | ---: | --- | --- | --- | ---: |
| 5% QQQ drop | QQQ260911P00681000 | QQQ260911P00666000 | $0.27 | $27 | `95c4b8e8-6cf2-4974-9c16-7b452598cf99` | accepted | canceled | 0 |
| 8% QQQ drop | QQQ260911P00660000 | QQQ260911P00645000 | $0.12 | $12 | `77359dc5-9cd4-4daf-9c27-1f9ab99f6260` | accepted | canceled | 0 |

## Controls verified

- Paper endpoint only: `https://paper-api.alpaca.markets`.
- One contract per multi leg order.
- Defined risk vertical spreads with no naked short option.
- Limit debit constrained by the user premium budget.
- Alpaca submission required both `ALLOW_PAPER_EXECUTION=true` and `confirmPaperOrder=true`.
- Local and production execution returned to disabled after the test.

The complete API responses are stored in `paper-order-receipt-1.json` and `paper-order-receipt-2.json`.
