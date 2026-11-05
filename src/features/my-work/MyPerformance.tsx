import { Form } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { RatingTrendChart } from '@/features/people/components/performance/RatingTrendChart'
import {
  ReportAdvice,
  ReportBody,
} from '@/features/people/components/performance/ReportsCard'
import { TextAreaField } from '@/features/people/components/performance/TextAreaField'
import {
  useMyPerformance,
  usePerformanceChange,
} from '@/features/people/hooks/usePerformance'
import {
  fetchMyReports,
  myPerformanceKey,
  requestMyAdvice,
  setMyDevelopmentDone,
  setMyGoalProgress,
  submitMyReport,
} from '@/features/people/services/peopleService'
import {
  CompletionRequest,
  Goal,
  MyPerformance as MyPerformanceData,
  WeeklyReport,
} from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'

import { CompletionAction } from './CompletionAction'
import styles from './MyWork.module.scss'

const MAX_FIELD = 5000

const reportSchema = Yup.object({
  did: Yup.string()
    .trim()
    .required('Write what you did')
    .max(MAX_FIELD, `Keep it under ${MAX_FIELD} characters`),
  blocked: Yup.string()
    .trim()
    .max(MAX_FIELD, `Keep it under ${MAX_FIELD} characters`),
  nextWeek: Yup.string()
    .trim()
    .max(MAX_FIELD, `Keep it under ${MAX_FIELD} characters`),
})

const withReport = (
  current: MyPerformanceData,
  report: WeeklyReport,
): MyPerformanceData => {
  const exists = current.reports.items.some((item) => item.id === report.id)
  return {
    ...current,
    reports: {
      total: current.reports.total + (exists ? 0 : 1),
      items: exists
        ? current.reports.items.map((item) =>
            item.id === report.id ? report : item,
          )
        : [report, ...current.reports.items],
    },
  }
}

const MAX_OWN_PROGRESS = 99

const GoalRow: React.FC<{
  goal: Goal
  staffId: string
  request: CompletionRequest | undefined
  isSaving: boolean
  onSave: (progress: number) => void
  onRequestChanged: (request: CompletionRequest | null) => void
}> = ({ goal, staffId, request, isSaving, onSave, onRequestChanged }) => {
  const [value, setValue] = useState(String(goal.progress))
  const parsed = Number(value)
  const isValid =
    value !== '' &&
    Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed <= MAX_OWN_PROGRESS
  const isComplete = !!goal.completedAt
  return (
    <li>
      <span className={styles.goalText}>
        <strong>{goal.title}</strong>
        <span className={styles.muted}>Due {formatDateOnly(goal.dueOn)}</span>
        <span
          className={styles.bar}
          role="progressbar"
          aria-valuenow={goal.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress on ${goal.title}`}>
          <span style={{ width: `${goal.progress}%` }} />
        </span>
        <CompletionAction
          staffId={staffId}
          itemType="goal"
          itemId={goal.id}
          title={goal.title}
          request={request}
          isComplete={isComplete}
          completedByName={goal.completedByName}
          onChanged={onRequestChanged}
        />
      </span>
      {!isComplete && (
        <span className={styles.progressEdit}>
          <input
            type="number"
            min="0"
            max={MAX_OWN_PROGRESS}
            aria-label={`Percent done on ${goal.title}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            loading={isSaving}
            disabled={!isValid || parsed === goal.progress}
            onClick={() => onSave(parsed)}>
            Save
          </Button>
        </span>
      )}
    </li>
  )
}

