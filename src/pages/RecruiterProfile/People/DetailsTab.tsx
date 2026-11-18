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
import { firstNameOf } from '@/features/people/utils/nameParts'
import { describeStaffChange } from '@/features/people/utils/staffChanges'

import { AssignedHrPanel } from './AssignedHrPanel'
import styles from './DetailsTab.module.scss'
import type { EmployeeTabProps } from './employeeTabs'
import { StaffFields, staffSchema } from './StaffForm'

export const DetailsTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
  canEdit,
  isOwner,
}) => {
  const { options: managers } = useStaffOptions(organizationId, {
    enabled: !!canEdit,
  })
  const { saveStaff } = useStaffActions(organizationId)
  const isEnded = staff.status === 'ended'
  const isReadOnly = isEnded || !canEdit

  const initialValues: StaffFormValues = useMemo(
    () => ({
      fullName: staff.fullName,
      email: staff.email,
      jobTitle: staff.jobTitle,
      department: staff.department ?? '',
      managerId: staff.managerId ?? '',
      startDate: staff.startDate,
      isExecutive: staff.isExecutive,
      phone: staff.phone ?? '',
      homeAddress: staff.homeAddress ?? '',
      sendInvite: false,
    }),
    [staff],
  )
  const emailLocked = staff.invite.state === 'accepted'

  const handleSubmit = async (values: StaffFormValues) => {
    const email = values.email.trim()
    await saveStaff(
      staff.id,
      {
        fullName: values.fullName.trim(),
        ...(emailLocked || email === staff.email ? {} : { email }),
        jobTitle: values.jobTitle.trim(),
        department: values.department.trim() || null,
        managerId: values.managerId || null,
        startDate: values.startDate,
        isExecutive: values.isExecutive,
        phone: values.phone.trim() || null,
        homeAddress: values.homeAddress.trim() || null,
      },
      describeStaffChange(
        initialValues,
        values,
        (id) => managers.find((manager) => manager.id === id)?.fullName,
      ),
    )
  }

  return (
    <>
      <PagePanel
        title="Details"
        hint={
          isReadOnly
            ? undefined
            : `Edit and save. Changes show on ${firstNameOf(
                staff.fullName,
              )}'s My work page.`
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
          {({ isSubmitting, dirty, resetForm }) => (
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
                readOnly={isReadOnly}
                emailLocked={emailLocked}
              />
              {!isReadOnly && (
                <div className={styles.footer}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!dirty || isSubmitting}
                    onClick={() => resetForm()}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!dirty}>
                    Save changes
                  </Button>
                </div>
              )}
            </Form>
          )}
        </ValidatedForm>
      </PagePanel>
      {isOwner && (
        <AssignedHrPanel
          organizationId={organizationId}
          staffId={staff.id}
          isEnded={isEnded}
        />
      )}
    </>
  )
}
