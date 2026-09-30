export type OptionKey = 'A' | 'B' | 'C' | 'D';

export type HSECategory =
  | 'Fire Safety & Emergency'
  | 'Environmental & Waste'
  | 'Occupational Health & Hygiene'
  | 'Hazard Control & JHA'
  | 'Incident & Man-Hours'
  | 'Permit to Work & Confined Space'
  | 'Security, Ethics & Community'
  | 'HSE Management & Law'
  | 'Journey Management';

export interface QuestionOption {
  key: OptionKey;
  text: string;
}

export interface HSEQuestion {
  id: number; // 1 to 120 matching the PDF
  pdfPage: number;
  answerKeyPage: number;
  category: HSECategory;
  questionText: string;
  subItems?: string[]; // For questions with numbered/roman numeral statements (e.g. Q11, Q41, Q107)
  options: QuestionOption[];
  correctAnswer: OptionKey;
  officialAnswerSummary: string;
  explanation: string;
  wrongOptionsAnalysis: Record<OptionKey, string>;
  isDuplicateOf?: number; // Points to original question ID if this is a repeated PDF question with shuffled options
}

export const HSE_CATEGORIES: {
  id: HSECategory;
  label: string;
  description: string;
}[] = [
  {
    id: 'Fire Safety & Emergency',
    label: 'Fire Safety & Emergency',
    description: 'PASS method, fire classes, combustion phases, heat transfer, and emergency plans.',
  },
  {
    id: 'Environmental & Waste',
    label: 'Environmental & Waste',
    description: 'ISO 14001:2015, waste hierarchy, environmental aspects, pollution, and waste inventory.',
  },
  {
    id: 'Hazard Control & JHA',
    label: 'Hazard Control & JHA',
    description: 'Job Hazard Analysis, Potential Problem Analysis, Hierarchy of Controls, PPE, and housekeeping.',
  },
  {
    id: 'Occupational Health & Hygiene',
    label: 'Occupational Health & Hygiene',
    description: 'Toxicology, routes of entry, acute vs. chronic exposure, radiation, ergonomics, and First Aid.',
  },
  {
    id: 'Incident & Man-Hours',
    label: 'Incident & Man-Hours',
    description: 'LWC, MTC, FAC, permanent disability, direct vs. indirect costs, investigation, and man-hour math.',
  },
  {
    id: 'Permit to Work & Confined Space',
    label: 'Permit to Work & Confined Space',
    description: 'Permit issuer competencies, extensions, revocations, LOTO, and confined space roles.',
  },
  {
    id: 'Security, Ethics & Community',
    label: 'Security, Ethics & Community',
    description: 'Industrial security, CPTED, workplace theft, fraud, community development, and crisis prevention.',
  },
  {
    id: 'HSE Management & Law',
    label: 'HSE Management & Law',
    description: 'HSE-MS elements, safety policies, horizontal standards, and ISPON Act 2014.',
  },
  {
    id: 'Journey Management',
    label: 'Journey Management',
    description: 'Journey Management System, speed/delivery calculations, and journey decision making.',
  },
];
