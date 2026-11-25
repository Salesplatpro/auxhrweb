import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import salesplarLogo from '@/assets/Salesplat.png'

import styles from './ResultCard.module.scss'

interface ResultCardProps {
  variant: 'profileIncomplete' | 'completed'
  score?: number
  attemptsUsed?: number
  attemptsRemaining?: number
  onRetake?: () => void
  isRetaking?: boolean
  onContinue?: () => void
}

const ResultCard: React.FC<ResultCardProps> = ({
  variant,
  score,
  attemptsUsed,
  attemptsRemaining,
  onRetake,
  isRetaking,
  onContinue,
}) => {
  const navigate = useNavigate()
  const { jobId } = useParams<{ jobId: string }>()
  const location = useLocation()
  const isApplyWizard = location.pathname.includes('/apply/')

  if (variant === 'profileIncomplete') {
    const profilePath =
      isApplyWizard && jobId
        ? `/apply/${jobId}/profile`
        : '/talentDashboard/talentProfile'
    return (
      <div className={styles.incompleteCard}>
        <h2 className={styles.incompleteTitle}>
          Add your CV and roles to get your pre-assessment.
        </h2>
        <p className={styles.incompleteBody}>
          Your questions are written from your CV and the roles you picked, and
          they&apos;re ready as soon as both are saved.
        </p>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className={`${styles.button} ${styles.primaryButton}`}>
          Add CV and roles
        </button>
      </div>
    )
  }

  const hasAttemptsRemaining =
    typeof attemptsRemaining === 'number' && attemptsRemaining > 0

  return (
    <div className={styles.card}>
      <img src={salesplarLogo} alt="Salesplat" className={styles.logo} />

      <div className={styles.content}>
        <span className={styles.emoji}>🎉</span>
        <h2 className={styles.title}>Assessment Completed</h2>

        <div className={styles.stats}>
          {typeof score === 'number' && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>{score}%</span>
            </div>
          )}
          {typeof attemptsUsed === 'number' && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Attempts used</span>
              <span className={styles.statValue}>{attemptsUsed}</span>
            </div>
          )}
          {typeof attemptsRemaining === 'number' && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Attempts remaining</span>
              <span className={styles.statValue}>{attemptsRemaining}</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className={`${styles.button} ${styles.primaryButton}`}>
              Continue
            </button>
          )}
          {hasAttemptsRemaining ? (
            <button
              type="button"
              onClick={onRetake}
              disabled={isRetaking}
              className={`${styles.button} ${
                onContinue ? styles.secondaryButton : styles.primaryButton
              }`}>
              {isRetaking ? 'Starting...' : 'Retake Assessment'}
            </button>
          ) : (
            !onContinue && (
              <p className={styles.exhausted}>
                You have used all available assessment attempts for your current
                role selection.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultCard
