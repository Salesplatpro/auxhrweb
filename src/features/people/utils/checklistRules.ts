import type { ChecklistTask, TaskOwner, TaskStatus } from '../types'

export const OWNER_OPTIONS: { value: TaskOwner; label: string }[] = [
  { value: 'it', label: 'IT' },
  { value: 'new_hire', label: 'The new hire' },
  { value: 'manager', label: 'The manager' },
  { value: 'hr', label: 'HR' },
]

export const ownerLabel = (owner: TaskOwner | null | undefined) =>
  OWNER_OPTIONS.find((option) => option.value === owner)?.label ?? '—'

export const TASK_STATUS: Record<
  TaskStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  done: {
    label: 'Done',
    backgroundColor: 'var(--color-positive-tint)',
    color: 'var(--color-positive)',
  },
  not_done: {
    label: 'Not done',
    backgroundColor: 'var(--color-caution-tint)',
    color: 'var(--color-caution-text)',
  },
  late: {
    label: 'Late',
    backgroundColor: 'var(--color-danger-tint)',
    color: 'var(--color-danger)',
  },
}

export const STATUS_FILTERS: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'done', label: 'Done' },
  { value: 'not_done', label: 'Not done' },
  { value: 'late', label: 'Late' },
]

export const taskStatusOf = (task: ChecklistTask): TaskStatus =>
  task.status ?? (task.doneAt ? 'done' : 'not_done')

export const dayLabel = (dueInDays: number) => `Day ${dueInDays + 1}`

export const matchesSearch = (text: string[], query: string) => {
  const needle = query.trim().toLowerCase()
  return !needle || text.some((part) => part.toLowerCase().includes(needle))
}
