import React, { useMemo, useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useChecklist } from '@/features/people/hooks/useStaffData'
import {
  completeTask,
  hrPerformanceBase,
  reopenTask,
} from '@/features/people/services/peopleService'
import { ChecklistTask, TaskOwner, TaskStatus } from '@/features/people/types'
import {
  matchesSearch,
  STATUS_FILTERS,
  TASK_STATUS,
  taskStatusOf,
} from '@/features/people/utils/checklistRules'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ChecklistTab.module.scss'
import { ChecklistTaskDrawer, TaskFormValues } from './ChecklistTaskDrawer'
import type { EmployeeTabProps } from './employeeTabs'

const doneOn = (task: ChecklistTask) =>
  task.doneAt ? formatDateOnly(task.doneAt.slice(0, 10)) : '—'

export const ChecklistTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
  canEdit,
}) => {
  const { tasks, isLoading, hasError, reload } = useChecklist(
    organizationId,
    staff.id,
  )
  const { addTask, removeTask, isSaving } = useStaffActions(organizationId)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [isAdding, setIsAdding] = useState(false)
  const isReadOnly = !canEdit || staff.status === 'ended'
  const doneCount = tasks.filter((task) => task.doneAt).length

  const shown = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!status || taskStatusOf(task) === status) &&
          matchesSearch(
            [task.title, task.description ?? '', task.ownerName ?? ''],
            search,
          ),
      ),
    [tasks, status, search],
  )

  const review = async (task: ChecklistTask) => {
    const base = hrPerformanceBase(organizationId, staff.id)
    try {
      await (task.doneAt ? reopenTask : completeTask)(base, task.id)
      await reload()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not update this task'))
    }
  }

  const handleAdd = async (values: TaskFormValues) => {
    const created = await addTask(staff.id, {
      title: values.title.trim(),
      dueOn: values.dueOn || null,
      description: values.description.trim() || null,
      owner: (values.owner || null) as TaskOwner | null,
    })
    if (created) setIsAdding(false)
  }

  const columns: ColumnDef<ChecklistTask>[] = [
    {
      key: 'task',
      header: 'Task',
      render: (task) => (
        <span className={styles.taskCell}>
          <strong>{task.title}</strong>
          {task.description && (
            <span className={styles.muted}>{task.description}</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => {
        const style = TASK_STATUS[taskStatusOf(task)]
        return (
          <StatusBadge
            status={style.label}
            backgroundColor={style.backgroundColor}
            color={style.color}
            showDot
          />
        )
      },
    },
    {
      key: 'due',
      header: 'Due',
      hideBelow: 640,
      render: (task) => formatDateOnly(task.dueOn),
    },
    {
      key: 'doneOn',
      header: 'Done on',
      hideBelow: 768,
      render: doneOn,
    },
    {
      key: 'owner',
      header: 'Owner',
      hideBelow: 900,
      render: (task) => task.ownerName ?? '—',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (task) => (
        <TableActions>
          <Dropdown
            trigger={<BsThreeDotsVertical aria-label="Task actions" />}
            items={[
              ...(staff.status !== 'ended'
                ? [
                    {
                      label: task.doneAt ? 'Reopen' : 'Mark complete',
                      onClick: () => void review(task),
                    },
                  ]
                : []),
              ...(!isReadOnly
                ? [
                    {
                      label: 'Remove',
                      onClick: () => void removeTask(staff.id, task.id),
                    },
                  ]
                : []),
            ]}
          />
        </TableActions>
      ),
    },
  ]

  return (
    <PagePanel
      title="Checklist"
      hint={`${tasks.length} task${
        tasks.length === 1 ? '' : 's'
      } · ${doneCount} done`}
      action={
        !isReadOnly && (
          <Button
            variant="ink"
            pill
            size="sm"
            onClick={() => setIsAdding(true)}>
            Add task
          </Button>
        )
      }>
      {hasError ? (
        <p>Couldn&apos;t load the checklist. Refresh the page to try again.</p>
      ) : (
        <>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <HiOutlineMagnifyingGlass size={16} aria-hidden />
              <input
                type="search"
                value={search}
                placeholder="Search tasks"
                aria-label="Search tasks"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <Dropdown
              align="left"
              trigger={
                <span className={styles.filter}>
                  Status:{' '}
                  {STATUS_FILTERS.find((item) => item.value === status)?.label}
                </span>
              }
              items={STATUS_FILTERS.map((item) => ({
                key: item.value || 'all',
                label: item.label,
                onClick: () => setStatus(item.value),
              }))}
            />
          </div>
          <DataTable
            columns={columns}
            data={shown}
            isLoading={isLoading}
            getRowKey={(task) => task.id}
            ariaLabel="Checklist"
            showRowNumber={false}
            emptyState={
              <EmptyState
                title={
                  tasks.length === 0 ? 'No tasks yet' : 'No tasks match that'
                }
                description={
                  tasks.length === 0
                    ? 'Add a task, or change the default checklist for new hires.'
                    : 'Try a different search or clear the status filter.'
                }
              />
            }
          />
        </>
      )}
      <ChecklistTaskDrawer
        open={isAdding}
        mode="employee"
        isSaving={isSaving}
        onSubmit={handleAdd}
        onClose={() => setIsAdding(false)}
      />
    </PagePanel>
  )
}
