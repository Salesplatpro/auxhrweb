import { AiConfigFieldValues, personalityTotal } from './aiConfigModel'
import { ScreeningStepKey } from './screeningSteps'

export interface JourneyStage {
  key: 'apply' | 'review' | ScreeningStepKey
  title: string
  detail: string
  /** Minutes the candidate spends on this stage; 0 when it runs automatically. */
  minutes: number
  /** What the journey shows on the right: "2 min", "Automatic", "About 15 min". */
  timeLabel: string
}

const MINUTES_TO_APPLY = 2
const SKILLS_TEST_MINUTES = 10
const AI_INTERVIEW_MINUTES = 15
const AI_INTERVIEW_QUESTIONS = 5
const MINUTES_PER_QUESTION = {
  tailored: 1.5,
  problemSolving: 1.3,
  cultureFit: 1.2,
  personality: 0.75,
}

const count = (value: string | number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

const questions = (n: number) => `${n} question${n === 1 ? '' : 's'}`

const timed = (
  key: JourneyStage['key'],
  title: string,
  detail: string,
  minutes: number,
): JourneyStage => ({
  key,
  title,
  detail,
  minutes,
  timeLabel: `${minutes} min`,
})

export const candidateJourney = (
  values: AiConfigFieldValues,
): { stages: JourneyStage[]; totalMinutes: number } => {
  const stages: JourneyStage[] = [
    timed('apply', 'Apply', 'Sends their profile and CV', MINUTES_TO_APPLY),
    timed(
      'skillsTest',
      'Skills test',
      values.minPrescreeningScore !== ''
        ? `Needs ${values.minPrescreeningScore}% or more`
        : 'Taken once, reused for every job',
      SKILLS_TEST_MINUTES,
    ),
  ]

  if (values.cvSimilarity === 'true') {
    stages.push({
      key: 'cvMatch',
      title: 'CV match',
      detail: 'AI reads every CV',
      minutes: 0,
      timeLabel: 'Automatic',
    })
  }

  const steps: {
    key: keyof typeof MINUTES_PER_QUESTION
    title: string
    on: boolean
    total: number
  }[] = [
    {
      key: 'tailored',
      title: 'Tailored questions',
      on: values.personalizedAssessment === 'true',
      total: count(values.noPersonalizedQuestions),
    },
    {
      key: 'problemSolving',
      title: 'Problem-solving test',
      on: values.problemSolvingAssessment === 'true',
      total: count(values.noOfProblemSolvingQuestions),
    },
    {
      key: 'cultureFit',
      title: 'Culture-fit test',
      on: values.cultureFitAssessment === 'true',
      total: count(values.noOfCultureFitQuestions),
    },
    {
      key: 'personality',
      title: 'Personality check',
      on: values.personalityEvaluation === 'true',
      total:
        personalityTotal(values) +
        (values.uploadedQuestions ?? []).filter((q) => q.trim()).length,
    },
  ]
  for (const step of steps) {
    if (!step.on || step.total === 0) continue
    stages.push(
      timed(
        step.key,
        step.title,
        questions(step.total),
        Math.ceil(step.total * MINUTES_PER_QUESTION[step.key]),
      ),
    )
  }

  if (values.aiInterview === 'true') {
    stages.push({
      key: 'aiInterview',
      title: 'AI interview',
      detail: questions(AI_INTERVIEW_QUESTIONS),
      minutes: AI_INTERVIEW_MINUTES,
      timeLabel: `About ${AI_INTERVIEW_MINUTES} min`,
    })
  }

  stages.push({
    key: 'review',
    title: 'You review',
    detail: 'Ranked and ready in your job post',
    minutes: 0,
    timeLabel: '',
  })

  return {
    stages,
    totalMinutes: stages.reduce((sum, stage) => sum + stage.minutes, 0),
  }
}
