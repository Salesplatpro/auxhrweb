import React, { useMemo, useState } from 'react'

import { Alert } from '@/components/feedback/Alert'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import {
  usePerformanceChange,
  useQuarterlyReview,
} from '@/features/people/hooks/usePerformance'
import {
  quarterlyReviewKey,
  saveQuarterGoal,
} from '@/features/people/services/peopleService'
import {
  Capacity,
  QuarterlyReviewData,
  QuarterlyReviewPerson,
} from '@/features/people/types'
import { formatMoney } from '@/features/people/utils/formatMoney'
import {
  currentQuarter,
  nearbyQuarters,
} from '@/features/people/utils/quarters'

import styles from './QuarterlyReview.module.scss'

const CAPACITY_LABELS: Record<Capacity, string> = {
  not_enough_data: 'Not enough data',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
const CAPACITY_ORDER: Record<Capacity, number> = {
  not_enough_data: 0,
  low: 1,
  medium: 2,
  high: 3,
}
const CURRENCIES = ['NGN', 'USD']

type SortKey = 'fullName' | 'goalProgress' | 'score' | 'capacity'

const SORT_LABELS: Record<SortKey, string> = {
  fullName: 'Employee',
  goalProgress: 'Goal progress',
  score: 'Efficiency',
  capacity: 'Room for more work',
}

const sortValue = (person: QuarterlyReviewPerson, key: SortKey) =>
  key === 'capacity' ? CAPACITY_ORDER[person.capacity] : person[key]

/** People with no number stay at the bottom whichever way the column is sorted. */
export const sortPeople = (
  people: QuarterlyReviewPerson[],
  key: SortKey,
  ascending: boolean,
) =>
  [...people].sort((a, b) => {
    const left = sortValue(a, key)
    const right = sortValue(b, key)
    if (left === null) return right === null ? 0 : 1
    if (right === null) return -1
    const order =
      typeof left === 'string'
        ? left.localeCompare(String(right))
        : left - Number(right)
    return ascending ? order : -order
  })

const GoalForm: React.FC<{
  organizationId: string
  review: QuarterlyReviewData
}> = ({ organizationId, review }) => {
  const key = quarterlyReviewKey(organizationId, review.quarter)
  const { run, updateCache, pending } =
    usePerformanceChange<QuarterlyReviewData>(key)
  const [currency, setCurrency] = useState(review.goal?.currency ?? 'NGN')
  const [goal, setGoal] = useState(String(review.goal?.revenueGoal ?? ''))
  const [soFar, setSoFar] = useState(String(review.goal?.revenueSoFar ?? '0'))
  const revenueGoal = Number(goal)
  const revenueSoFar = Number(soFar)
  const isValid =
    goal !== '' &&
    Number.isFinite(revenueGoal) &&
    revenueGoal > 0 &&
    Number.isFinite(revenueSoFar) &&
    revenueSoFar >= 0

  const save = () =>
    run(
      'save',
      async () => {
        const saved = await saveQuarterGoal(organizationId, {
          quarter: review.quarter,
          currency,
          revenueGoal,
          revenueSoFar,
          version: review.goal?.version ?? null,
        })
        await updateCache((current) => ({
          ...current,
          goal: saved,
          revenuePercent: Math.round(
            (saved.revenueSoFar / saved.revenueGoal) * 100,
          ),
        }))
      },
      'Could not save the revenue goal.',
    )

  return (
    <div className={styles.goalForm}>
      <label className={styles.field}>
        <span>Currency</span>
        <select
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}>
          {CURRENCIES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>Revenue goal</span>
        <input
          type="number"
          min="0"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span>Revenue so far</span>
        <input
          type="number"
          min="0"
          value={soFar}
          onChange={(event) => setSoFar(event.target.value)}
        />
      </label>
      <Button
        loading={pending === 'save'}
        disabled={!isValid}
        onClick={() => void save()}>
        Save
      </Button>
    </div>
  )
}

export const QuarterlyReview = () => {
  const { organizationId } = usePeopleAccess()
  const [quarter, setQuarter] = useState(() => currentQuarter())
  const { review, isLoading, hasError } = useQuarterlyReview(
    organizationId,
    quarter,
  )
  const [sortKey, setSortKey] = useState<SortKey>('fullName')
  const [ascending, setAscending] = useState(true)

  const people = useMemo(
    () => sortPeople(review?.people ?? [], sortKey, ascending),
    [review, sortKey, ascending],
  )

  const sortBy = (key: SortKey) => {
    setAscending(key === sortKey ? !ascending : true)
    setSortKey(key)
  }

  const header = (key: SortKey) => (
    <th
      aria-sort={
        sortKey === key ? (ascending ? 'ascending' : 'descending') : 'none'
      }>
      <button type="button" onClick={() => sortBy(key)}>
        {SORT_LABELS[key]}
      </button>
    </th>
  )

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Quarterly review"
        lead="Compare revenue reached with each person's goal progress."
      />
      <label className={styles.field}>
        <span>Quarter</span>
        <select
          value={quarter}
          onChange={(event) => setQuarter(event.target.value)}>
          {nearbyQuarters(quarter).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      {isLoading ? (
        <Spinner />
      ) : hasError || !review || !organizationId ? (
        <EmptyState
          title="Couldn't load the quarterly review"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <>
          <PagePanel title="Revenue goal">
            <GoalForm
              key={`${review.quarter}-${review.goal?.version ?? 0}`}
              organizationId={organizationId}
              review={review}
            />
          </PagePanel>
          <StatGrid>
            <StatCard
              label="Revenue reached"
              value={
                review.revenuePercent === null
                  ? 'No goal set'
                  : `${review.revenuePercent}%`
              }
              caption={
                review.goal
                  ? `${formatMoney(
                      review.goal.currency,
                      review.goal.revenueSoFar,
                    )} of ${formatMoney(
                      review.goal.currency,
                      review.goal.revenueGoal,
                    )}`
                  : undefined
              }
            />
            <StatCard
              label="Team goal progress"
              value={
                review.teamProgress === null
                  ? 'No goals yet'
                  : `${review.teamProgress}%`
              }
              caption="Average across people with goals"
            />
          </StatGrid>
          {review.truncated && (
            <Alert variant="warning">
              Only the first 1,000 people are shown.
            </Alert>
          )}
          <PagePanel
            title="Team"
            hint="Room for more work is Directional: only a rough guide from the last 4 weeks.">
            {people.length === 0 ? (
              <p>No current staff yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {header('fullName')}
                      {header('goalProgress')}
                      {header('score')}
                      {header('capacity')}
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((person) => (
                      <tr key={person.staffId}>
                        <td>
                          <strong>{person.fullName}</strong>
                          <span className={styles.muted}>
                            {person.jobTitle}
                          </span>
                        </td>
                        <td>
                          {person.goalProgress === null
                            ? 'No goals'
                            : `${person.goalProgress}%`}
                        </td>
                        <td>
                          {person.score ?? 'Not enough data'}
                          {person.score !== null && person.partial && (
                            <span className={styles.muted}>Partial</span>
                          )}
                        </td>
                        <td>{CAPACITY_LABELS[person.capacity]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PagePanel>
        </>
      )}
    </PageShell>
  )
}
