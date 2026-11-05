import React, { useState } from 'react'
import useSWR from 'swr'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  completeTask,
  fetchScopedTasks,
  reopenTask,
} from '@/features/people/services/peopleService'
import { ChecklistTask } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './Performance.module.scss'

/** For a manager, who has no Checklist tab. Each read is logged, so it only reloads when asked. */
export const TeamTasksCard: React.FC<{ base: string }> = ({ base }) => {
  const key = `${base}/tasks`
  const { data, isLoading, error, mutate } = useSWR(
    key,
    () => fetchScopedTasks(base),
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  )
  const [pendingId, setPendingId] = useState<string | null>(null)

  const act = async (
    task: ChecklistTask,
    action: (
      base: string,
      id: string,
    ) => Promise<{ task: ChecklistTask | null }>,
  ) => {
    setPendingId(task.id)
    try {
      const result = await action(base, task.id)
      await mutate(
        (current) =>
          current?.map((item) =>
            item.id === task.id ? result.task ?? item : item,
          ),
        { revalidate: false },
      )
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not update this task'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <PagePanel title="First-week tasks">
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <p className={styles.muted}>
          Couldn&apos;t load these. Refresh the page to try again.
        </p>
      ) : !data?.length ? (
        <p className={styles.muted}>No tasks yet.</p>
      ) : (
        <ul className={styles.list}>
          {data.map((task) => (
            <li key={task.id} className={styles.item}>
              <div className={styles.itemHead}>
                <strong>{task.title}</strong>
                {task.doneAt && <span className={styles.pill}>Complete</span>}
              </div>
              {task.dueOn && !task.doneAt && (
                <p className={styles.muted}>Due {formatDateOnly(task.dueOn)}</p>
              )}
              <div className={styles.actions}>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  loading={pendingId === task.id}
                  onClick={() =>
                    void act(task, task.doneAt ? reopenTask : completeTask)
                  }>
                  {task.doneAt ? 'Reopen' : 'Mark complete'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PagePanel>
  )
}
