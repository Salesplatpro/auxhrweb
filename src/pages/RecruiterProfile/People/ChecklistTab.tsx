import React, { useState } from 'react'
import { HiOutlineCheckCircle, HiOutlineTrash } from 'react-icons/hi2'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useChecklist } from '@/features/people/hooks/useStaffData'
import { formatDateOnly } from '@/features/people/utils/formatDate'

import styles from './ChecklistTab.module.scss'
import type { EmployeeTabProps } from './employeeTabs'

export const ChecklistTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
}) => {
  const { tasks, isLoading, hasError } = useChecklist(organizationId, staff.id)
  const { addTask, removeTask, isSaving } = useStaffActions(organizationId)
  const [title, setTitle] = useState('')
  const [dueOn, setDueOn] = useState('')
  const isEnded = staff.status === 'ended'
  const doneCount = tasks.filter((task) => task.doneAt).length

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
            } ticks tasks off on their My work page.`
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
                      ? 'Done'
                      : task.dueOn
                      ? `Due ${formatDateOnly(task.dueOn)}`
                      : 'To do'}
                  </span>
                  {!isEnded && (
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
          {!isEnded && (
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
