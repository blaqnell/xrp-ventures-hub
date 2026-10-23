<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Account balances are an append-only ledger table written only by a security-definer admin function that checks roles and writes the audit log; balance = sum of entries. Why: adjustments must never be silently overwritten.
- Live XRP price comes from one shared browser WebSocket to Coinbase Exchange, throttled to a fixed UI interval and layered over the server-cached CoinGecko quote. Why: real-time prices without hammering the rate-limited CoinGecko API.
