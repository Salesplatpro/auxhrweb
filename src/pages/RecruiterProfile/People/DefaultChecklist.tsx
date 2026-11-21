import React, { useMemo, useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useChecklistDefaults } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { ChecklistItem, TaskOwner } from '@/features/people/types'
import {
  dayLabel,
  matchesSearch,
  ownerLabel,
} from '@/features/people/utils/checklistRules'

import styles from './ChecklistTab.module.scss'
import { ChecklistTaskDrawer, TaskFormValues } from './ChecklistTaskDrawer'

const toValues = (item: ChecklistItem): TaskFormValues => ({
  title: item.title,
  description: item.description ?? '',
  owner: item.owner ?? '',
  dueOn: '',
  dueInDays: String(item.dueInDays),
})

const toItem = (values: TaskFormValues): ChecklistItem => ({
  title: values.title.trim(),
  description: values.description.trim() || null,
  owner: (values.owner || null) as TaskOwner | null,
  dueInDays: Number(values.dueInDays),
})

type Editing = { index: number | null } | null

export const DefaultChecklist = () => {
  const { organizationId } = usePeopleAccess()
  const { items, isLoading } = useChecklistDefaults(organizationId, true)
  const { saveDefaultChecklist, isSaving } = useStaffActions(organizationId)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)

  const rows = useMemo(
    () =>
      (items ?? [])
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          matchesSearch([item.title, item.description ?? ''], search),
        ),
    [items, search],
  )

  const persist = async (next: ChecklistItem[]) => {
    const saved = await saveDefaultChecklist(next)
    if (saved) setEditing(null)
  }

  const handleSubmit = async (values: TaskFormValues) => {
    const list = [...(items ?? [])]
    const item = toItem(values)
    if (editing?.index === null || editing?.index === undefined) list.push(item)
    else list[editing.index] = item
    await persist(list)
  }

  const columns: ColumnDef<{ item: ChecklistItem; index: number }>[] = [
    {
      key: 'task',
      header: 'Task',
      render: ({ item }) => (
        <span className={styles.taskCell}>
          <strong>{item.title}</strong>
          {item.description && (
            <span className={styles.muted}>{item.description}</span>
          )}
        </span>
      ),
    },
    {
      key: 'applies',
      header: 'Applies to',
      hideBelow: 640,
      render: () => 'Everyone',
    },
    {
      key: 'due',
      header: 'Due',
      render: ({ item }) => dayLabel(item.dueInDays),
    },
    {
      key: 'owner',
      header: 'Owner',
      hideBelow: 768,
      render: ({ item }) => ownerLabel(item.owner),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: ({ index }) => (
        <TableActions>
          <Dropdown
            trigger={<BsThreeDotsVertical aria-label="Task actions" />}
            items={[
              { label: 'Edit', onClick: () => setEditing({ index }) },
              {
                label: 'Remove',
                onClick: () =>
                  void persist((items ?? []).filter((_, at) => at !== index)),
              },
            ]}
          />
        </TableActions>
      ),
    },
  ]

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker={<Link to={peoplePaths.employees}>People · Employees</Link>}
        title="Default checklist"
        lead="These tasks are added to every new hire. Change them here and new hires get the new list."
      />
      {isLoading || !items ? (
        <Spinner />
      ) : (
        <PagePanel
          title="Tasks for every new hire"
          hint={`${items.length} task${items.length === 1 ? '' : 's'}`}
          action={
            <Button
              variant="ink"
              pill
              size="sm"
              onClick={() => setEditing({ index: null })}>
              Add task
            </Button>
          }>
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
          </div>
          <DataTable
            columns={columns}
            data={rows}
            getRowKey={({ index }) => index}
            ariaLabel="Default checklist"
            showRowNumber={false}
            emptyState={
              <EmptyState
                title="No tasks yet"
                description="New hires will start with an empty checklist."
              />
            }
          />
        </PagePanel>
      )}
      <ChecklistTaskDrawer
        open={!!editing}
        mode="default"
        initial={
          editing?.index !== null && editing?.index !== undefined && items
            ? toValues(items[editing.index]!)
            : undefined
        }
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setEditing(null)}
      />
    </PageShell>
  )
}
