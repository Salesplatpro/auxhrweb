import * as Yup from 'yup'

import { emptyToUndefined } from '@/utils/yupHelpers'

import { DICHOTOMY_ERROR_KEY } from './aiConfigModel'

const DICHOTOMY_MESSAGE =
  'Add at least one personality question, or turn the personality check off'

const scoreField = (label: string) =>
  Yup.number()
    .typeError(`${label} must be a number`)
    .min(0, `${label} must be at least 0`)
    .max(100, `${label} can be at most 100`)

const traitCount = () =>
  Yup.number()
    .transform(emptyToUndefined)
    .typeError('Must be a number')
    .integer('Must be a whole number')
    .min(1, 'Must be at least 1')
    .notRequired()

export const aiConfigValidationSchema = Yup.object({
  name: Yup.string().trim().required('Give this setup a name'),

  // The skills test is always on — no toggle, so the score is always required.
  prescreeningAssessment: Yup.string().required('Required'),
  minPrescreeningScore: scoreField('Score').required('Set a skills test score'),

  cvSimilarity: Yup.string().oneOf(['true', 'false']).required('Required'),
  minCvSimilarityScore: scoreField('CV match').when('cvSimilarity', {
    is: 'true',
    then: (schema) => schema.required('Set a CV match score'),
    otherwise: (schema) => schema.notRequired(),
  }),

  personalizedAssessment: Yup.string()
    .oneOf(['true', 'false'])
    .required('Required'),
  noPersonalizedQuestions: Yup.number()
    .typeError('Must be a number')
    .when('personalizedAssessment', {
      is: 'true',
      then: (schema) =>
        schema
          .integer('Must be a whole number')
          .min(1, 'Ask at least 1 question')
          .max(20, 'Ask at most 20 questions')
          .required('Choose how many questions to ask'),
      otherwise: (schema) => schema.notRequired(),
    }),

  problemSolvingAssessment: Yup.string()
    .oneOf(['true', 'false'])
    .required('Required'),
  noOfProblemSolvingQuestions: Yup.number()
    .typeError('Must be a number')
    .when('problemSolvingAssessment', {
      is: 'true',
      then: (schema) =>
        schema
          .integer('Must be a whole number')
          .min(1, 'Ask at least 1 question')
          .max(10, 'Ask at most 10 questions')
          .required('Choose how many questions to ask'),
      otherwise: (schema) => schema.notRequired(),
    }),

  cultureFitAssessment: Yup.string()
    .oneOf(['true', 'false'])
    .required('Required'),
  noOfCultureFitQuestions: Yup.number()
    .typeError('Must be a number')
    .when('cultureFitAssessment', {
      is: 'true',
      then: (schema) =>
        schema
          .integer('Must be a whole number')
          .min(1, 'Ask at least 1 question')
          .max(10, 'Ask at most 10 questions')
          .required('Choose how many questions to ask'),
      otherwise: (schema) => schema.notRequired(),
    }),

  personalityEvaluation: Yup.string()
    .oneOf(['true', 'false'])
    .required('Required'),
  // No single trait is required — the object-level test below enforces "at
  // least one of four, only when enabled", matching the backend's
  // atLeastOneDichotomyPairValidator.
  noOfEIQuestions: traitCount(),
  noOfSNQuestions: traitCount(),
  noOfTFQuestions: traitCount(),
  noOfJPQuestions: traitCount(),
}).test('at-least-one-dichotomy', DICHOTOMY_MESSAGE, function (values) {
  if (values?.personalityEvaluation !== 'true') return true

  const hasAtLeastOne = [
    values.noOfEIQuestions,
    values.noOfSNQuestions,
    values.noOfTFQuestions,
    values.noOfJPQuestions,
  ].some((value) => value != null)

  if (hasAtLeastOne) return true

  return this.createError({
    path: DICHOTOMY_ERROR_KEY,
    message: DICHOTOMY_MESSAGE,
  })
})
