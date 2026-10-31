import React from 'react'

import { PagePanel } from '@/components/layout/PagePanel'

import styles from './AssessmentChat.module.scss'

export type GradedAnswer = {
  question: string
  answer: string
  score: number | null
  maxScore: number
  feedback: string | null
}

export type CompanyTestResultsApplication = {
  problemSolvingScore?: number | null
  cultureFitScore?: number | null
  problemSolvingAnswers?: GradedAnswer[] | null
  cultureFitAnswers?: GradedAnswer[] | null
}

const TestPanel = ({
  title,
  score,
  answers,
}: {
  title: string
  score: number
  answers: GradedAnswer[]
}) => (
  <PagePanel title={title} hint={<strong>{Math.round(score)}%</strong>}>
    <div className={styles.thread}>
      {answers.map((item, index) => (
        <React.Fragment key={`${item.question}-${index}`}>
          <div className={`${styles.row} ${styles.received}`}>
            <div className={styles.bubble}>
              <span className={styles.role}>Question</span>
              <p className={styles.content}>{item.question}</p>
            </div>
          </div>
          <div className={`${styles.row} ${styles.own}`}>
            <div className={styles.bubble}>
              <span className={styles.role}>Talent</span>
              <p className={styles.content}>{item.answer?.trim() || '—'}</p>
            </div>
          </div>
          <div className={styles.feedback}>
            <p className={styles.feedbackKicker}>
              AI grade{' '}
              <strong>{`${item.score ?? '—'}/${item.maxScore}`}</strong>
            </p>
            {item.feedback ? <p>{item.feedback}</p> : null}
          </div>
        </React.Fragment>
      ))}
    </div>
  </PagePanel>
)

/**
 * Problem-solving and culture-fit results in the recruiter's candidate panel
 * (plan Day 5): the % score and each graded answer with the AI's feedback.
 * A test the candidate hasn't taken isn't shown.
 */
export const CompanyTestResults = ({
  application,
}: {
  application: CompanyTestResultsApplication
}) => {
  const {
    problemSolvingScore,
    cultureFitScore,
    problemSolvingAnswers,
    cultureFitAnswers,
  } = application
  if (problemSolvingScore == null && cultureFitScore == null) return null
  return (
    <>
      {problemSolvingScore != null ? (
        <TestPanel
          title="Problem-solving test"
          score={problemSolvingScore}
          answers={problemSolvingAnswers ?? []}
        />
      ) : null}
      {cultureFitScore != null ? (
        <TestPanel
          title="Culture-fit test"
          score={cultureFitScore}
          answers={cultureFitAnswers ?? []}
        />
      ) : null}
    </>
  )
}
