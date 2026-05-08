// Single source of truth for the Pyodide pin used by Spike A.
// Constitution Principle VI requires this version to be recorded
// alongside the spike's results in docs/architecture.md.

export const PYODIDE_VERSION = "0.27.7";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;
