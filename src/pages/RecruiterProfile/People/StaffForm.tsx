import { ErrorMessage, Field, FieldProps, useFormikContext } from 'formik'
import React, { useMemo } from 'react'
import * as Yup from 'yup'

import { FieldLabel } from '@/components/forms/FieldLabel'
import { Select } from '@/components/forms/Select'
import { Switch } from '@/components/ui/Switch'
import { StaffFormValues, StaffOption } from '@/features/people/types'
import { useProfile } from '@/features/profile/hooks/useProfile'

import styles from './StaffForm.module.scss'

export const EMPTY_STAFF_FORM: StaffFormValues = {
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  managerId: '',
  startDate: '',
  isExecutive: false,
  sendInvite: true,
}

export const staffSchema = (mode: 'create' | 'edit') =>
  Yup.object({
    fullName: Yup.string()
      .trim()
      .required('Enter their full name')
      .max(120, 'Keep the name under 120 characters'),
    email:
      mode === 'create'
        ? Yup.string()
            .trim()
            .required('Enter their email address')
            .email('Enter a valid email address')
        : Yup.string(),
    jobTitle: Yup.string()
      .trim()
      .required('Enter their job title')
      .max(120, 'Keep the title under 120 characters'),
    department: Yup.string()
      .trim()
      .max(120, 'Keep the department under 120 characters'),
    managerId: Yup.string(),
    startDate: Yup.string().required('Pick their start date'),
  })

interface TextFieldProps {
  name: keyof StaffFormValues
  label: string
  placeholder?: string
  type?: string
  readOnly?: boolean
  hint?: string
}

const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  readOnly,
  hint,
}) => (
  <div className={styles.field} data-field={name}>
    <FieldLabel htmlFor={name} className={styles.label}>
      {label}
    </FieldLabel>
    <Field name={name}>
      {({ field, meta }: FieldProps<string>) => (
        <input
          {...field}
          id={name}
          type={type}
          placeholder={placeholder}
          readOnly={readOnly}
          aria-invalid={meta.touched && meta.error ? true : undefined}
          className={readOnly ? styles.readOnly : styles.input}
        />
      )}
    </Field>
    {hint && <p className={styles.hint}>{hint}</p>}
    <ErrorMessage name={name}>
      {(message) => (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
    </ErrorMessage>
  </div>
)

interface StaffFieldsProps {
  mode: 'create' | 'edit'
  managers: StaffOption[]
  currentStaffId?: string
  currentManager?: { id: string; name: string } | null
  readOnly?: boolean
}

export const StaffFields: React.FC<StaffFieldsProps> = ({
  mode,
  managers,
  currentStaffId,
  currentManager,
  readOnly = false,
}) => {
  const { values, setFieldValue } = useFormikContext<StaffFormValues>()
  const { profile } = useProfile()

  const managerOptions = useMemo(() => {
    const options = managers
      .filter((manager) => manager.id !== currentStaffId)
      .map((manager) => ({
        value: manager.id,
        label: `${manager.fullName} · ${manager.jobTitle}`,
      }))
    if (
      currentManager &&
      !options.some((option) => option.value === currentManager.id)
    ) {
      options.unshift({
        value: currentManager.id,
        label: `${currentManager.name} (no longer employed)`,
      })
    }
    return [{ value: '', label: 'No manager' }, ...options]
  }, [managers, currentStaffId, currentManager])

  const senderName =
    `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'you'
  const companyName = profile?.activeOrganization?.name ?? 'your company'

  return (
    <div className={styles.fields}>
      <TextField
        name="fullName"
        label="Full name"
        placeholder="Ada Obi"
        readOnly={readOnly}
      />
      <TextField
        name="email"
        label="Email address"
        type="email"
        placeholder="ada@company.com"
        readOnly={readOnly || mode === 'edit'}
        hint={
          mode === 'edit'
            ? 'The email can’t be changed. End this record and add them again if it’s wrong.'
            : undefined
        }
      />
      <TextField
        name="jobTitle"
        label="Job title"
        placeholder="Product Designer"
        readOnly={readOnly}
      />
      <TextField
        name="department"
        label="Department"
        placeholder="Design"
        readOnly={readOnly}
      />
      <div className={styles.field} data-field="managerId">
        <Select
          name="managerId"
          label="Manager"
          placeholder="No manager"
          searchable
          disabled={readOnly}
          options={managerOptions}
          value={values.managerId}
          onChange={(value) => setFieldValue('managerId', value)}
        />
      </div>
      <TextField
        name="startDate"
        label="Start date"
        type="date"
        readOnly={readOnly}
      />
      <Switch
        label="This person is an executive"
        checked={values.isExecutive}
        disabled={readOnly}
        onChange={(checked) => setFieldValue('isExecutive', checked)}
      />
      {mode === 'create' && (
        <div className={styles.inviteBox}>
          <input
            id="sendInvite"
            type="checkbox"
            checked={values.sendInvite}
            onChange={(event) =>
              setFieldValue('sendInvite', event.target.checked)
            }
          />
          <div>
            <label htmlFor="sendInvite" className={styles.inviteLabel}>
              Send an invite email
            </label>
            <p className={styles.hint}>
              {`${companyName} will email them a link, sent as ${senderName}. They create an AuxHR account, complete their profile, then join.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
