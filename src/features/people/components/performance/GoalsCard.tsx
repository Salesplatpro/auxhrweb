import { Form } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'

import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'

import { usePerformanceChange } from '../../hooks/usePerformance'
import {
  addGoal,
  approveGoal,
  completeGoal,
  editGoal,
  removeGoal,
  reopenGoal,
  suggestGoals,
} from '../../services/peopleService'
import {
  CompletionReviewResult,
  Goal,
  GoalPayload,
  ManagedPerformance,
} from '../../types'
import { formatDateOnly } from '../../utils/formatDate'
import { applyReviewResult } from './CompletionRequestsCard'
import styles from './Performance.module.scss'
import { TextAreaField } from './TextAreaField'

const MAX_KEY_RESULTS = 5

interface GoalFormValues {
  title: string
  keyResults: string
  target: string
  dueOn: string
}

const goalSchema = Yup.object({
  title: Yup.string()
    .trim()
    .required('Write the goal')
    .max(200, 'Keep it under 200 characters'),
  keyResults: Yup.string().test(
    'count',
    `Add at most ${MAX_KEY_RESULTS} key results`,
    (value) => linesOf(value ?? '').length <= MAX_KEY_RESULTS,
  ),
  target: Yup.string().trim().max(200, 'Keep it under 200 characters'),
  dueOn: Yup.string().required('Choose a due date'),
})

const linesOf = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const toPayload = (values: GoalFormValues): GoalPayload => ({
  title: values.title.trim(),
  keyResults: linesOf(values.keyResults),
  target: values.target.trim() || null,
  dueOn: values.dueOn,
})

const GoalForm: React.FC<{
  initial: GoalFormValues
  onSubmit: (payload: GoalPayload) => Promise<void>
  onCancel: () => void
}> = ({ initial, onSubmit, onCancel }) => (
  <ValidatedForm
    initialValues={initial}
    validationSchema={goalSchema}
    onSubmit={(values) => onSubmit(toPayload(values))}>
    {({ isSubmitting }) => (
      <Form className={styles.form} noValidate>
        <TextField name="title" label="Goal" />
        <TextAreaField name="keyResults" label="Key results, one per line" />
        <TextField name="target" label="Target" />
        <TextField name="dueOn" label="Due date" type="date" />
        <div className={styles.actions}>
          <Button type="submit" size="sm" loading={isSubmitting}>
            Save
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Form>
    )}
  </ValidatedForm>
)

const EMPTY_GOAL = { title: '', keyResults: '', target: '', dueOn: '' }

interface GoalsCardProps {
  base: string
  performance: ManagedPerformance
  readOnly: boolean
  canReview: boolean
}

export const GoalsCard: React.FC<GoalsCardProps> = ({
  base,
  performance,
  readOnly,
  canReview,
}) => {
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const replaceGoal = (goal: Goal) =>
    updateCache((current) => ({
      ...current,
      goals: current.goals.map((item) => (item.id === goal.id ? goal : item)),
    }))

  const add = async (payload: GoalPayload) => {
    await run(
      'add',
      async () => {
        const goal = await addGoal(base, payload)
        await updateCache((current) => ({
          ...current,
          goals: [...current.goals, goal],
        }))
        setIsAdding(false)
      },
      'Could not add this goal.',
    )
  }

  const edit = async (goal: Goal, payload: GoalPayload) => {
    await run(
      goal.id,
      async () => {
        await replaceGoal(await editGoal(base, goal.id, payload, goal.version))
        setEditingId(null)
      },
      'Could not save this goal.',
    )
  }

  const approve = (goal: Goal) =>
    run(
      goal.id,
      async () => {
        await replaceGoal(await approveGoal(base, goal.id, goal.version))
      },
      'Could not approve this goal.',
    )

  const review = (goal: Goal, action: () => Promise<CompletionReviewResult>) =>
    run(
      goal.id,
      async () => {
        const result = await action()
        await updateCache((current) => applyReviewResult(current, result))
      },
      'Could not update this goal.',
    )

  const remove = (goal: Goal) =>
    run(
      goal.id,
      async () => {
        await removeGoal(base, goal.id)
        await updateCache((current) => ({
          ...current,
          goals: current.goals.filter((item) => item.id !== goal.id),
        }))
      },
      'Could not remove this goal.',
    )

  const suggest = () =>
    run(
      'suggest',
      async () => {
        const drafts = await suggestGoals(base)
        await updateCache((current) => ({
          ...current,
          goals: [
            ...current.goals.filter(
              (goal) => !drafts.some((draft) => draft.id === goal.id),
            ),
            ...drafts,
          ],
        }))
      },
      'Could not suggest goals. Please try again.',
    )

  return (
    <PagePanel
      title="Goals"
      action={
        !readOnly && (
          <div className={styles.actions}>
            <Button
              size="sm"
              variant="outline"
              loading={pending === 'suggest'}
              onClick={() => void suggest()}>
              Suggest goals
            </Button>
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add goal
            </Button>
          </div>
        )
      }>
      <div className={styles.stack}>
        {isAdding && (
          <GoalForm
            initial={EMPTY_GOAL}
            onSubmit={add}
            onCancel={() => setIsAdding(false)}
          />
        )}
        {performance.goals.length === 0 && !isAdding ? (
          <p className={styles.muted}>No goals yet.</p>
        ) : (
          <ul className={styles.list}>
            {performance.goals.map((goal) => (
              <li key={goal.id} className={styles.item}>
                {editingId === goal.id ? (
                  <GoalForm
                    initial={{
                      title: goal.title,
                      keyResults: goal.keyResults.join('\n'),
                      target: goal.target ?? '',
                      dueOn: goal.dueOn,
                    }}
                    onSubmit={(payload) => edit(goal, payload)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className={styles.itemHead}>
                      <strong>{goal.title}</strong>
                      <span className={styles.pill}>
                        {goal.completedAt
                          ? 'Complete'
                          : goal.status === 'draft'
                          ? 'Draft'
                          : 'Approved'}
                      </span>
                    </div>
                    {goal.source === 'ai' && goal.status === 'draft' && (
                      <span className={styles.muted}>AI suggestion</span>
                    )}
                    {goal.keyResults.length > 0 && (
                      <ul className={styles.tips}>
                        {goal.keyResults.map((result, index) => (
                          <li key={index}>{result}</li>
                        ))}
                      </ul>
                    )}
                    <p className={styles.muted}>
                      {goal.target ? `Target: ${goal.target}. ` : ''}Due{' '}
                      {formatDateOnly(goal.dueOn)}. {goal.progress}% done.
                      {goal.approvedByName
                        ? ` Approved by ${goal.approvedByName}.`
                        : ''}
                      {goal.completedByName
                        ? ` Marked complete by ${goal.completedByName}.`
                        : ''}
                    </p>
                    {canReview && goal.status === 'approved' && (
                      <div className={styles.actions}>
                        {goal.completedAt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            disabled={pending === goal.id}
                            onClick={() =>
                              void review(goal, () => reopenGoal(base, goal.id))
                            }>
                            Reopen
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            type="button"
                            loading={pending === goal.id}
                            onClick={() =>
                              void review(goal, () =>
                                completeGoal(base, goal.id, goal.version),
                              )
                            }>
                            Mark complete
                          </Button>
                        )}
                      </div>
                    )}
                    {!readOnly && (
                      <div className={styles.actions}>
                        {goal.status === 'draft' && (
                          <Button
                            size="sm"
                            loading={pending === goal.id}
                            onClick={() => void approve(goal)}>
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(goal.id)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending === goal.id}
                          onClick={() => void remove(goal)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PagePanel>
  )
}
