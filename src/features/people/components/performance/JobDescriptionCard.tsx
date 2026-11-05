import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'

import { usePerformanceChange } from '../../hooks/usePerformance'
import {
  saveJobDescription,
  writeJobDescription,
} from '../../services/peopleService'
import { ManagedPerformance } from '../../types'
import styles from './Performance.module.scss'

const MAX_LENGTH = 20_000

interface JobDescriptionCardProps {
  base: string
  performance: ManagedPerformance
  readOnly: boolean
  /** Given only to HR. A manager reads the job description but doesn't edit it. */
  hr?: { organizationId: string; staffId: string }
}

export const JobDescriptionCard: React.FC<JobDescriptionCardProps> = ({
  base,
  performance,
  readOnly,
  hr,
}) => {
  const { jobDescription } = performance
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const [draft, setDraft] = useState<string | null>(null)
  const canEdit = !!hr && !readOnly

  const writeWithAi = () =>
    hr &&
    run(
      'write',
      async () => {
        const written = await writeJobDescription(hr.organizationId, hr.staffId)
        setDraft(written.body)
      },
      'Could not write the job description. Please try again.',
    )

  const save = () =>
    hr &&
    draft !== null &&
    run(
      'save',
      async () => {
        const saved = await saveJobDescription(
          hr.organizationId,
          hr.staffId,
          draft,
          jobDescription?.version ?? null,
        )
        await updateCache((current) => ({ ...current, jobDescription: saved }))
        setDraft(null)
      },
      'Could not save the job description.',
    )

  return (
    <PagePanel title="Job description">
      {draft !== null ? (
        <div className={styles.form}>
          <label className={styles.field}>
            <span>Job description</span>
            <textarea
              rows={12}
              maxLength={MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <Button
              size="sm"
              loading={pending === 'save'}
              disabled={!draft.trim()}
              onClick={() => void save()}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.stack}>
          {jobDescription ? (
            <p className={styles.body}>{jobDescription.body}</p>
          ) : (
            <p className={styles.muted}>No job description yet.</p>
          )}
          {canEdit && (
            <div className={styles.actions}>
              {jobDescription && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDraft(jobDescription.body)}>
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                loading={pending === 'write'}
                onClick={() => void writeWithAi()}>
                Write with AI
              </Button>
            </div>
          )}
        </div>
      )}
    </PagePanel>
  )
}
