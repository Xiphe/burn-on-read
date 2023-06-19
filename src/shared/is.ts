export function isRecord(arg: unknown): arg is Record<string, unknown> {
  return typeof arg === 'object' && arg !== null;
}
