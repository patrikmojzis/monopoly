# 07 — Real Trades

## Problem

Current trade desk executes immediate “trusted” transfers. Patrik correctly says trades should be normal: propose, review, accept/reject.

## Goal

Implement a pending trade state machine in backend and a real trade modal in UI.

## Brainstorm

### User flow

1. Patrik opens Trade.
2. Chooses target player.
3. Builds offer:
   - I give: cash + selected properties.
   - I get: cash + selected properties.
4. Sends proposal.
5. Other player sees pending trade overlay.
6. Other player accepts or rejects.
7. Backend validates again and applies transfer on accept.

### Backend state

Add to `GameState`:

```py
pending_trade: TradeProposal | None

@dataclass
class TradeProposal:
    id: str
    from_player: Player
    to_player: Player
    cash_from: int
    cash_to: int
    properties_from: list[int]
    properties_to: list[int]
    created_version: int
```

### Actions

- `propose_trade`
- `accept_trade`
- `reject_trade`
- `cancel_trade`

Maybe keep old `trade` action hidden/debug-only for tests or remove after migration.

### Validation

On proposal:

- proposer active.
- target active.
- cash non-negative and within proposer/target current cash.
- proposer owns properties_from.
- target owns properties_to.
- no traded property belongs to improved color group unless buildings sold.
- mortgaged status travels.

On accept:

- same validations again, because state may have changed.
- only `to_player` can accept/reject.
- only `from_player` can cancel.

### UI

Trade modal:

```text
Trade with Clawd
┌ I give ─────────┐ ┌ I get ──────────┐
│ € [___]         │ │ € [___]         │
│ [deed cards]    │ │ [their cards]   │
└─────────────────┘ └─────────────────┘
[Send proposal]
```

Pending overlay:

- “Patrik offers X for Y”
- Accept / Reject
- show property cards, not plain text.

### Agent play implications

For Patrik-vs-Clawd, if Patrik proposes a trade to Clawd, Clawd should evaluate it and respond via API/chat, not require Patrik to control Clawd token.

## Concrete implementation notes

- Update `Phase`? Trade can happen during `end` or maybe debt. Pending trade may coexist with phase.
- Add storage migrations for `pending_trade`.
- Add public state serialization.
- Update TS types.
- Update `legal_actions`.
- Add tests:
  - propose/accept cash trade.
  - reject/cancel.
  - cannot accept stale invalid trade.
  - cannot trade improved property.
  - mortgage stays attached.

## Acceptance criteria

- No “trusted” language in UI.
- Trades are proposals.
- Other player explicitly accepts/rejects.
- Backend prevents invalid/stale transfers.
