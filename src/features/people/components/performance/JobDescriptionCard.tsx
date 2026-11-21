import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'

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

type Draft = { text: string; fromAi: boolean; editing: boolean }

export const JobDescriptionCard: React.FC<JobDescriptionCardProps> = ({
  base,
  performance,
  readOnly,
  hr,
}) => {
  const { jobDescription } = performance
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const [draft, setDraft] = useState<Draft | null>(null)
  const canEdit = !!hr && !readOnly

  const writeWithAi = () =>
    hr &&
    run(
      'write',
      async () => {
        const written = await writeJobDescription(hr.organizationId, hr.staffId)
        setDraft({ text: written.body, fromAi: true, editing: false })
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
          draft.text,
          jobDescription?.version ?? null,
        )
        await updateCache((current) => ({ ...current, jobDescription: saved }))
        setDraft(null)
      },
      'Could not save the job description.',
    )

  return (
    <PagePanel
      title="Job description"
      hint={
        !jobDescription && !draft
          ? 'What this person is hired to do. We use it to suggest goals.'
          : undefined
      }
      action={
        draft?.fromAi && (
          <Pill tone="warning" size="sm">
            Written by AI
          </Pill>
        )
      }>
      {draft !== null ? (
        <div className={styles.form}>
          {draft.editing ? (
            <label className={styles.field}>
              <span>Job description</span>
              <textarea
                rows={12}
                maxLength={MAX_LENGTH}
                value={draft.text}
                onChange={(event) =>
                  setDraft({ ...draft, text: event.target.value })
                }
              />
            </label>
          ) : (
            <p className={styles.body}>{draft.text}</p>
          )}
          <div className={styles.actions}>
            {!draft.editing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDraft({ ...draft, editing: true })}>
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="ink"
              pill
              loading={pending === 'save'}
              disabled={!draft.text.trim()}
              onClick={() => void save()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
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
              {jobDescription ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      text: jobDescription.body,
                      fromAi: false,
                      editing: true,
                    })
                  }>
                  Edit
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ink"
                pill
                loading={pending === 'write'}
                onClick={() => void writeWithAi()}>
                Write with AI
              </Button>
              {!jobDescription && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({ text: '', fromAi: false, editing: true })
                  }>
                  Write it myself
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </PagePanel>
  )
}
