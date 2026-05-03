# V2-A — Navigation and exit semantics

## Problem

Patrik asked for an “exit button” meaning: exit the current game screen back to main/setup so he can change seats/player setup. Clawd initially misunderstood it as “close menu.” That was wrong.

Current state:

- top hamburger opens menu
- drawer close / “Exit menu” just closes drawer
- “New table” starts another table immediately, which is dangerous and not the same as setup
- no clean route back to setup while preserving/abandoning current game intentionally

## Desired UX

Menu actions should be conceptually separated:

### Safe / non-destructive

- Back to board / close menu
- Refresh state
- Center board
- Rules
- Invite links

### Navigation

- Exit to setup
  - returns to landing/setup page
  - clears current `gameId`/`token` from UI state and URL
  - does not delete the server game
  - user can create a new table from setup

### Destructive-ish / table creation

- New table should not be an accidental primary action inside the game menu.
- Prefer: `Exit to setup` first; create new table only from setup.

## Implementation notes

- Add `exitToSetup()` in `App`:
  - `setState(null)`
  - `setGameId(null)`
  - `setToken(null)`
  - `setCreated(null)` maybe preserve only if useful? likely clear
  - `setOpenDrawer(null)`
  - `window.history.replaceState(null, "", "/")`
- Menu label should be literal: `Exit to setup` or `Exit game to setup`.
- Keep close X for closing drawer.
- Avoid wording “Exit menu” for close; use “Back to board.”

## QA

- From active game, open menu → Exit to setup.
- Confirm landing/setup page appears.
- Browser URL is `/`.
- Starting a new table works.
- Old game still exists if URL/token retained elsewhere; exit is not server delete.
