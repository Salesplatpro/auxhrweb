export interface AiConfigFieldValues {
  name: string
  prescreeningAssessment: string
  minPrescreeningScore: string | number
  cvSimilarity: string
  minCvSimilarityScore: string | number
  personalizedAssessment: string
  noPersonalizedQuestions: string | number
  problemSolvingAssessment: string
  noOfProblemSolvingQuestions: string | number
  cultureFitAssessment: string
  noOfCultureFitQuestions: string | number
  personalityEvaluation: string
  noOfEIQuestions: string | number
  noOfSNQuestions: string | number
  noOfTFQuestions: string | number
  noOfJPQuestions: string | number
  uploadedQuestions: string[]
  recruiterGuide: string
}

export const AI_CONFIG_DEFAULT_VALUES: AiConfigFieldValues = {
  name: '',
  prescreeningAssessment: 'true',
  minPrescreeningScore: '',
  cvSimilarity: 'false',
  minCvSimilarityScore: '',
  personalizedAssessment: 'false',
  noPersonalizedQuestions: '',
  problemSolvingAssessment: 'false',
  noOfProblemSolvingQuestions: '',
  cultureFitAssessment: 'false',
  noOfCultureFitQuestions: '',
  personalityEvaluation: 'false',
  noOfEIQuestions: '',
  noOfSNQuestions: '',
  noOfTFQuestions: '',
  noOfJPQuestions: '',
  uploadedQuestions: [''],
  recruiterGuide: '',
}

export const DICHOTOMY_PAIRS = ['EI', 'SN', 'TF', 'JP'] as const
export type DichotomyPair = (typeof DICHOTOMY_PAIRS)[number]

export type CountFieldName =
  | 'noOfEIQuestions'
  | 'noOfSNQuestions'
  | 'noOfTFQuestions'
  | 'noOfJPQuestions'

export const COUNT_FIELD: Record<DichotomyPair, CountFieldName> = {
  EI: 'noOfEIQuestions',
  SN: 'noOfSNQuestions',
  TF: 'noOfTFQuestions',
  JP: 'noOfJPQuestions',
}

export const DICHOTOMY_COUNT_FIELDS = Object.values(COUNT_FIELD)

export const DICHOTOMY_ERROR_KEY = 'personalityDichotomy' as const

/** Plain-language names for the four personality traits; candidates never see these. */
export const PAIR_LABEL: Record<
  DichotomyPair,
  { title: string; help: string }
> = {
  EI: {
    title: 'Team energy',
    help: 'Do they recharge working with people, or with focused solo work?',
  },
  SN: {
    title: 'Detail vs big picture',
    help: 'Do they focus on facts and details, or on ideas and patterns?',
  },
  TF: {
    title: 'How they decide',
    help: 'Do they lean on logic and data, or on people and feelings?',
  },
  JP: {
    title: 'Planning style',
    help: 'Do they prefer clear plans and deadlines, or staying flexible?',
  },
}

const toCount = (value: string | number | null | undefined) => {
  const parsed = Number(value)
  return value === '' || value == null || !Number.isFinite(parsed)
    ? 0
    : Math.max(0, Math.floor(parsed))
}

export const personalityTotal = (values: AiConfigFieldValues) =>
  DICHOTOMY_COUNT_FIELDS.reduce((sum, field) => sum + toCount(values[field]), 0)

/** Spreads a total question count across the four traits, earlier traits first. */
export const splitPersonalityCount = (
  total: number,
): Record<CountFieldName, string> => {
  const safeTotal = Math.max(0, Math.floor(total))
  const base = Math.floor(safeTotal / DICHOTOMY_PAIRS.length)
  const extra = safeTotal % DICHOTOMY_PAIRS.length
  return DICHOTOMY_PAIRS.reduce((acc, pair, index) => {
    const count = base + (index < extra ? 1 : 0)
    acc[COUNT_FIELD[pair]] = count > 0 ? String(count) : ''
    return acc
  }, {} as Record<CountFieldName, string>)
}
