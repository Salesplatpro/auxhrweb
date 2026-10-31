import React, { useState } from 'react'

import { ShareGrant } from '../types'
import { formatDateOnly, todayDateOnly } from '../utils/formatDate'
import { formatCount, formatMoney } from '../utils/formatMoney'
import { vestedSharesOn, vestingDates } from '../utils/vesting'
import styles from './VestingTimeline.module.scss'

interface VestingTimelineProps {
  grant: ShareGrant
  ownerFirstName: string
}

const dayNumber = (dateOnly: string) => Date.parse(`${dateOnly}T00:00:00Z`)

const positionPercent = (from: string, to: string, at: string) => {
  const span = dayNumber(to) - dayNumber(from)
  if (span <= 0) return 100
  const ratio = (dayNumber(at) - dayNumber(from)) / span
  return Math.min(100, Math.max(0, ratio * 100))
}

export const VestingTimeline: React.FC<VestingTimelineProps> = ({
  grant,
  ownerFirstName,
}) => {
  const today = todayDateOnly()
  const [checkedDate, setCheckedDate] = useState(today)
  const { cliffDate, fullyVestedDate } = vestingDates(grant)
  const ownedToday = vestedSharesOn(grant, today)
  const ownedOnCheckedDate = checkedDate
    ? vestedSharesOn(grant, checkedDate)
    : null
  const todayPosition = positionPercent(grant.grantedOn, fullyVestedDate, today)

  return (
    <div className={styles.timeline}>
      <p className={styles.summary}>
        <strong>
          {formatCount(ownedToday)} of {formatCount(grant.shares)}
        </strong>{' '}
        shares are now {ownerFirstName}&apos;s.
      </p>
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
          <span
            className={styles.cliff}
            style={{
              left: `${positionPercent(
                grant.grantedOn,
                fullyVestedDate,
                cliffDate,
              )}%`,
            }}
          />
        )}
        <span className={styles.today} style={{ left: `${todayPosition}%` }}>
          <span className={styles.todayLabel}>Today</span>
        </span>
      </div>
      <dl className={styles.dates}>
        <div>
          <dt>Granted</dt>
          <dd>{formatDateOnly(grant.grantedOn)}</dd>
        </div>
        {grant.cliffMonths > 0 && (
          <div>
            <dt>Cliff</dt>
            <dd>{formatDateOnly(cliffDate)}</dd>
          </div>
        )}
        <div>
          <dt>All owned</dt>
          <dd>{formatDateOnly(fullyVestedDate)}</dd>
        </div>
        <div>
          <dt>Strike price</dt>
          <dd>{formatMoney(grant.currency, grant.strikePrice)}</dd>
        </div>
      </dl>
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
