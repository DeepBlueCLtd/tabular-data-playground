export type SchemaLabel = 'Data Package' | 'Dialect' | 'Table Schema' | null;

export function schemaForPath(path: string | null | undefined): SchemaLabel {
  if (!path) return null;
  const lower = path.toLowerCase();
  const base = lower.split('/').pop() ?? '';
  if (base === 'datapackage.json') return 'Data Package';
  if (base === 'dialect.json') return 'Dialect';
  if (base === 'schema.json' || base.endsWith('.schema.json')) return 'Table Schema';
  return null;
}
