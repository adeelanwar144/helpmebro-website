/**
 * Split a university catalog attributes string into display chips.
 */
export function parseAttributeChips(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];

  const normalized = raw
    .replace(/Class Attributes:\s*/gi, '')
    .replace(/Class Attribute Values:\s*/gi, '');

  const chips = normalized
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return Array.from(new Set(chips));
}
