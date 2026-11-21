import React, { useEffect, useState } from 'react'

import { Select } from '@/components/forms/Select'
import { TextInput } from '@/components/forms/TextInput'
import { Button } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import type { TaskOwner } from '@/features/people/types'
import { OWNER_OPTIONS } from '@/features/people/utils/checklistRules'

import styles from './ChecklistTaskDrawer.module.scss'

export type TaskFormValues = {
  title: string
  description: string
  owner: TaskOwner | ''
  dueOn: string
  dueInDays: string
}

export const EMPTY_TASK: TaskFormValues = {
  title: '',
  description: '',
  owner: '',
  dueOn: '',
  dueInDays: '0',
}

type ChecklistTaskDrawerProps = {
  open: boolean
  mode: 'employee' | 'default'
  initial?: TaskFormValues
  isSaving: boolean
  onSubmit: (values: TaskFormValues) => void | Promise<void>
  onClose: () => void
}

export const ChecklistTaskDrawer = ({
  open,
  mode,
  initial = EMPTY_TASK,
  isSaving,
  onSubmit,
  onClose,
}: ChecklistTaskDrawerProps) => {
  const [values, setValues] = useState<TaskFormValues>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(initial)
      setError(null)
    }
  }, [open, initial])

  const set = (key: keyof TaskFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const submit = async () => {
    if (!values.title.trim()) {
      setError('Name the task')
      return
    }
    if (mode === 'default') {
      const days = Number(values.dueInDays)
      if (!Number.isInteger(days) || days < 0 || days > 365) {
        setError('Use a whole number of days from 0 to 365')
        return
      }
    }
    setError(null)
    await onSubmit(values)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initial.title ? 'Edit task' : 'Add task'}
      footer={
        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ink"
            pill
            loading={isSaving}
            onClick={() => void submit()}>
            Save task
          </Button>
        </div>
      }>
      <div className={styles.fields}>
        <TextInput
          title="Task"
          name="title"
          label="Task"
          maxLength={120}
          value={values.title}
          error={error && !values.title.trim() ? error : undefined}
          onChange={(event) => set('title', event.target.value)}
        />
        <TextInput
          title="Note"
          name="description"
          label="Note"
          maxLength={200}
          placeholder="For example IT hands it over"
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
        />
        <Select
          label="Owner"
          name="owner"
          placeholder="Choose an owner"
          options={OWNER_OPTIONS}
          value={values.owner}
          onChange={(value) => set('owner', value)}
        />
        {mode === 'employee' ? (
          <TextInput
            title="Due date"
            name="dueOn"
            label="Due date"
            type="date"
            value={values.dueOn}
            onChange={(event) => set('dueOn', event.target.value)}
          />
        ) : (
          <TextInput
            title="Days after start"
            name="dueInDays"
            label="Days after start"
            type="number"
            value={values.dueInDays}
            error={error && values.title.trim() ? error : undefined}
            onChange={(event) => set('dueInDays', event.target.value)}
          />
        )}
      </div>
    </Drawer>
  )
}
