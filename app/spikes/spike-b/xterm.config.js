// Pinned xterm.js for Spike B. Recorded in docs/architecture.md
// alongside the Phase 0 result.

export const XTERM_VERSION = "5.5.0";
const BASE = `https://cdn.jsdelivr.net/npm/@xterm/xterm@${XTERM_VERSION}`;
export const XTERM_CSS_URL = `${BASE}/css/xterm.css`;
export const XTERM_JS_URL  = `${BASE}/lib/xterm.js`;

export const FIT_VERSION = "0.10.0";
export const FIT_JS_URL  = `https://cdn.jsdelivr.net/npm/@xterm/addon-fit@${FIT_VERSION}/lib/addon-fit.js`;
