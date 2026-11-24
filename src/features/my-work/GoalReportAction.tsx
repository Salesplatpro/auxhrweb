import React, { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Spinner } from '@/components/ui/Spinner'
import {
  GoalReportBody,
  PeriodHead,
  reportsSummary,
} from '@/features/people/components/performance/GoalReportsDrawer'
import { useGoalReports } from '@/features/people/hooks/usePerformance'
import {
  myGoalReportsKey,
  submitGoalReport,
} from '@/features/people/services/peopleService'
import {
  Goal,
  GoalReport,
  GoalReportPeriod,
  ReportFrequency,
} from '@/features/people/types'
import { frequencyWord, periodLabel } from '@/features/people/utils/goalReports'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './MyWork.module.scss'

const MAX_TEXT = 4000
const MAX_FILES = 3
const MAX_LINKS = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,.docx'

const splitLinks = (text: string) =>
  text
    .split('\n')
    .map((link) => link.trim())
    .filter(Boolean)

/** Why a report can't be sent yet, or null. The server checks the same rules. */
export const goalReportProblem = (
  text: string,
  links: string[],
  keptFiles: number,
  newFiles: File[],
): string | null => {
  if (!text.trim() && links.length === 0 && keptFiles + newFiles.length === 0) {
    return 'Write something, add a link or attach a file.'
  }
  if (keptFiles + newFiles.length > MAX_FILES) {
    return `A report can have at most ${MAX_FILES} files.`
  }
  if (newFiles.some((file) => file.size > MAX_FILE_BYTES)) {
    return 'Each file must be 10 MB or smaller.'
  }
  if (links.length > MAX_LINKS) return `Add at most ${MAX_LINKS} links.`
  if (links.some((link) => !link.startsWith('https://'))) {
    return 'Links must start with https://'
  }
  return null
}

const ReportForm: React.FC<{
  staffId: string
  goalId: string
  frequency: ReportFrequency
  period: GoalReportPeriod
  onSent: (report: GoalReport) => void
}> = ({ staffId, goalId, frequency, period, onSent }) => {
  const existing = period.report
  const [text, setText] = useState(existing?.text ?? '')
  const [linksText, setLinksText] = useState(existing?.links.join('\n') ?? '')
  const [keepIds, setKeepIds] = useState<string[]>(
    existing?.files.map((file) => file.id) ?? [],
  )
  const [files, setFiles] = useState<File[]>([])
  const [problem, setProblem] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const send = async () => {
    const links = splitLinks(linksText)
    const found = goalReportProblem(text, links, keepIds.length, files)
    setProblem(found)
    if (found) return

    const form = new FormData()
    if (text.trim()) form.append('text', text.trim())
    links.forEach((link) => form.append('links', link))
    keepIds.forEach((id) => form.append('keepFileIds', id))
    files.forEach((file) => form.append('files', file))

    setIsSending(true)
    try {
      onSent(await submitGoalReport(staffId, goalId, period.periodStart, form))
      notify('success', 'Report sent')
      setFiles([])
    } catch (err) {
      setProblem(getErrorMessage(err, 'Could not send this. Please try again.'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className={styles.completionForm}>
      <label className={styles.completionField}>
        <span>
          What did you do for {periodLabel(frequency, period.periodStart)}?
        </span>
        <textarea
          rows={4}
          maxLength={MAX_TEXT}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      {existing && existing.files.length > 0 && (
        <div className={styles.completionField}>
          <span>Files already sent</span>
          {existing.files.map((file) => (
            <label key={file.id}>
              <input
                type="checkbox"
                checked={keepIds.includes(file.id)}
                onChange={(event) =>
                  setKeepIds((ids) =>
                    event.target.checked
                      ? [...ids, file.id]
                      : ids.filter((id) => id !== file.id),
                  )
                }
              />{' '}
              Keep {file.name}
            </label>
          ))}
        </div>
      )}
      <label className={styles.completionField}>
        <span>Files (PDF, JPG, PNG or Word, up to {MAX_FILES})</span>
        <input
          type="file"
          multiple
          accept={ACCEPTED_FILES}
          onChange={(event) => setFiles([...(event.target.files ?? [])])}
        />
      </label>
      <label className={styles.completionField}>
        <span>Links, one per line (up to {MAX_LINKS})</span>
        <textarea
          rows={2}
          placeholder="https://"
          value={linksText}
          onChange={(event) => setLinksText(event.target.value)}
        />
      </label>
      {problem && (
        <p className={styles.completionProblem} role="alert">
          {problem}
        </p>
      )}
      <div>
        <Button
          type="button"
          size="sm"
          loading={isSending}
          onClick={() => void send()}>
          {existing ? 'Send changes' : 'Send report'}
        </Button>
      </div>
    </div>
  )
}

/** The employee's reports on one goal: send the open period's report and read past ones. */
export const GoalReportAction: React.FC<{ staffId: string; goal: Goal }> = ({
  staffId,
  goal,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const key = myGoalReportsKey(staffId, goal.id)
  const { reports, isLoading, hasError, mutate } = useGoalReports(
    isOpen ? key : null,
  )
  if (!goal.reportFrequency) return null
  const frequency = goal.reportFrequency

  const replace = (report: GoalReport) =>
    mutate(
      (current) =>
        current && {
          ...current,
          submitted: current.periods.some(
            (period) =>
              period.periodStart === report.periodStart && period.report,
          )
            ? current.submitted
            : current.submitted + 1,
          periods: current.periods.map((period) =>
            period.periodStart === report.periodStart
              ? { ...period, state: 'submitted' as const, report }
              : period,
          ),
        },
      { revalidate: false },
    )

  return (
    <>
      <Button
        size="sm"
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}>
        {frequencyWord(frequency)} reports
      </Button>
      {isOpen && (
        <Drawer
          open
          onClose={() => setIsOpen(false)}
          title={`${frequencyWord(frequency)} reports`}
          subtitle={
            reports ? `${goal.title} · ${reportsSummary(reports)}` : goal.title
          }>
          {isLoading ? (
            <Spinner />
          ) : hasError || !reports ? (
            <p className={styles.muted}>Couldn&apos;t load your reports.</p>
          ) : reports.periods.length === 0 ? (
            <p className={styles.muted}>No report is due yet.</p>
          ) : (
            <ul className={styles.reportList}>
              {reports.periods.map((period) => {
                const editable = period.open && !period.report?.reviewerNote
                return (
                  <li key={period.periodStart}>
                    <PeriodHead frequency={frequency} period={period} />
                    {period.report && (
                      <GoalReportBody report={period.report} reportsKey={key} />
                    )}
                    {editable && (
                      <ReportForm
                        key={`${period.periodStart}-${
                          period.report?.textVersion ?? 0
                        }`}
                        staffId={staffId}
                        goalId={goal.id}
                        frequency={frequency}
                        period={period}
                        onSent={(report) => void replace(report)}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Drawer>
      )}
    </>
  )
}
