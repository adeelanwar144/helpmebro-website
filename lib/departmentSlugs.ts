import { nameToDepartmentSlug } from './courseUtils';

/**
 * Ohio State subject-code → readable department name.
 * Used for slug generation (full words, hyphenated) instead of raw codes.
 */
export const OSU_SUBJECT_CODE_NAMES: Record<string, string> = {
  AEDECON: 'Agricultural Environmental and Development Economics',
  ARTEDUC: 'Arts Education',
  BUSADM: 'Business Administration',
  COMS: 'Communication',
  DESIGN: 'Design',
  EARTHSC: 'Earth Sciences',
  ECON: 'Economics',
  EHE: 'Education and Human Ecology',
  ENGR: 'Engineering',
  ESEPSY: 'Educational Studies and Educational Psychology',
  ESPHE: 'Exercise and Sport Science',
  KNSISM: 'Kinesiology',
  LAW: 'Law',
  MEDCOLL: 'Medicine',
  MICRBIO: 'Microbiology',
  MOLGEN: 'Molecular Genetics',
  PHILOS: 'Philosophy',
  PLNTPTH: 'Plant Pathology',
  POLITSC: 'Political Science',
  PORTGSE: 'Portuguese',
  PSYCH: 'Psychology',
  PUBHEHS: 'Public Health Environmental Health Sciences',
  PUBHEPI: 'Public Health Epidemiology',
  PUBHLTH: 'Public Health',
  RADSCI: 'Radiologic Sciences',
  SLAVIC: 'Slavic and East European Languages and Cultures',
  SOCWORK: 'Social Work',
};

export function getDepartmentDisplayName(rawName: string, universitySlug: string): string {
  const trimmed = rawName.trim();
  if (universitySlug === 'ohio-state') {
    const mapped = OSU_SUBJECT_CODE_NAMES[trimmed.toUpperCase()];
    if (mapped) return mapped;
  }
  return trimmed;
}

export function getDepartmentSlug(rawName: string, universitySlug: string): string {
  return nameToDepartmentSlug(getDepartmentDisplayName(rawName, universitySlug));
}
