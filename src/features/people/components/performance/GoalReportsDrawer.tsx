import React, { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Pill, PillTone } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { useGoalReports } from '../../hooks/usePerformance'
import {
  downloadGoalReportFile,
  goalReportsKey,
  saveGoalReportNote,
} from '../../services/peopleService'
import {
  Goal,
  GoalReport,
  GoalReportPeriod,
  GoalReportsData,
  ReportFrequency,
} from '../../types'
import {
  frequencyWord,
  periodLabel,
  STATE_LABEL,
} from '../../utils/goalReports'
import { EvidenceList } from '../completion/EvidenceList'
import styles from './Performance.module.scss'
import { NoteForm } from './ReportsCard'

const STATE_TONE: Record<GoalReportPeriod['state'], PillTone> = {
  submitted: 'success',
  missed: 'danger',
  open: 'warning',
}

export const PeriodHead: React.FC<{
  frequency: ReportFrequency
  period: GoalReportPeriod
}> = ({ frequency, period }) => (
  <div className={styles.itemHead}>
    <strong>{periodLabel(frequency, period.periodStart)}</strong>
    <Pill tone={STATE_TONE[period.state]} size="sm">
      {STATE_LABEL[period.state]}
    </Pill>
  </div>
)

/** What the employee sent for one period, and the reply if there is one. */
export const GoalReportBody: React.FC<{
  report: GoalReport
  reportsKey: string
  showNote?: boolean
}> = ({ report, reportsKey, showNote = true }) => (
  <>
    {report.text && <p className={styles.preWrap}>{report.text}</p>}
    <EvidenceList
      request={report}
      onDownload={(file) => {
        downloadGoalReportFile(reportsKey, report.id, file).catch(
          (err: unknown) =>
            notify(
              'error',
              getErrorMessage(err, 'Could not download this file'),
            ),
        )
      }}
    />
    {showNote && report.reviewerNote && (
      <p className={styles.body}>
        <strong>Note from {report.reviewerNoteByName}:</strong>{' '}
        {report.reviewerNote}
      </p>
    )}
  </>
)

export const reportsSummary = (reports: GoalReportsData) =>
  `${reports.submitted} sent · ${reports.missed} missed`

/** A reviewer reads one goal's reports, period by period, and can reply to each. */
export const GoalReportsReview: React.FC<{
  base: string
  goal: Goal
  canNote: boolean
  onClose: () => void
}> = ({ base, goal, canNote, onClose }) => {
  const key = goalReportsKey(base, goal.id)
  const { reports, isLoading, hasError, mutate } = useGoalReports(key)
  const [savingId, setSavingId] = useState<string | null>(null)
  const frequency = reports?.frequency ?? goal.reportFrequency ?? 'weekly'

  const saveNote = async (report: GoalReport, note: string) => {
    setSavingId(report.id)
    try {
      const saved = await saveGoalReportNote(base, goal.id, report, note)
      await mutate(
        (current) =>
          current && {
            ...current,
            periods: current.periods.map((period) =>
              period.report?.id === saved.id
                ? { ...period, report: saved }
                : period,
            ),
          },
        { revalidate: false },
      )
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not save this note.'))
      await mutate()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${frequencyWord(frequency)} reports`}
      subtitle={
        reports ? `${goal.title} · ${reportsSummary(reports)}` : goal.title
      }>
      {isLoading ? (
        <Spinner />
      ) : hasError || !reports ? (
        <p className={styles.muted}>Couldn&apos;t load these reports.</p>
      ) : reports.periods.length === 0 ? (
        <p className={styles.muted}>No reports are due yet.</p>
      ) : (
        <ul className={styles.list}>
          {reports.periods.map((period) => (
            <li key={period.periodStart} className={styles.item}>
              <PeriodHead frequency={frequency} period={period} />
              {period.report && (
                <>
                  <GoalReportBody
                    report={period.report}
                    reportsKey={key}
                    showNote={!canNote}
                  />
                  {canNote && (
                    <NoteForm
                      key={`${period.report.id}-${period.report.noteVersion}`}
                      saved={period.report.reviewerNote}
                      isSaving={savingId === period.report.id}
                      onSave={(note) => saveNote(period.report!, note)}
                    />
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}

export const GoalReportsButton: React.FC<{
  base: string
  goal: Goal
  canNote: boolean
}> = ({ base, goal, canNote }) => {
  const [isOpen, setIsOpen] = useState(false)
  if (!goal.reportFrequency || goal.status !== 'approved') return null
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={() => setIsOpen(true)}>
        {frequencyWord(goal.reportFrequency)} reports
      </Button>
      {isOpen && (
        <GoalReportsReview
          base={base}
          goal={goal}
          canNote={canNote}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
