# Plan: Landing page (#36)

## Summary
A `<LandingPage>` component renders a centered card with the framing
copy and a Start button. App-level state (`useState` in `App` or a
small `landing-state` hook) decides whether to render `<LandingPage>`
or `<AppShell>`. The "What is this?" link sets state directly,
bypassing the localStorage write.

## Constitution Check
| Gate | Status |
|------|--------|
| Research-first | PASS — meets framing requirement (Principle I, spec.md §1). |
| Notes | N/A |
| Destruction | PASS (no FS writes; localStorage write is set-once, not destruction). |
| Backend | PASS (localStorage only). |
| Pinning | PASS (no new deps). |
| Limitations | PASS — localStorage-unavailable fallback documented in FR-006; not a new sharp edge. |

## Source-code shape
```
app/src/landing/
├── landing-page.tsx          # NEW — the framing card
├── use-landing-state.ts      # NEW — read/set the localStorage flag
└── landing-styles.css        # NEW — center card layout

app/src/App.tsx               # MODIFY — gate AppShell behind landing
app/src/components/shell/app-shell.tsx  # MODIFY — add "What is this?" link
```
