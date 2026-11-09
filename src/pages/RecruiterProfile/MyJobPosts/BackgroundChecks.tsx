import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  type OverallTone,
  CHECK_TYPE_LABELS,
  checkRows,
  checkStatusLabel,
  consentView,
  orderBlockReason,
  overallView,
} from '@/features/checks/checkRules'
import { orderApplicationCheck } from '@/features/checks/checkService'
import type { CheckStatus, CheckType } from '@/features/checks/types'
import { useBackgroundChecks } from '@/features/checks/useBackgroundChecks'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './BackgroundChecks.module.scss'

const TONE_STYLES: Record<
  OverallTone,
  { backgroundColor: string; color: string }
> = {
  success: {
    backgroundColor: 'var(--color-success-tint)',
    color: 'var(--color-success)',
  },
  warning: {
    backgroundColor: 'var(--color-warning-tint)',
    color: 'var(--color-warning)',
  },
  danger: {
    backgroundColor: 'var(--color-danger-tint)',
    color: 'var(--color-danger)',
  },
  neutral: { backgroundColor: '#f3f4f6', color: 'var(--color-text-muted)' },
}

const CHECK_STATUS_TONES: Record<CheckStatus | 'none', OverallTone> = {
  passed: 'success',
  flagged: 'warning',
  failed: 'danger',
  pending: 'neutral',
  none: 'neutral',
}

type BackgroundChecksProps = {
  applicationId: string
  readOnly?: boolean
}

export const BackgroundChecks = ({
  applicationId,
  readOnly = false,
}: BackgroundChecksProps) => {
  const { consent, checks, error, mutateChecks } =
    useBackgroundChecks(applicationId)
  const [orderingType, setOrderingType] = useState<CheckType | null>(null)

  const handleOrder = async (type: CheckType) => {
    setOrderingType(type)
    try {
      await orderApplicationCheck(applicationId, type)
      await mutateChecks()
      notify('success', `${CHECK_TYPE_LABELS[type]} check ordered`, {
        autoClose: 2000,
      })
    } catch (err) {
      notify('error', getErrorMessage(err, "Couldn't order that check"), {
        autoClose: 3000,
      })
    } finally {
      setOrderingType(null)
    }
  }

  const renderBody = () => {
    if (error) {
      return (
        <p className={styles.empty}>
          Background checks couldn&apos;t load. Try again in a moment.
        </p>
      )
    }
    if (!consent || !checks) {
      return <Spinner size="sm" />
    }

    const agreement = consentView(consent)
    const overall = overallView(checks.overallStatus)
    const blockReason = orderBlockReason(consent)

    return (
      <>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Candidate consent</span>
            <StatusBadge
              status={agreement.label}
              {...TONE_STYLES[agreement.given ? 'success' : 'neutral']}
            />
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Overall</span>
            <StatusBadge
              status={overall.label}
              {...TONE_STYLES[overall.tone]}
            />
          </div>
        </div>
        <ul className={styles.list}>
          {checkRows(checks.checks).map((row) => {
            const status = row.check?.status ?? null
            return (
              <li key={row.type} className={styles.row}>
                <span className={styles.rowLabel}>{row.label}</span>
                <div className={styles.rowStatus}>
                  <StatusBadge
                    status={checkStatusLabel(status)}
                    {...TONE_STYLES[CHECK_STATUS_TONES[status ?? 'none']]}
                  />
                  {readOnly ? null : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={blockReason !== null}
                      loading={orderingType === row.type}
                      onClick={() => handleOrder(row.type)}>
                      Order check
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {readOnly || !blockReason ? null : (
          <p className={styles.reason}>{blockReason}</p>
        )}
      </>
    )
  }

  return (
    <PagePanel
      title="Background checks"
      hint="Identity, employment, education and criminal checks. The candidate agrees first; nothing is ordered before that.">
      {renderBody()}
    </PagePanel>
  )
}
