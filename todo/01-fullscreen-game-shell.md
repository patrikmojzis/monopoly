# 01 — Fullscreen Game Shell

## Problem

Current UI still scrolls like a dashboard. The board is improved, but it competes with header, status cards, banners, coach, auction panel, deed panel, legal actions, log, rules, and side panels. Patrik explicitly asked: **make it full screen; board should feel like a game, not a website.**

## Goal

Build a `GameModeShell` that occupies the viewport and treats everything as overlays around a board table.

## Brainstorm

### Layout idea: fixed viewport table

```text
┌──────────────────────────────────────────────┐
│ tiny top overlay: Panda Capital · menu · ping │
├──────────────────────────────────────────────┤
│   player seat       compact HUD      seat     │
│                                              │
│              HUGE BOARD CANVAS               │
│                                              │
│   action dock / cards / drawers / log button │
└──────────────────────────────────────────────┘
```

Use CSS:

- `html, body, #root { height: 100%; overflow: hidden; }` for game route.
- `.game-mode { height: 100dvh; display: grid; grid-template-rows: auto 1fr auto; }`
- Board area uses `minmax(0, 1fr)` so it actually fits.
- Internal board pan/zoom area can scroll, not whole document.

### Desktop sizes

- 1440×900: board should be ~780–860px square.
- 1280×720: board should still dominate; hide secondary panels by default.
- Wide monitor: board center, side drawers can open without shrinking too much.

### Tablet/iPad

- Similar to desktop but with touch-first dock.
- Board should not sit halfway down the page after panels.
- Seat cards can become compact pills.

### Mobile

- Fullscreen board with pan/zoom.
- Bottom action dock.
- Deed hand as bottom sheet.
- Log/settings/rules as modal drawers.

## Concrete implementation notes

- Add a new top-level class on game route: `.game-mode-shell`.
- Replace current app-shell scroll layout for active game only.
- Create components:
  - `GameTopChrome`
  - `GameHud`
  - `BoardStage`
  - `ActionDock`
  - `DrawerHost`
- Keep landing page unchanged.
- Avoid huge page history/log below board in default view.

## Acceptance criteria

- At first load, the board is visible without scrolling.
- Primary action is visible without scrolling.
- Page itself does not feel like a long document.
- Secondary panels open intentionally; they do not push the board down.
- Screenshot should look like a game screen, not a SaaS dashboard.
