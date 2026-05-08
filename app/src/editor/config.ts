// Pinned Monaco assets — the CDN URL is the runtime pin (Constitution
// Principle VI). Bumps here MUST also update package.json's
// `monaco-editor` version to keep types in sync.

export const MONACO_VERSION = '0.52.2';
export const MONACO_CDN_VS_URL = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;

export const AUTOSAVE_DEBOUNCE_MS = 500;
