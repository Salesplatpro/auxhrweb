import { Form } from 'formik'
import React, { useMemo } from 'react'

import { Alert } from '@/components/feedback/Alert'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useStaffOptions } from '@/features/people/hooks/useStaffData'
import { StaffFormValues } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'

import styles from './DetailsTab.module.scss'
import type { EmployeeTabProps } from './employeeTabs'
import { StaffFields, staffSchema } from './StaffForm'

export const DetailsTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
}) => {
  const { options: managers } = useStaffOptions(organizationId)
  const { saveStaff } = useStaffActions(organizationId)
  const isEnded = staff.status === 'ended'

  const initialValues: StaffFormValues = useMemo(
    () => ({
      fullName: staff.fullName,
      email: staff.email,
      jobTitle: staff.jobTitle,
      department: staff.department ?? '',
      managerId: staff.managerId ?? '',
      startDate: staff.startDate,
      isExecutive: staff.isExecutive,
      sendInvite: false,
    }),
    [staff],
  )

  const handleSubmit = async (values: StaffFormValues) => {
    await saveStaff(staff.id, {
      fullName: values.fullName.trim(),
      jobTitle: values.jobTitle.trim(),
      department: values.department.trim() || null,
      managerId: values.managerId || null,
      startDate: values.startDate,
      isExecutive: values.isExecutive,
    })
  }

  return (
    <PagePanel
      title="Details"
      hint={
        isEnded
          ? undefined
          : 'Changes are saved to their record and recorded in the Activity tab.'
      }>
      {isEnded && (
        <Alert variant="info">
          Employment ended on {formatDateOnly(staff.endDate)}. This record is
          read-only.
        </Alert>
      )}
      <ValidatedForm
        initialValues={initialValues}
        enableReinitialize
        validationSchema={staffSchema('edit')}
        onSubmit={handleSubmit}>
        {({ isSubmitting, dirty }) => (
          <Form className={styles.form} noValidate>
            <FormikFocusOnError />
            <StaffFields
              mode="edit"
              managers={managers}
              currentStaffId={staff.id}
              currentManager={
                staff.managerId
                  ? {
                      id: staff.managerId,
                      name: staff.managerName ?? 'Former manager',
                    }
                  : null
              }
              readOnly={isEnded}
            />
            {!isEnded && (
              <div className={styles.footer}>
                <Button type="submit" loading={isSubmitting} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            )}
          </Form>
        )}
      </ValidatedForm>
    </PagePanel>
  )
}
