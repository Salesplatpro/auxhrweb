import { dayMonth, weekdayDayMonth } from './format'
import { STEP_TITLE, TEST_KIND_BY_STEP } from './steps'
import { CandidatePipeline, PipelineStep } from './types'

const questions = (step: PipelineStep) =>
  [
    step.questionCount ? `${step.questionCount} questions` : null,
    step.minutes ? `about ${step.minutes} min` : null,
  ].filter(Boolean)

const join = (parts: Array<string | null | false | undefined>) =>
  parts.filter(Boolean).join(' · ')

export const stepDescription = (
  step: PipelineStep,
  company: string,
): string => {
  const current = step.state === 'current'
  const done = step.state === 'done'
  switch (step.key) {
    case 'applied':
      return join([step.doneAt && dayMonth(step.doneAt), 'CV received'])
    case 'skills_test':
      if (done) {
        return step.score !== null
          ? join([
              `Score ${Math.round(step.score)}%`,
              step.passed ? 'passed' : null,
            ])
          : 'Done'
      }
      if (step.retryAt) return `Retake from ${dayMonth(step.retryAt)}`
      return join([
        `${step.minutes ?? 10} min`,
        current && step.dueAt && `due ${dayMonth(step.dueAt)}`,
      ])
    case 'cv_match':
      if (done) return 'Done'
      return current ? 'Checking your CV' : 'Automatic'
    case 'ai_interview':
      if (done)
        return step.doneAt ? `Recorded ${dayMonth(step.doneAt)}` : 'Recorded'
      return current
        ? join([...questions(step), step.dueAt && `by ${dayMonth(step.dueAt)}`])
        : `About ${step.minutes ?? 15} min`
    case 'references':
      if (done)
        return `${step.refereeCount} referee${
          step.refereeCount === 1 ? '' : 's'
        } added`
      return current
        ? `Add up to ${step.maxReferees} people who can vouch for you`
        : `You'll add up to ${step.maxReferees} referees later`
    case 'checks':
      if (done)
        return step.doneAt ? `Answered ${dayMonth(step.doneAt)}` : 'Answered'
      return `${company} asks for your permission to check your identity, past jobs and education`
    case 'company_review':
      if (step.outcome === 'shortlisted') return 'Shortlisted'
      if (step.outcome === 'not_proceeding') return 'Not proceeding'
      return `${company} decides`
    default:
      if (done) {
        if (step.key === 'problem_solving' || step.key === 'culture_fit') {
          return step.doneAt ? `Sent ${dayMonth(step.doneAt)}` : 'Sent'
        }
        return step.answersSent ? `${step.answersSent} answers sent` : 'Sent'
      }
      return join([
        step.isNew && 'New',
        ...questions(step),
        current && step.dueAt && `due ${dayMonth(step.dueAt)}`,
      ])
  }
}

export const actionLabel = (step: PipelineStep): string | null => {
  if (step.key === 'ai_interview') return 'Start interview'
  if (step.key === 'skills_test') return 'Take skills test'
  if (step.key === 'references') return 'Add referees'
  if (step.key === 'checks') return 'Review and answer'
  return TEST_KIND_BY_STEP[step.key] ? 'Start test' : null
}

export const nextStepCopy = (pipeline: CandidatePipeline): string => {
  const company = pipeline.application.job.organization?.name ?? 'The company'
  const { status } = pipeline.application
  if (status === 'shortlisted')
    return `${company} shortlisted you. They'll be in touch about what comes next.`
  if (status === 'rejected' || status === 'not_proceeding') {
    return `${company} decided not to move forward with this application.`
  }
  const step = pipeline.nextStep
  if (!step) return `${company} is reviewing your application.`
  const due = step.dueAt
  switch (step.key) {
    case 'ai_interview':
      return `${company} invited you to a recorded interview. It takes about ${
        step.minutes ?? 15
      } minutes.${due ? ` Do it any time before ${dayMonth(due)}.` : ''}`
    case 'skills_test':
      return step.retryAt
        ? `You can retake the skills test from ${dayMonth(step.retryAt)}.`
        : `Take the skills test${
            due ? ` before ${weekdayDayMonth(due)}` : ''
          }. It takes about ${step.minutes ?? 10} minutes.`
    case 'cv_match':
      return 'We’re checking your CV against the role. Nothing to do yet.'
    case 'references':
      return `Add up to ${step.maxReferees} referees who can vouch for you.`
    case 'checks':
      return `${company} would like to check your identity, past jobs and education. It takes about 2 minutes, and you can say no.`
    case 'company_review':
      return `${company} is reviewing your application. We’ll let you know when they decide.`
    default:
      return `Take the ${STEP_TITLE[step.key].toLowerCase()}${
        due ? ` before ${weekdayDayMonth(due)}` : ''
      }. You can only take it once, so find ${
        step.minutes ?? 10
      } quiet minutes.`
  }
}