export const MyPerformance: React.FC<{ staffId: string }> = ({ staffId }) => {
  const { performance, isLoading, hasError } = useMyPerformance(staffId)
  const { run, updateCache, pending } = usePerformanceChange<MyPerformanceData>(
    myPerformanceKey(staffId),
  )

  if (isLoading) return <Spinner />
  if (hasError || !performance) {
    return (
      <EmptyState
        title="Couldn't load your goals and reports"
        description="Something went wrong on our side. Refresh the page to try again."
      />
    )
  }

  const {
    currentWeek,
    goals,
    development,
    feedback,
    reports,
    isExecutive,
    completionRequests,
  } = performance
  const thisWeek = reports.items.find((item) => item.weekStart === currentWeek)
  const past = reports.items.filter((item) => item.weekStart !== currentWeek)

  const submit = async (values: {
    did: string
    blocked: string
    nextWeek: string
  }) => {
    await run(
      'report',
      async () => {
        const report = await submitMyReport(staffId, currentWeek, {
          did: values.did.trim(),
          blocked: values.blocked.trim(),
          nextWeek: values.nextWeek.trim(),
        })
        await updateCache((current) => withReport(current, report))
      },
      'Could not submit your report.',
    )
  }

  const askForAdvice = (report: WeeklyReport) =>
    run(
      'advice',
      async () => {
        const updated = await requestMyAdvice(staffId, report.id)
        await updateCache((current) => withReport(current, updated))
      },
      'Could not get advice. Please try again.',
    )

  const saveProgress = (goal: Goal, progress: number) =>
    run(
      goal.id,
      async () => {
        const saved = await setMyGoalProgress(staffId, goal.id, progress)
        await updateCache((current) => ({
          ...current,
          goals: current.goals.map((item) =>
            item.id === saved.id ? saved : item,
          ),
        }))
      },
      'Could not save your progress.',
    )

  const setDone = (itemId: string, done: boolean) =>
    run(
      itemId,
      async () => {
        const saved = await setMyDevelopmentDone(staffId, itemId, done)
        await updateCache((current) => ({
          ...current,
          development: current.development.map((item) =>
            item.id === saved.id ? saved : item,
          ),
        }))
      },
      'Could not update this item.',
    )

  const loadMore = () =>
    run(
      'more',
      async () => {
        const page = await fetchMyReports(staffId, reports.items.length)
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

  return (
    <div className={styles.stack}>
      <PagePanel title="My goals">
        {goals.length === 0 ? (
          <p className={styles.muted}>No approved goals yet.</p>
        ) : (
          <ul className={styles.list}>
            {goals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                staffId={staffId}
                request={completionRequests.find(
                  (request) => request.itemId === goal.id,
                )}
                isSaving={pending === goal.id}
                onSave={(progress) => void saveProgress(goal, progress)}
                onRequestChanged={(request) =>
                  void updateCache((current) => ({
                    ...current,
                    completionRequests: [
                      ...(request ? [request] : []),
                      ...current.completionRequests.filter(
                        (existing) => existing.itemId !== goal.id,
                      ),
                    ],
                  }))
                }
              />
            ))}
          </ul>
        )}
      </PagePanel>

      <PagePanel
        title="Weekly report"
        hint={`Week of ${formatDateOnly(currentWeek)}`}>
        <div className={styles.stack}>
          {thisWeek?.managerNote ? (
            <ReportBody report={thisWeek} />
          ) : (
            <ValidatedForm
              key={`${currentWeek}-${thisWeek?.textVersion ?? 0}`}
              initialValues={{
                did: thisWeek?.did ?? '',
                blocked: thisWeek?.blocked ?? '',
                nextWeek: thisWeek?.nextWeek ?? '',
              }}
              validationSchema={reportSchema}
              onSubmit={submit}>
              {({ isSubmitting, dirty }) => (
                <Form className={styles.reportForm} noValidate>
                  <TextAreaField name="did" label="What I did" />
                  <TextAreaField name="blocked" label="What blocked me" />
                  <TextAreaField name="nextWeek" label="Next week" />
                  <div>
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={!!thisWeek && !dirty}>
                      {thisWeek ? 'Update report' : 'Submit'}
                    </Button>
                  </div>
                </Form>
              )}
            </ValidatedForm>
          )}
          {thisWeek && !isExecutive && !thisWeek.advice && (
            <div>
              <Button
                variant="outline"
                loading={pending === 'advice'}
                onClick={() => void askForAdvice(thisWeek)}>
                {pending === 'advice' ? 'Thinking…' : 'Get advice'}
              </Button>
            </div>
          )}
          {thisWeek?.advice && !thisWeek.managerNote && (
            <ReportAdvice advice={thisWeek.advice} />
          )}
        </div>
      </PagePanel>

      {past.length > 0 && (
        <PagePanel title="Past reports">
          <div className={styles.stack}>
            <ul className={styles.reportList}>
              {past.map((report) => (
                <li key={report.id}>
                  <strong>Week of {formatDateOnly(report.weekStart)}</strong>
                  <ReportBody report={report} />
                </li>
              ))}
            </ul>
            {reports.items.length < reports.total && (
              <div>
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
        </PagePanel>
      )}

      {development.length > 0 && (
        <PagePanel title="My development plan">
          <ul className={styles.list}>
            {development.map((item) => (
              <li key={item.id} data-done={item.status === 'done' || undefined}>
                <label className={styles.task}>
                  <input
                    type="checkbox"
                    checked={item.status === 'done'}
                    disabled={pending === item.id}
                    onChange={(event) =>
                      void setDone(item.id, event.target.checked)
                    }
                  />
                  <span>
                    <strong>{item.weakArea}</strong>: {item.action}
                  </span>
                </label>
                {item.dueOn && (
                  <span className={styles.muted}>
                    Due {formatDateOnly(item.dueOn)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </PagePanel>
      )}

      {feedback.length > 0 && (
        <PagePanel title="My feedback">
          <div className={styles.stack}>
            <RatingTrendChart feedback={feedback} />
            <ul className={styles.reportList}>
              {[...feedback].reverse().map((row) => (
                <li key={row.id}>
                  <strong>
                    {row.month}: {row.rating} / 5
                  </strong>
                  {row.notes && <p className={styles.note}>{row.notes}</p>}
                  <span className={styles.muted}>From {row.byName}</span>
                </li>
              ))}
            </ul>
          </div>
        </PagePanel>
      )}
    </div>
  )
}
