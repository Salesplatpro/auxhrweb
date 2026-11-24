import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { Button } from '@/components/ui/Button'

import { usePerformanceChange } from '../../hooks/usePerformance'
import { fetchReports, saveReportNote } from '../../services/peopleService'
import { ManagedPerformance, WeeklyReport } from '../../types'
import { formatDateOnly } from '../../utils/formatDate'
import styles from './Performance.module.scss'

const MAX_NOTE = 2000

export const ReportAdvice: React.FC<{ advice: string[] }> = ({ advice }) => (
  <div>
    <span className={styles.pill}>AI suggestion</span>
    <ul className={styles.tips}>
      {advice.map((tip, index) => (
        <li key={index}>{tip}</li>
      ))}
    </ul>
  </div>
)

export const ReportBody: React.FC<{ report: WeeklyReport }> = ({ report }) => (
  <>
    <p className={styles.body}>
      <strong>What I did:</strong> {report.did}
    </p>
    {report.blocked && (
      <p className={styles.body}>
        <strong>What blocked me:</strong> {report.blocked}
      </p>
    )}
    {report.nextWeek && (
      <p className={styles.body}>
        <strong>Next week:</strong> {report.nextWeek}
      </p>
    )}
    {report.managerNote && (
      <p className={styles.body}>
        <strong>Note from {report.managerNoteByName}:</strong>{' '}
        {report.managerNote}
      </p>
    )}
    {report.advice && <ReportAdvice advice={report.advice} />}
  </>
)

export const NoteForm: React.FC<{
  saved: string | null
  isSaving: boolean
  onSave: (note: string) => Promise<void>
}> = ({ saved, isSaving, onSave }) => {
  const [note, setNote] = useState(saved ?? '')
  return (
    <div className={styles.form}>
      <label className={styles.field}>
        <span>Your note</span>
        <textarea
          rows={2}
          maxLength={MAX_NOTE}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <Button
          size="sm"
          variant="outline"
          loading={isSaving}
          disabled={!note.trim() || note.trim() === saved}
          onClick={() => void onSave(note.trim())}>
          Save note
        </Button>
      </div>
    </div>
  )
}

interface ReportsCardProps {
  base: string
  performance: ManagedPerformance
  readOnly: boolean
}

export const ReportsCard: React.FC<ReportsCardProps> = ({
  base,
  performance,
  readOnly,
}) => {
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const { items, total } = performance.reports

  const saveNote = async (report: WeeklyReport, note: string) => {
    await run(
      report.id,
      async () => {
        const saved = await saveReportNote(
          base,
          report.id,
          note,
          report.textVersion,
          report.noteVersion,
        )
        await updateCache((current) => ({
          ...current,
          reports: {
            ...current.reports,
            items: current.reports.items.map((item) =>
              item.id === saved.id ? saved : item,
            ),
          },
        }))
      },
      'Could not save this note.',
    )
  }

  const loadMore = () =>
    run(
      'more',
      async () => {
        const page = await fetchReports(base, items.length)
        await updateCache((current) => ({
          ...current,
          reports: {
            total: page.total,
            items: [...current.reports.items, ...page.items],
          },
        }))
      },
      'Could not load more reports.',
    )

  const weeks = performance.weeks ?? []
  const [openWeek, setOpenWeek] = useState<string | null>(null)

  if (weeks.length > 0) {
    return (
      <PagePanel
        title="Weekly reports"
        hint="Every report this person sends, newest first.">
        <ul className={styles.list}>
          {weeks.map(({ weekStart, state, report }) => (
            <li key={weekStart} className={styles.item}>
              <div className={styles.itemHead}>
                <strong>Week of {formatDateOnly(weekStart)}</strong>
                <StatusBadge
                  status={state === 'submitted' ? 'Submitted' : 'Not yet'}
                  backgroundColor={
                    state === 'submitted'
                      ? 'var(--color-positive-tint)'
                      : 'var(--color-bg-subtle)'
                  }
                  color={
                    state === 'submitted'
                      ? 'var(--color-positive)'
                      : 'var(--color-text-muted)'
                  }
                  showDot
                />
              </div>
              {report ? (
                <>
                  <p className={styles.muted}>
                    {report.did.length > 90
                      ? `${report.did.slice(0, 90)}…`
                      : report.did}
                  </p>
                  <div className={styles.itemHead}>
                    <span className={styles.muted}>
                      {report.managerNote
                        ? `${
                            report.managerNoteByName ?? 'A manager'
                          } added a note`
                        : 'No note'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setOpenWeek(openWeek === weekStart ? null : weekStart)
                      }>
                      {openWeek === weekStart ? 'Close' : 'Open'}
                    </Button>
                  </div>
                  {openWeek === weekStart && (
                    <>
                      <ReportBody report={report} />
                      {!readOnly && (
                        <NoteForm
                          key={`${report.id}-${report.noteVersion}`}
                          saved={report.managerNote}
                          isSaving={pending === report.id}
                          onSave={(note) => saveNote(report, note)}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className={styles.muted}>Not sent</p>
              )}
            </li>
          ))}
        </ul>
      </PagePanel>
    )
  }

  return (
    <PagePanel title="Weekly reports">
      {items.length === 0 ? (
        <p className={styles.muted}>No reports yet.</p>
      ) : (
        <div className={styles.stack}>
          <ul className={styles.list}>
            {items.map((report) => (
              <li key={report.id} className={styles.item}>
                <strong>Week of {formatDateOnly(report.weekStart)}</strong>
                <ReportBody report={report} />
                {!readOnly && (
                  <NoteForm
                    key={`${report.id}-${report.noteVersion}`}
                    saved={report.managerNote}
                    isSaving={pending === report.id}
                    onSave={(note) => saveNote(report, note)}
                  />
                )}
              </li>
            ))}
          </ul>
          {items.length < total && (
            <div className={styles.actions}>
              <Button
                size="sm"
                variant="outline"
                loading={pending === 'more'}
                onClick={() => void loadMore()}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </PagePanel>
  )
}
