import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  MdAccessTime,
  MdCheckCircle,
  MdInfo,
  MdOutlineAssessment,
  MdRefresh,
} from 'react-icons/md'
import { useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  retakeAssessment,
  retryAssessmentGeneration,
  submitAssessment,
} from './api'
import Questions from './components/Questions'
import ResultCard from './components/ResultCard'
import { COUNTDOWN_FROM, SECONDS_PER_QUESTION } from './constants'
import { formatTime, useAssessmentTimer, usePreAssessment } from './hooks'
import { useAssessmentLockStore } from './lockStore'
import styles from './page.module.scss'
import { usePreAssessmentStore } from './store'

type PreAssessmentPageProps = {
  onContinue?: () => void
}

const PreAssessmentPage: React.FC<PreAssessmentPageProps> = ({
  onContinue,
}) => {
  const location = useLocation()
  const shouldLockNavigation = !location.pathname.includes('/apply/')

  const { assessment, isLoading, fetchError, isProfileIncomplete, refetch } =
    usePreAssessment()

  const assessmentStarted = usePreAssessmentStore((s) => s.assessmentStarted)
  const countdownCompleted = usePreAssessmentStore((s) => s.countdownCompleted)
  const answers = usePreAssessmentStore((s) => s.answers)
  const currentQuestionIndex = usePreAssessmentStore(
    (s) => s.currentQuestionIndex,
  )
  const setCurrentQuestionIndex = usePreAssessmentStore(
    (s) => s.setCurrentQuestionIndex,
  )
  const setAssessmentStarted = usePreAssessmentStore(
    (s) => s.setAssessmentStarted,
  )
  const setCountdownCompleted = usePreAssessmentStore(
    (s) => s.setCountdownCompleted,
  )
  const setStartedAt = usePreAssessmentStore((s) => s.setStartedAt)
  const reset = usePreAssessmentStore((s) => s.reset)
  const resetSession = usePreAssessmentStore((s) => s.resetSession)

  const [countdown, setCountdown] = useState(COUNTDOWN_FROM)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetaking, setIsRetaking] = useState(false)
  const [isRetryingGeneration, setIsRetryingGeneration] = useState(false)
  const [autoSubmitMessage, setAutoSubmitMessage] = useState('')

  const submittingRef = useRef(false)

  // Runtime-only. Never persisted. True from countdown through answering.
  // This is the single source of truth for the navigation lock — not the persisted store.
  const assessmentActiveRef = useRef(false)

  const { lock, unlock } = useAssessmentLockStore()

  const questions = assessment?.questions ?? []
  // Real questions may not exist yet for a brand-new talent — the initial
  // response is a stub while generation runs server-side (fire-and-forget).
  const isReadyToStart = questions.length > 0 && !assessment?.generating
  const totalSeconds = questions.length * SECONDS_PER_QUESTION
  const isFirst = currentQuestionIndex === 0
  const isLast = currentQuestionIndex === questions.length - 1
  const allAnswered =
    questions.length > 0 && questions.every((q) => !!answers[q.questionId])

  // Sync the sidebar lock with the current assessment state.
  // Lock from countdown through answering; unlock on complete/error/loading/submit.
  // Also restores the lock after a refresh when the session was already in progress.
  useEffect(() => {
    const sessionInProgress =
      assessment?.status === 'pending' &&
      questions.length > 0 &&
      (isCountingDown || (assessmentStarted && countdownCompleted))

    const isActive =
      !isLoading && !fetchError && !isProfileIncomplete && sessionInProgress

    if (isActive && !assessmentActiveRef.current) {
      assessmentActiveRef.current = true
      if (shouldLockNavigation) lock()
    } else if (!isActive && assessmentActiveRef.current) {
      assessmentActiveRef.current = false
      if (shouldLockNavigation) unlock()
    }
  }, [
    isLoading,
    fetchError,
    isProfileIncomplete,
    assessment?.status,
    isCountingDown,
    assessmentStarted,
    countdownCompleted,
    questions.length,
    shouldLockNavigation,
    lock,
    unlock,
  ])

  // Safety: always release the lock when the page unmounts regardless of any other state.
  useEffect(() => {
    return () => {
      assessmentActiveRef.current = false
      unlock()
    }
  }, [unlock])

  useEffect(() => {
    if (!isCountingDown) return

    if (countdown <= 0) {
      setIsCountingDown(false)
      setStartedAt(Date.now())
      setCountdownCompleted(true)
      setAssessmentStarted(true)
      return
    }

    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [
    isCountingDown,
    countdown,
    setStartedAt,
    setCountdownCompleted,
    setAssessmentStarted,
  ])

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submittingRef.current) return
      // Allow submit while the session is locked OR while questions are on
      // screen (covers the brief window before the lock effect commits).
      const canSubmit =
        assessmentActiveRef.current ||
        (assessmentStarted && countdownCompleted && questions.length > 0)
      if (!canSubmit) return
      submittingRef.current = true
      setIsSubmitting(true)

      if (auto) {
        setAutoSubmitMessage('Time expired. Submitting assessment...')
      }

      try {
        const payloadAnswers = questions.map((q) => ({
          questionId: q.questionId,
          selectedOption: q.options.indexOf(answers[q.questionId] ?? ''),
        }))
        await submitAssessment({ answers: payloadAnswers })
        // Release immediately on success — do not wait for the sync effect.
        assessmentActiveRef.current = false
        if (shouldLockNavigation) unlock()
        setAssessmentStarted(false)
        setCountdownCompleted(false)
        setIsCountingDown(false)
        await refetch()
        resetSession()
      } catch (error) {
        notify(
          'error',
          getErrorMessage(
            error,
            'Failed to submit assessment. Please try again.',
          ),
          {
            autoClose: 4000,
          },
        )
        setAutoSubmitMessage('')
        // Transient error — assessment is still active, keep the lock.
      } finally {
        submittingRef.current = false
        setIsSubmitting(false)
      }
    },
    [
      answers,
      questions,
      refetch,
      resetSession,
      assessmentStarted,
      countdownCompleted,
      setAssessmentStarted,
      setCountdownCompleted,
      shouldLockNavigation,
      unlock,
    ],
  )

  const handleAutoSubmit = useCallback(() => {
    void handleSubmit(true)
  }, [handleSubmit])

  const remainingSeconds = useAssessmentTimer(
    totalSeconds,
    handleAutoSubmit,
    isSubmitting,
  )

  const handleRetryGeneration = async () => {
    setIsRetryingGeneration(true)
    try {
      await retryAssessmentGeneration()
      await refetch({ silent: true })
    } catch {
      notify(
        'error',
        'Failed to retry assessment generation. Please try again.',
        {
          autoClose: 2000,
        },
      )
    } finally {
      setIsRetryingGeneration(false)
    }
  }

  const handleRetake = async () => {
    setIsRetaking(true)
    try {
      await retakeAssessment()
      reset()
      await refetch()
    } catch (error) {
      notify(
        'error',
        getErrorMessage(error, 'Failed to start retake. Please try again.'),
        { autoClose: 4000 },
      )
    } finally {
      setIsRetaking(false)
    }
  }

  if (isLoading) return <Spinner fullPage />

  if (fetchError) {
    return (
      <div className={styles.centeredState}>
        <p className={styles.errorText}>{fetchError}</p>
      </div>
    )
  }

  if (isProfileIncomplete) {
    return (
      <div className={styles.resultWrapper}>
        <ResultCard variant="profileIncomplete" />
      </div>
    )
  }

  if (assessment?.status === 'completed') {
    return (
      <div className={styles.resultWrapper}>
        <ResultCard
          variant="completed"
          score={assessment.score ?? undefined}
          attemptsUsed={assessment.attemptCount}
          attemptsRemaining={assessment.maxAttempts - assessment.attemptCount}
          onRetake={() => void handleRetake()}
          isRetaking={isRetaking}
          onContinue={onContinue}
        />
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className={styles.centeredColumnState}>
        <Spinner />
        <p className={styles.mutedText}>
          {autoSubmitMessage || 'Submitting assessment...'}
        </p>
      </div>
    )
  }

  if (assessment?.generationFailed) {
    return (
      <div className={`${styles.centeredColumnState} ${styles.padded}`}>
        <p className={`${styles.mutedText} ${styles.centered}`}>
          We couldn&apos;t generate your assessment. Please try again.
        </p>
        <button
          type="button"
          onClick={() => void handleRetryGeneration()}
          disabled={isRetryingGeneration}
          className={styles.retryButton}>
          {isRetryingGeneration ? 'Retrying...' : 'Try again'}
        </button>
      </div>
    )
  }

  if (assessment?.status === 'pending' && !isReadyToStart) {
    return (
      <div className={styles.centeredColumnState}>
        <Spinner />
        <p className={styles.mutedText}>
          Generating your assessment questions...
        </p>
      </div>
    )
  }

  if (isCountingDown) {
    return (
      <div className={styles.countdownWrapper}>
        <p className={styles.countdownLabel}>
          You are about to start your assessment
        </p>
        <span className={styles.countdownNumber}>{countdown}</span>
      </div>
    )
  }

  if (assessment?.status === 'pending' && !assessmentStarted) {
    return (
      <div className={styles.countdownWrapper}>
        <p className={styles.countdownLabel}>Your assessment is ready</p>
        <ul className={styles.introList}>
          <li>
            <MdOutlineAssessment />
            {questions.length} multiple choice questions
          </li>
          <li>
            <MdAccessTime />
            {formatTime(totalSeconds)} to finish once you start
          </li>
          <li>
            <MdRefresh />
            Do not refresh or close the browser
          </li>
        </ul>
        <Button onClick={() => setIsCountingDown(true)}>
          Start assessment
        </Button>
      </div>
    )
  }

  if (assessmentStarted && questions.length > 0) {
    const progressPct = Math.round(
      ((currentQuestionIndex + 1) / questions.length) * 100,
    )

    return (
      <div className={styles.assessment}>
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <MdOutlineAssessment className={styles.headerIcon} />
            <h1 className={styles.headerTitle}>Pre-Assessment</h1>
          </div>
          <div className={styles.timerBadge}>
            <MdAccessTime className={styles.timerIcon} />
            <div>
              <p className={styles.timerLabel}>Time Remaining</p>
              <p className={styles.timerValue}>
                {formatTime(remainingSeconds)}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.progressSection}>
            <div className={styles.progressRow}>
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{progressPct}% Completed</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className={styles.columns}>
            <div className={styles.questionColumn}>
              <Questions questions={questions} />

              <div className={styles.navRow}>
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() =>
                    setCurrentQuestionIndex(currentQuestionIndex - 1)
                  }
                  className={`${styles.navButton} ${
                    isFirst ? styles.navButtonDisabled : ''
                  }`}>
                  ‹ Previous
                </button>

                {!isLast ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestionIndex(currentQuestionIndex + 1)
                    }
                    className={styles.primaryNavButton}>
                    Next ›
                  </button>
                ) : allAnswered ? (
                  <button
                    type="button"
                    onClick={() => void handleSubmit(false)}
                    disabled={isSubmitting}
                    className={styles.primaryNavButton}>
                    Submit Assessment
                  </button>
                ) : (
                  <span className={styles.answerAllNote}>
                    Answer all questions to submit
                  </span>
                )}
              </div>
            </div>

            <div className={styles.sidePanel}>
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <MdInfo className={styles.sideCardHeaderIcon} />
                  <h3 className={styles.sideCardTitle}>
                    Assessment Guidelines
                  </h3>
                </div>
                <ul className={styles.guidelineList}>
                  {[
                    {
                      icon: <MdOutlineAssessment />,
                      text: `${questions.length} multiple choice questions`,
                    },
                    {
                      icon: <MdAccessTime />,
                      text: '30 seconds per question (approx.)',
                    },
                    {
                      icon: <MdRefresh />,
                      text: 'Do not refresh or close the browser',
                    },
                    {
                      icon: <MdCheckCircle />,
                      text: 'Your progress is saved automatically',
                    },
                  ].map(({ icon, text }, i) => (
                    <li key={i} className={styles.guidelineItem}>
                      {icon}
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Question Navigator</h3>
                <div className={styles.navigatorGrid}>
                  {questions.map((q, i) => {
                    const isAnswered = !!answers[q.questionId]
                    const isCurrent = i === currentQuestionIndex
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(i)}
                        className={`${styles.navigatorButton} ${
                          isCurrent
                            ? styles.navigatorButtonCurrent
                            : isAnswered
                            ? styles.navigatorButtonAnswered
                            : ''
                        }`}>
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <div className={styles.legend}>
                  {[
                    {
                      cls: styles.legendSwatchAnswered,
                      label: 'Answered',
                    },
                    { cls: styles.legendSwatchCurrent, label: 'Current' },
                    { cls: styles.legendSwatchUnanswered, label: 'Unanswered' },
                  ].map(({ cls, label }) => (
                    <span key={label} className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${cls}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <Spinner fullPage />
}

export default PreAssessmentPage
