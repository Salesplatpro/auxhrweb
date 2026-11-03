import { Form } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'

import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'

import { usePerformanceChange } from '../../hooks/usePerformance'
import {
  addDevelopmentItem,
  editDevelopmentItem,
  removeDevelopmentItem,
  suggestDevelopmentItems,
} from '../../services/peopleService'
import { DevelopmentItem, ManagedPerformance } from '../../types'
import { formatDateOnly } from '../../utils/formatDate'
import styles from './Performance.module.scss'
import { TextAreaField } from './TextAreaField'

const STATUS_LABELS: Record<DevelopmentItem['status'], string> = {
  proposed: 'AI suggestion',
  open: 'Open',
  done: 'Done',
}

const itemSchema = Yup.object({
  weakArea: Yup.string()
    .trim()
    .required('Name the weak area')
    .max(200, 'Keep it under 200 characters'),
  action: Yup.string()
    .trim()
    .required('Write the action')
    .max(1000, 'Keep it under 1000 characters'),
  dueOn: Yup.string(),
})

interface DevelopmentCardProps {
  base: string
  performance: ManagedPerformance
  readOnly: boolean
}

export const DevelopmentCard: React.FC<DevelopmentCardProps> = ({
  base,
  performance,
  readOnly,
}) => {
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const [isAdding, setIsAdding] = useState(false)

  const add = async (values: {
    weakArea: string
    action: string
    dueOn: string
  }) => {
    await run(
      'add',
      async () => {
        const item = await addDevelopmentItem(base, {
          weakArea: values.weakArea.trim(),
          action: values.action.trim(),
          dueOn: values.dueOn || null,
        })
        await updateCache((current) => ({
          ...current,
          development: [...current.development, item],
        }))
        setIsAdding(false)
      },
      'Could not add this item.',
    )
  }

  const accept = (item: DevelopmentItem) =>
    run(
      item.id,
      async () => {
        const saved = await editDevelopmentItem(base, item, 'open')
        await updateCache((current) => ({
          ...current,
          development: current.development.map((row) =>
            row.id === saved.id ? saved : row,
          ),
        }))
      },
      'Could not accept this item.',
    )

  const remove = (item: DevelopmentItem) =>
    run(
      item.id,
      async () => {
        await removeDevelopmentItem(base, item.id)
        await updateCache((current) => ({
          ...current,
          development: current.development.filter((row) => row.id !== item.id),
        }))
      },
      'Could not remove this item.',
    )

  const suggest = () =>
    run(
      'suggest',
      async () => {
        const proposed = await suggestDevelopmentItems(base)
        await updateCache((current) => ({
          ...current,
          development: [
            ...current.development.filter(
              (row) => !proposed.some((item) => item.id === row.id),
            ),
            ...proposed,
          ],
        }))
      },
      'Could not suggest items. Please try again.',
    )

  return (
    <PagePanel
      title="Development plan"
      action={
        !readOnly && (
          <div className={styles.actions}>
            <Button
              size="sm"
              variant="outline"
              loading={pending === 'suggest'}
              onClick={() => void suggest()}>
              Suggest with AI
            </Button>
            <Button size="sm" onClick={() => setIsAdding(true)}>
              Add item
            </Button>
          </div>
        )
      }>
      <div className={styles.stack}>
        {isAdding && (
          <ValidatedForm
            initialValues={{ weakArea: '', action: '', dueOn: '' }}
            validationSchema={itemSchema}
            onSubmit={add}>
            {({ isSubmitting }) => (
              <Form className={styles.form} noValidate>
                <TextField name="weakArea" label="Weak area" />
                <TextAreaField name="action" label="Action" />
                <TextField name="dueOn" label="Due date" type="date" />
                <div className={styles.actions}>
                  <Button type="submit" size="sm" loading={isSubmitting}>
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </ValidatedForm>
        )}
        {performance.development.length === 0 && !isAdding ? (
          <p className={styles.muted}>No plan items yet.</p>
        ) : (
          <ul className={styles.list}>
            {performance.development.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <strong>{item.weakArea}</strong>
                  <span className={styles.pill}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <p className={styles.body}>{item.action}</p>
                {item.dueOn && (
                  <p className={styles.muted}>
                    Due {formatDateOnly(item.dueOn)}
                  </p>
                )}
                {!readOnly && (
                  <div className={styles.actions}>
                    {item.status === 'proposed' && (
                      <Button
                        size="sm"
                        loading={pending === item.id}
                        onClick={() => void accept(item)}>
                        Accept
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending === item.id}
                      onClick={() => void remove(item)}>
                      Remove
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PagePanel>
  )
}
