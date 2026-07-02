export interface HubInternalLink {
  slug: string;
  label: string;
}

export interface HubFaqItem {
  question: string;
  answer: string;
}

export interface HubSection {
  heading: string;
  body: string;
}

export type HubContentBlock =
  | { type: 'intro'; text: string }
  | { type: 'cta'; label: string }
  | { type: 'badges'; items: string[] }
  | { type: 'section'; heading: string; paragraphs: string[] }
  | { type: 'faq'; items: HubFaqItem[] };

export interface HubPage {
  slug: string;
  sourceFile: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  schemaTypes: string[];
  h1: string;
  intro: string;
  badges: string[];
  sections: HubSection[];
  faq: HubFaqItem[];
  ctas: string[];
  blocks: HubContentBlock[];
  internalLinks: HubInternalLink[];
  lastReviewed: string;
}
