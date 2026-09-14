# Credit System

Credits are internal application units. They are separate from Google/Gemini billing credits.

## Rules
- Show cost before an expensive AI operation.
- Pricing is configurable and must not be hard-coded into UI logic.
- Reserve credits before the AI call.
- Finalize the reservation on success.
- Refund the reservation on generation failure, timeout, or provider failure where appropriate.
- Unauthorized or rejected requests must not consume credits.
- Insufficient balance stops the operation before the AI call.
- Use an atomic server-side transaction/function/locking strategy to prevent race conditions and double-spending.
- Maintain a ledger in `credit_transactions`.

## Example
If extraction is configured at 6 credits per item and 3 items are selected, the UI displays 18 credits before confirmation. The actual rate remains configurable.

## Modes
- `limited`: balance is enforced.
- `unlimited`: generation is allowed without decrementing a finite balance, while usage can still be logged.
