import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import rehypeHighlight from 'rehype-highlight';

export const ALLOWED_HIGHLIGHT_LANGUAGES = {
  bash,
  json,
  python,
  yaml,
} as const;

export const rehypeHighlightConfigured: [typeof rehypeHighlight, Record<string, unknown>] = [
  rehypeHighlight,
  {
    languages: ALLOWED_HIGHLIGHT_LANGUAGES,
    detect: false,
    ignoreMissing: true,
  },
];
