import type { CSSProperties, ReactNode } from 'react';
import { DEFAULT_UNIVERSITY_ACCENT } from '@/lib/universityMeta';
import { getUniversityAccentColor } from '@/lib/universities';

interface Props {
  shortKey: string;
  children: ReactNode;
}

/** Injects --university-accent for secondary UI accents on university-scoped pages. */
export default function UniversityThemeProvider({ shortKey, children }: Props) {
  const accent = getUniversityAccentColor(shortKey) || DEFAULT_UNIVERSITY_ACCENT;

  return (
    <div
      className="university-themed contents"
      style={{ '--university-accent': accent } as CSSProperties}
    >
      {children}
    </div>
  );
}
