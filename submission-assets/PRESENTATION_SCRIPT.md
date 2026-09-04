# TailGuard AI presentation script

Target length: 75 to 90 seconds

## Slide 1: An AI agent that buys downside protection

Hi, this is TailGuard AI, an agent that buys downside protection for an Alpaca Paper portfolio. The user describes a market selloff and sets the most they are willing to spend. TailGuard converts that instruction into a defined risk QQQ put spread.

## Slide 2: What the product does

Here is a real example. The user asked for protection from a five percent QQQ decline with a one hundred dollar budget. TailGuard read the live option chain, selected the 681 and 666 put spread, and set a twenty-seven cent limit debit. One contract could cost no more than twenty-seven dollars. The model interprets the request, while deterministic code chooses the contracts and price.

## Slide 3: The user journey

The workflow has four steps. First, the user sets the selloff scenario and premium limit. TailGuard then reads the Alpaca account, QQQ price, and option chain. The user reviews both option legs, the maximum cost, and five policy checks. A separate confirmation sends the capped multi leg order to Alpaca Paper and returns a full broker receipt.

## Slide 4: Alpaca Paper order test results

We tested broker execution with two Paper orders. Alpaca accepted a twenty-seven dollar spread for the five percent scenario and a twelve dollar spread for the eight percent scenario. Both responses included real broker order IDs. After verifying acceptance, we canceled the queued orders, and zero contracts filled. This proves that TailGuard reaches the Alpaca order API rather than simulating execution.

## Slide 5: How TailGuard limits risk

TailGuard only sends defined risk spreads, enforces the premium budget before submission, and requires explicit Paper confirmation. It never uses the live brokerage endpoint. After testing, we disabled production submission again. TailGuard shows how an AI trading agent can act through Alpaca while keeping the decision process inspectable and the financial risk capped.

## Recording notes

- Record in a quiet room and speak slightly slower than normal conversation.
- Pause briefly after changing each slide.
- Say “QQQ” as “Q Q Q.”
- Say “multi leg” naturally rather than spelling it.
- Export as MP4 or send the original audio or video file. A clean WAV, M4A, MP3, or MP4 recording is suitable.
