// Single source of truth for Pyodide + Frictionless pins.
// Recorded alongside results in docs/architecture.md (Constitution VI).
export const PYODIDE_VERSION = '0.27.7';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;
export const FRICTIONLESS_VERSION = '5.19.0';

// Livemark publishing tool (lesson 9 — Publish with Livemark). Lazily
// installed on first use of the `livemark` command, NOT at startup, so the
// other lessons pay no download/latency cost.
export const LIVEMARK_VERSION = '0.110.8';
// marko is pinned to 1.x: livemark requires marko==1.*, while frictionless
// only requires marko>=1.0 (which alone resolves to 2.x). marko 1.3.1
// satisfies both, but it must be installed BEFORE frictionless — micropip
// 0.9 (Pyodide 0.27.7) cannot downgrade an already-installed package.
export const MARKO_VERSION = '1.3.1';
