import type { Monaco } from '@monaco-editor/react';
import dataPackageSchema from './schemas/data-package.json';
import tableDialectSchema from './schemas/table-dialect.json';
import tableSchema from './schemas/table-schema.json';

interface SchemaSlot {
  uri: string;
  fileMatch: string[];
  schema: object;
  liveUrl: string;
}

function caseVariants(base: string): string[] {
  // base is a lowercase filename like 'datapackage.json'
  const upper = base.toUpperCase();
  const cap = base[0]?.toUpperCase() + base.slice(1);
  // Known stylings users hit in the wild.
  const camel =
    base === 'datapackage.json'
      ? 'DataPackage.json'
      : base === 'dialect.json'
        ? 'Dialect.json'
        : base === 'schema.json'
          ? 'Schema.json'
          : base;
  return Array.from(new Set([base, cap, upper, camel])).map((n) => `**/${n}`);
}

const SCHEMAS: SchemaSlot[] = [
  {
    uri: 'https://specs.frictionlessdata.io/schemas/data-package.json',
    fileMatch: caseVariants('datapackage.json'),
    schema: dataPackageSchema,
    liveUrl: 'https://specs.frictionlessdata.io/schemas/data-package.json',
  },
  {
    uri: 'https://specs.frictionlessdata.io/schemas/table-dialect.json',
    fileMatch: caseVariants('dialect.json'),
    schema: tableDialectSchema,
    liveUrl: 'https://specs.frictionlessdata.io/schemas/table-dialect.json',
  },
  {
    uri: 'https://specs.frictionlessdata.io/schemas/table-schema.json',
    fileMatch: [...caseVariants('schema.json'), '**/*.schema.json', '**/*.Schema.json'],
    schema: tableSchema,
    liveUrl: 'https://specs.frictionlessdata.io/schemas/table-schema.json',
  },
];

let registered = false;

function applyDiagnostics(monaco: Monaco, slots: SchemaSlot[]) {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    enableSchemaRequest: true,
    schemas: slots.map((s) => ({
      uri: s.uri,
      fileMatch: s.fileMatch,
      schema: s.schema,
    })),
  });
}

async function fetchWithTimeout(url: string, ms: number): Promise<unknown> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export function registerJsonSchemas(monaco: Monaco): void {
  if (registered) return;
  registered = true;
  applyDiagnostics(monaco, SCHEMAS);

  // Kick off background upgrades.
  void Promise.all(
    SCHEMAS.map(async (slot, idx) => {
      try {
        const live = await fetchWithTimeout(slot.liveUrl, 2000);
        if (live && typeof live === 'object') {
          SCHEMAS[idx] = { ...slot, schema: live as object };
        }
      } catch {
        // Bundle stays in effect; quiet fallback.
      }
    }),
  ).then(() => applyDiagnostics(monaco, SCHEMAS));
}
