import { Form } from 'formik'
import React from 'react'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useStaffOptions } from '@/features/people/hooks/useStaffData'
import { StaffFormValues } from '@/features/people/types'

import styles from './AddEmployeePanel.module.scss'
import { EMPTY_STAFF_FORM, StaffFields, staffSchema } from './StaffForm'

interface AddEmployeePanelProps {
  open: boolean
  organizationId: string
  companyName: string
  onClose: () => void
}

export const AddEmployeePanel: React.FC<AddEmployeePanelProps> = ({
  open,
  organizationId,
  companyName,
  onClose,
}) => {
  const { options: managers } = useStaffOptions(organizationId, {
    enabled: open,
  })
  const { addStaff } = useStaffActions(organizationId)

  const handleSubmit = async (values: StaffFormValues) => {
    const result = await addStaff({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      jobTitle: values.jobTitle.trim(),
      department: values.department.trim() || undefined,
      managerId: values.managerId || null,
      startDate: values.startDate,
      isExecutive: values.isExecutive,
      sendInvite: values.sendInvite,
    })
    if (result) onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add employee"
      subtitle={`Add someone who works at ${companyName}, whether or not they were hired through AuxHR.`}>
      <ValidatedForm
        initialValues={EMPTY_STAFF_FORM}
        validationSchema={staffSchema('create')}
        onSubmit={handleSubmit}>
        {({ isSubmitting }) => (
          <Form className={styles.form} noValidate>
            <FormikFocusOnError />
            <StaffFields mode="create" managers={managers} />
            <div className={styles.footer}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save
              </Button>
            </div>
          </Form>
        )}
      </ValidatedForm>
    </Drawer>
  )
}
