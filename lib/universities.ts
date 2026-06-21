import registryData from '@/lib/generated/universityRegistry.json';
import type { UniversityMeta } from '@/lib/universityMeta';
import {
  DEFAULT_UNIVERSITY_ACCENT,
  getAssignmentHelpDisplayName,
} from '@/lib/universityMeta';

const REGISTRY = registryData as UniversityMeta[];

export type LiveUniversitySlug = UniversityMeta['shortKey'];

export function getUniversityRegistry(): UniversityMeta[] {
  return REGISTRY;
}

export function getUniversityByShortKey(shortKey: string): UniversityMeta | undefined {
  return REGISTRY.find((u) => u.shortKey === shortKey);
}

export function getUniversityByDisplaySlug(displaySlug: string): UniversityMeta | undefined {
  return REGISTRY.find((u) => u.displaySlug === displaySlug);
}

export function getLiveUniversities(): UniversityMeta[] {
  return REGISTRY.filter((u) => u.status === 'live');
}

export function getComingSoonUniversities(): UniversityMeta[] {
  return REGISTRY.filter((u) => u.status === 'coming_soon');
}

/** @deprecated Prefer getLiveUniversities() — kept for gradual migration. */
export function getLiveUniversityShortKeys(): string[] {
  return getLiveUniversities().map((u) => u.shortKey);
}

/** @deprecated Prefer getLiveUniversities() */
export const LIVE_UNIVERSITY_SLUGS = getLiveUniversityShortKeys();

export function isLiveSlug(slug: string): boolean {
  return getLiveUniversities().some((u) => u.shortKey === slug);
}

export function isComingSoonSlug(slug: string): boolean {
  return getComingSoonUniversities().some((u) => u.shortKey === slug);
}

export function isKnownUniversitySlug(slug: string): boolean {
  return Boolean(getUniversityByShortKey(slug));
}

export function getComingSoonUniversity(slug: string): UniversityMeta | undefined {
  const uni = getUniversityByShortKey(slug);
  return uni?.status === 'coming_soon' ? uni : undefined;
}

export function resolveUniversityKeyFromSubdomain(hostSubdomain: string): string | null {
  const match = REGISTRY.find(
    (u) => u.status === 'live' && u.displaySlug === hostSubdomain
  );
  return match?.shortKey ?? null;
}

export function getUniversitySubdomainSlug(shortKey: string): string | null {
  const uni = getUniversityByShortKey(shortKey);
  if (!uni || uni.status !== 'live') return null;
  return uni.displaySlug;
}

export function getUniversityAssignmentHelpName(shortKey: string, fallback = ''): string {
  const uni = getUniversityByShortKey(shortKey);
  if (!uni) return fallback;
  return getAssignmentHelpDisplayName(uni);
}

export function getUniversityAccentColor(shortKey: string): string {
  const accent = getUniversityByShortKey(shortKey)?.theme.accentColor;
  return accent?.trim() || DEFAULT_UNIVERSITY_ACCENT;
}

export function getUniversityFullName(shortKey: string, fallback = ''): string {
  return getUniversityByShortKey(shortKey)?.fullName ?? fallback;
}
