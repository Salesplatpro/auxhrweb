import {
  AI_CONFIG_DEFAULT_VALUES,
  AiConfigFieldValues,
  DICHOTOMY_COUNT_FIELDS,
} from './aiConfigModel'

export interface AiConfigApiRecord {
  id?: string
  name?: string | null
  prescreeningAssessment?: boolean
  minPrescreeningScore?: number | null
  cvSimilarity?: boolean
  minCvSimilarityScore?: number | null
  personalizedAssessment?: boolean
  noPersonalizedQuestions?: number | null
  problemSolvingAssessment?: boolean
  noOfProblemSolvingQuestions?: number | null
  cultureFitAssessment?: boolean
  noOfCultureFitQuestions?: number | null
  personalityEvaluation?: boolean
  noOfEIQuestions?: number | null
  noOfSNQuestions?: number | null
  noOfTFQuestions?: number | null
  noOfJPQuestions?: number | null
  uploadedQuestions?: string[] | null
  recruiterGuide?: string | null
}

export const aiConfigFromApi = (
  config: AiConfigApiRecord,
): AiConfigFieldValues => ({
  name: config.name ?? '',
  prescreeningAssessment: config.prescreeningAssessment ? 'true' : 'false',
  minPrescreeningScore: config.minPrescreeningScore ?? '',
  cvSimilarity: config.cvSimilarity ? 'true' : 'false',
  minCvSimilarityScore: config.minCvSimilarityScore ?? '',
  personalizedAssessment: config.personalizedAssessment ? 'true' : 'false',
  noPersonalizedQuestions: config.noPersonalizedQuestions ?? '',
  problemSolvingAssessment: config.problemSolvingAssessment ? 'true' : 'false',
  noOfProblemSolvingQuestions: config.noOfProblemSolvingQuestions ?? '',
  cultureFitAssessment: config.cultureFitAssessment ? 'true' : 'false',
  noOfCultureFitQuestions: config.noOfCultureFitQuestions ?? '',
  personalityEvaluation: config.personalityEvaluation ? 'true' : 'false',
  noOfEIQuestions: config.noOfEIQuestions ?? '',
  noOfSNQuestions: config.noOfSNQuestions ?? '',
  noOfTFQuestions: config.noOfTFQuestions ?? '',
  noOfJPQuestions: config.noOfJPQuestions ?? '',
  uploadedQuestions: config.uploadedQuestions?.length
    ? config.uploadedQuestions
    : [''],
  recruiterGuide: config.recruiterGuide ?? '',
})

const SWITCH_FIELDS = [
  'cvSimilarity',
  'personalizedAssessment',
  'problemSolvingAssessment',
  'cultureFitAssessment',
  'personalityEvaluation',
] as const

/**
 * Merges a possibly older, partial saved draft over today's defaults. Older
 * drafts could hold a blank switch, which fails validation until toggled twice.
 */
export const withConfigDefaults = (
  values: Partial<AiConfigFieldValues> | null | undefined,
): AiConfigFieldValues => {
  const merged = { ...AI_CONFIG_DEFAULT_VALUES, ...(values ?? {}) }
  SWITCH_FIELDS.forEach((field) => {
    merged[field] = merged[field] === 'true' ? 'true' : 'false'
  })
  return merged
}

export const aiConfigToPayload = (values: AiConfigFieldValues) => {
  const cleaned: Partial<AiConfigFieldValues> = { ...values }

  if (values.cvSimilarity !== 'true') {
    delete cleaned.minCvSimilarityScore
  }
  if (values.personalizedAssessment !== 'true') {
    delete cleaned.noPersonalizedQuestions
  }
  if (values.problemSolvingAssessment !== 'true') {
    delete cleaned.noOfProblemSolvingQuestions
  }
  if (values.cultureFitAssessment !== 'true') {
    delete cleaned.noOfCultureFitQuestions
  }
  if (values.personalityEvaluation !== 'true') {
    delete cleaned.uploadedQuestions
    DICHOTOMY_COUNT_FIELDS.forEach((field) => delete cleaned[field])
  } else {
    // Each trait is optional on its own — a blank count means "skip this
    // trait" and must not be sent as '' (fails the backend's isInt()).
    DICHOTOMY_COUNT_FIELDS.forEach((field) => {
      if (cleaned[field] === '' || cleaned[field] == null) {
        delete cleaned[field]
      }
    })
    cleaned.uploadedQuestions = (values.uploadedQuestions ?? [])
      .map((question) => question.trim())
      .filter(Boolean)
  }
  if (!values.recruiterGuide?.trim()) {
    delete cleaned.recruiterGuide
  }

  return {
    ...cleaned,
    prescreeningAssessment: values.prescreeningAssessment === 'true',
    cvSimilarity: values.cvSimilarity === 'true',
    personalizedAssessment: values.personalizedAssessment === 'true',
    problemSolvingAssessment: values.problemSolvingAssessment === 'true',
    cultureFitAssessment: values.cultureFitAssessment === 'true',
    personalityEvaluation: values.personalityEvaluation === 'true',
  }
}
