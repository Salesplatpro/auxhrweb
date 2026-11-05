import React, { useState } from 'react'
import { HiOutlineCheckCircle, HiOutlineTrash } from 'react-icons/hi2'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useChecklist } from '@/features/people/hooks/useStaffData'
import {
  completeTask,
  hrPerformanceBase,
  reopenTask,
} from '@/features/people/services/peopleService'
import { ChecklistTask } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ChecklistTab.module.scss'
import type { EmployeeTabProps } from './employeeTabs'

export const ChecklistTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
  canEdit,
}) => {
  const { tasks, isLoading, hasError, reload } = useChecklist(
    organizationId,
    staff.id,
  )
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const { addTask, removeTask, isSaving } = useStaffActions(organizationId)
  const [title, setTitle] = useState('')
  const [dueOn, setDueOn] = useState('')
  const isReadOnly = !canEdit || staff.status === 'ended'
  const doneCount = tasks.filter((task) => task.doneAt).length

  const review = async (task: ChecklistTask) => {
    const base = hrPerformanceBase(organizationId, staff.id)
    setReviewingId(task.id)
    try {
      await (task.doneAt ? reopenTask : completeTask)(base, task.id)
      await reload()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not update this task'))
    } finally {
      setReviewingId(null)
    }
  }

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    if (
      await addTask(staff.id, { title: title.trim(), dueOn: dueOn || null })
    ) {
      setTitle('')
      setDueOn('')
    }
  }

  return (
    <PagePanel
      title="First-week checklist"
      hint={
        tasks.length > 0
          ? `${doneCount} of ${tasks.length} done. ${
              staff.fullName.split(' ')[0]
            } asks for a task to be marked complete from their My work page.`
          : undefined
      }>
      {isLoading ? (
        <Spinner />
      ) : hasError ? (
        <p>Couldn&apos;t load the checklist. Refresh the page to try again.</p>
      ) : (
        <>
          {tasks.length === 0 ? (
            <p className={styles.empty}>No tasks yet.</p>
          ) : (
            <ul className={styles.tasks}>
              {tasks.map((task) => (
                <li key={task.id} data-done={!!task.doneAt || undefined}>
                  <HiOutlineCheckCircle className={styles.status} aria-hidden />
                  <span className={styles.title}>{task.title}</span>
                  <span className={styles.meta}>
                    {task.doneAt
                      ? `Done${
                          task.completedByName
                            ? `, marked by ${task.completedByName}`
                            : ''
                        }`
                      : task.dueOn
                      ? `Due ${formatDateOnly(task.dueOn)}`
                      : 'To do'}
                  </span>
                  {staff.status !== 'ended' && (
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      loading={reviewingId === task.id}
                      onClick={() => void review(task)}>
                      {task.doneAt ? 'Reopen' : 'Mark complete'}
                    </Button>
                  )}
                  {!isReadOnly && (
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Remove ${task.title}`}
                      onClick={() => removeTask(staff.id, task.id)}>
                      <HiOutlineTrash />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!isReadOnly && (
            <form className={styles.add} onSubmit={handleAdd}>
              <input
                aria-label="New task"
                placeholder="Add a task, for example Meet your team"
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <input
                aria-label="Due date"
                type="date"
                value={dueOn}
                onChange={(event) => setDueOn(event.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                loading={isSaving}
                disabled={!title.trim()}>
                Add task
              </Button>
            </form>
          )}
        </>
      )}
    </PagePanel>
  )
}
