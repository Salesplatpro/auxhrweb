import React, { useState } from 'react'

import { ShareGrant } from '../types'
import { formatDateOnly, todayDateOnly } from '../utils/formatDate'
import { formatCount } from '../utils/formatMoney'
import { nextVest, vestedSharesOn, vestingDates } from '../utils/vesting'
import styles from './VestingTimeline.module.scss'

interface VestingTimelineProps {
  grant: ShareGrant
  ownerFirstName: string
  /** Written to the employee themselves ("yours") instead of about them. */
  mine?: boolean
}

const DAY_MS = 86_400_000

const dayNumber = (dateOnly: string) => Date.parse(`${dateOnly}T00:00:00Z`)

const positionPercent = (from: string, to: string, at: string) => {
  const span = dayNumber(to) - dayNumber(from)
  if (span <= 0) return 100
  const ratio = (dayNumber(at) - dayNumber(from)) / span
  return Math.min(100, Math.max(0, ratio * 100))
}

const timeUntil = (from: string, to: string) => {
  const days = Math.max(
    0,
    Math.round((dayNumber(to) - dayNumber(from)) / DAY_MS),
  )
  if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'}`
  const weeks = Math.round(days / 7)
  return `${weeks} weeks`
}

export const VestingTimeline: React.FC<VestingTimelineProps> = ({
  grant,
  ownerFirstName,
  mine = false,
}) => {
  const today = todayDateOnly()
  const [checkedDate, setCheckedDate] = useState(today)
  const { cliffDate, fullyVestedDate } = vestingDates(grant)
  const ownedToday = vestedSharesOn(grant, today)
  const next = nextVest(grant, today)
  const ownedOnCheckedDate = checkedDate
    ? vestedSharesOn(grant, checkedDate)
    : null
  const todayPosition = positionPercent(grant.grantedOn, fullyVestedDate, today)
  const cliffPosition = positionPercent(
    grant.grantedOn,
    fullyVestedDate,
    cliffDate,
  )
  const owner = mine ? 'yours' : `${ownerFirstName}'s`
  const beforeCliff = ownedToday === 0 && grant.cliffMonths > 0 && !!next

  const headline = beforeCliff
    ? `No shares are ${owner} yet. ${formatCount(
        next!.shares,
      )} become ${owner} at the cliff on ${formatDateOnly(cliffDate)}.`
    : `${formatCount(ownedToday)} of ${formatCount(
        grant.shares,
      )} shares are now ${owner}.`

  const note = !next
    ? null
    : beforeCliff
    ? `Cliff in ${timeUntil(today, cliffDate)}`
    : `Next ${formatCount(next.shares)} shares on ${formatDateOnly(next.date)}`

  return (
    <div className={styles.timeline}>
      <div className={styles.head}>
        <p className={styles.summary}>{headline}</p>
        {note && <p className={styles.note}>{note}</p>}
      </div>
      <div
        className={styles.track}
        role="img"
        aria-label={`${Math.round(
          todayPosition,
        )}% of the vesting period has passed`}>
        <div
          className={styles.fill}
          style={{ width: `${(ownedToday / grant.shares) * 100}%` }}
        />
        {grant.cliffMonths > 0 && (
          <span className={styles.cliff} style={{ left: `${cliffPosition}%` }}>
            <span className={styles.cliffLabel}>
              Cliff · {formatDateOnly(cliffDate)}
            </span>
          </span>
        )}
        <span className={styles.today} style={{ left: `${todayPosition}%` }}>
          <span className={styles.todayLabel}>Today</span>
        </span>
      </div>
      <div className={styles.ends}>
        <span>
          {formatDateOnly(grant.grantedOn)}
          <span className={styles.muted}> · Granted</span>
        </span>
        <span>
          {formatDateOnly(fullyVestedDate)}
          <span className={styles.muted}>
            {' '}
            · All {formatCount(grant.shares)} owned
          </span>
        </span>
      </div>
      <label className={styles.check}>
        <span>Shares owned on</span>
        <input
          type="date"
          value={checkedDate}
          min={grant.grantedOn}
          onChange={(event) => setCheckedDate(event.target.value)}
        />
        {ownedOnCheckedDate !== null && (
          <strong>{formatCount(ownedOnCheckedDate)}</strong>
        )}
      </label>
    </div>
  )
}
