import { ErrorMessage, Field, FieldArray, Form } from 'formik'
import React from 'react'
import { HiOutlineTrash } from 'react-icons/hi2'
import * as Yup from 'yup'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Spinner } from '@/components/ui/Spinner'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useChecklistDefaults } from '@/features/people/hooks/useStaffData'
import { ChecklistItem } from '@/features/people/types'

import styles from './CommissionPlans.module.scss'
import payStyles from './PayTab.module.scss'

const MAX_TASKS = 30

const checklistSchema = Yup.object({
  items: Yup.array()
    .max(MAX_TASKS, `Use at most ${MAX_TASKS} tasks`)
    .of(
      Yup.object({
        title: Yup.string()
          .trim()
          .required('Name the task')
          .max(120, 'Keep it under 120 characters'),
        dueInDays: Yup.number()
          .typeError('Enter a number of days')
          .integer('Use whole days')
          .min(0, 'Use 0 for the first day')
          .max(365, 'Use at most 365 days')
          .required('Enter a number of days'),
      }),
    ),
})

interface DefaultChecklistDrawerProps {
  organizationId: string
  open: boolean
  onClose: () => void
}

export const DefaultChecklistDrawer: React.FC<DefaultChecklistDrawerProps> = ({
  organizationId,
  open,
  onClose,
}) => {
  const { items } = useChecklistDefaults(organizationId, open)
  const { saveDefaultChecklist } = useStaffActions(organizationId)

  const handleSave = async (values: { items: ChecklistItem[] }) => {
    const saved = await saveDefaultChecklist(
      values.items.map((item) => ({
        title: item.title.trim(),
        dueInDays: Number(item.dueInDays),
      })),
    )
    if (saved) onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Default checklist"
      subtitle="Copied to every new employee. Changes apply to people added from now on.">
      {!items ? (
        <Spinner />
      ) : (
        <ValidatedForm
          initialValues={{ items }}
          enableReinitialize
          validationSchema={checklistSchema}
          onSubmit={handleSave}>
          {({ values, isSubmitting }) => (
            <Form className={payStyles.fields} noValidate>
              <FormikFocusOnError />
              <FieldArray name="items">
                {({ push, remove }) => (
                  <div className={styles.tiers}>
                    {values.items.map((_, index) => (
                      <div key={index} className={styles.tier}>
                        <label className={`${styles.cell} ${styles.wide}`}>
                          <span className={styles.cellLabel}>Task</span>
                          <Field
                            name={`items.${index}.title`}
                            className={styles.input}
                          />
                          <ErrorMessage name={`items.${index}.title`}>
                            {(message) => (
                              <span className={styles.error} role="alert">
                                {message}
                              </span>
                            )}
                          </ErrorMessage>
                        </label>
                        <label className={styles.cell}>
                          <span className={styles.cellLabel}>
                            Days after start
                          </span>
                          <Field
                            name={`items.${index}.dueInDays`}
                            type="number"
                            className={styles.input}
                          />
                          <ErrorMessage name={`items.${index}.dueInDays`}>
                            {(message) => (
                              <span className={styles.error} role="alert">
                                {message}
                              </span>
                            )}
                          </ErrorMessage>
                        </label>
                        <button
                          type="button"
                          className={styles.remove}
                          aria-label={`Remove task ${index + 1}`}
                          onClick={() => remove(index)}>
                          <HiOutlineTrash />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={values.items.length >= MAX_TASKS}
                      onClick={() => push({ title: '', dueInDays: 0 })}>
                      Add task
                    </Button>
                  </div>
                )}
              </FieldArray>
              <div className={payStyles.actions}>
                <Button type="submit" loading={isSubmitting}>
                  Save checklist
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </ValidatedForm>
      )}
    </Drawer>
  )
}
