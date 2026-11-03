import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'

import { usePerformanceChange } from '../../hooks/usePerformance'
import { saveFeedback } from '../../services/peopleService'
import { ManagedPerformance } from '../../types'
import styles from './Performance.module.scss'
import { RatingTrendChart } from './RatingTrendChart'

const MAX_NOTES = 2000
const RATINGS = [1, 2, 3, 4, 5]

interface FeedbackCardProps {
  base: string
  performance: ManagedPerformance
  readOnly: boolean
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  base,
  performance,
  readOnly,
}) => {
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const { feedback } = performance
  const [month, setMonth] = useState('')
  const [rating, setRating] = useState('')
  const [notes, setNotes] = useState('')
  const existing = feedback.find((row) => row.month === month)

  const chooseMonth = (next: string) => {
    setMonth(next)
    const saved = feedback.find((row) => row.month === next)
    setRating(saved ? String(saved.rating) : '')
    setNotes(saved?.notes ?? '')
  }

  const save = () =>
    run(
      'save',
      async () => {
        const saved = await saveFeedback(base, month, {
          rating: Number(rating),
          notes: notes.trim(),
          version: existing?.version ?? null,
        })
        await updateCache((current) => ({
          ...current,
          feedback: [
            ...current.feedback.filter((row) => row.month !== saved.month),
            saved,
          ].sort((a, b) => a.month.localeCompare(b.month)),
        }))
      },
      'Could not save this feedback.',
    )

  return (
    <PagePanel title="Monthly feedback">
      <div className={styles.stack}>
        {feedback.length === 0 ? (
          <p className={styles.muted}>No ratings yet.</p>
        ) : (
          <RatingTrendChart feedback={feedback} />
        )}
        {!readOnly && (
          <div className={styles.form}>
            <label className={styles.field}>
              <span>Month</span>
              <input
                type="month"
                value={month}
                onChange={(event) => chooseMonth(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Rating from 1 to 5</span>
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}>
                <option value="">Choose a rating</option>
                {RATINGS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Notes</span>
              <textarea
                rows={3}
                maxLength={MAX_NOTES}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <div className={styles.actions}>
              <Button
                size="sm"
                loading={pending === 'save'}
                disabled={!month || !rating}
                onClick={() => void save()}>
                {existing ? 'Update feedback' : 'Save feedback'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PagePanel>
  )
}
