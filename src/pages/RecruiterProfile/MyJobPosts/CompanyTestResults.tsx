import React from 'react'

import { PagePanel } from '@/components/layout/PagePanel'

import styles from './AssessmentChat.module.scss'

export type GradedAnswer = {
  question: string
  answer: string
  score: number | null
  maxScore: number
  feedback: string | null
  options?: string[]
  selectedOption?: number
  correctOption?: number
}

const LETTERS = ['A', 'B', 'C', 'D']

const isChoice = (item: GradedAnswer) =>
  !!item.options &&
  item.selectedOption !== undefined &&
  item.correctOption !== undefined

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
              <p className={styles.content}>
                {isChoice(item) ? `${LETTERS[item.selectedOption!]}. ` : ''}
                {item.answer?.trim() || '—'}
              </p>
            </div>
          </div>
          <div className={styles.feedback}>
            {isChoice(item) ? (
              <p className={styles.feedbackKicker}>
                {item.selectedOption === item.correctOption ? (
                  <strong>Correct</strong>
                ) : (
                  <>
                    <strong>Wrong</strong> · correct answer{' '}
                    {LETTERS[item.correctOption!]}.{' '}
                    {item.options![item.correctOption!]}
                  </>
                )}
              </p>
            ) : (
              <>
                <p className={styles.feedbackKicker}>
                  AI grade{' '}
                  <strong>{`${item.score ?? '—'}/${item.maxScore}`}</strong>
                </p>
                {item.feedback ? <p>{item.feedback}</p> : null}
              </>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  </PagePanel>
)

/**
 * Problem-solving and culture-fit results in the recruiter's candidate panel
 * (plan Day 5): the % score and each answer, marked right or wrong.
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
