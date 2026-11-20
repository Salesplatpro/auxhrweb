import { ErrorMessage, Field, FieldProps, useFormikContext } from 'formik'
import React, { useMemo } from 'react'
import { LuCalendar, LuMail } from 'react-icons/lu'
import * as Yup from 'yup'

import { CheckBox } from '@/components/forms/CheckBox'
import { FieldLabel } from '@/components/forms/FieldLabel'
import { Select } from '@/components/forms/Select'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StaffFormValues, StaffOption } from '@/features/people/types'
import { firstNameOf } from '@/features/people/utils/nameParts'
import { useProfile } from '@/features/profile/hooks/useProfile'

import styles from './StaffForm.module.scss'

const EXECUTIVE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export const EMPTY_STAFF_FORM: StaffFormValues = {
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  managerId: '',
  startDate: '',
  isExecutive: false,
  phone: '',
  homeAddress: '',
  sendInvite: true,
}

export const staffSchema = (mode: 'create' | 'edit') =>
  Yup.object({
    fullName: Yup.string()
      .trim()
      .required('Enter their full name')
      .max(120, 'Keep the name under 120 characters'),
    email: Yup.string()
      .trim()
      .required(
        mode === 'create'
          ? 'Enter their email address'
          : 'Enter their work email',
      )
      .email('Enter a valid email address'),
    jobTitle: Yup.string()
      .trim()
      .required('Enter their job title')
      .max(120, 'Keep the title under 120 characters'),
    department: Yup.string()
      .trim()
      .max(120, 'Keep the department under 120 characters'),
    managerId: Yup.string(),
    startDate: Yup.string().required('Pick their start date'),
    phone: Yup.string()
      .trim()
      .matches(/^\+[1-9][\d\s()-]{6,20}$/, {
        message:
          'Enter the number with its country code, like +234 803 555 0198',
        excludeEmptyString: true,
      }),
    homeAddress: Yup.string()
      .trim()
      .max(300, 'Keep the address under 300 characters'),
  })

interface TextFieldProps {
  name: keyof StaffFormValues
  label: string
  placeholder?: string
  type?: string
  readOnly?: boolean
  hint?: string
  wide?: boolean
  icon?: React.ReactNode
}

const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  readOnly,
  hint,
  wide,
  icon,
}) => (
  <div
    className={wide ? `${styles.field} ${styles.wide}` : styles.field}
    data-field={name}>
    <FieldLabel htmlFor={name} className={styles.label}>
      {label}
    </FieldLabel>
    <Field name={name}>
      {({ field, meta }: FieldProps<string>) => {
        const input = (
          <input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            readOnly={readOnly}
            aria-invalid={meta.touched && meta.error ? true : undefined}
            className={[
              readOnly ? styles.readOnly : styles.input,
              icon ? styles.withIcon : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )
        if (!icon) return input
        return (
          <div className={styles.affixed}>
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
            {input}
          </div>
        )
      }}
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

const emailHint = (
  mode: 'create' | 'edit',
  emailLocked: boolean,
  changed: boolean,
) => {
  if (mode === 'create') return undefined
  if (emailLocked) {
    return 'They joined with this email, so it can’t be changed here.'
  }
  return changed
    ? 'Saving cancels the invite sent to the old address. Send a new invite afterwards.'
    : undefined
}

interface StaffFieldsProps {
  mode: 'create' | 'edit'
  managers: StaffOption[]
  currentStaffId?: string
  currentManager?: { id: string; name: string } | null
  readOnly?: boolean
  /** Name and email come from the applicant's account and can't be typed over. */
  lockIdentity?: boolean
  /** The person joined with this email, so it can no longer change. */
  emailLocked?: boolean
}

export const StaffFields: React.FC<StaffFieldsProps> = ({
  mode,
  managers,
  currentStaffId,
  currentManager,
  readOnly = false,
  lockIdentity = false,
  emailLocked = false,
}) => {
  const { values, initialValues, setFieldValue } =
    useFormikContext<StaffFormValues>()
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

  const departmentOptions = useMemo(() => {
    const departments = profile?.activeOrganization?.departments ?? []
    const options = departments.map((name) => ({ value: name, label: name }))
    if (
      values.department &&
      !departments.some(
        (name) => name.toLowerCase() === values.department.toLowerCase(),
      )
    ) {
      options.unshift({ value: values.department, label: values.department })
    }
    return [{ value: '', label: 'No department' }, ...options]
  }, [profile?.activeOrganization?.departments, values.department])

  const senderName =
    `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'you'
  const companyName = profile?.activeOrganization?.name ?? 'your company'

  return (
    <div
      className={
        mode === 'edit' ? `${styles.fields} ${styles.grid}` : styles.fields
      }>
      <TextField
        name="fullName"
        label="Full name"
        placeholder="Ada Obi"
        readOnly={readOnly || lockIdentity}
      />
      <TextField
        name="email"
        label="Work email"
        type="email"
        icon={<LuMail />}
        placeholder="ada@company.com"
        readOnly={readOnly || lockIdentity || emailLocked}
        hint={emailHint(
          mode,
          emailLocked,
          values.email !== initialValues.email,
        )}
      />
      <TextField
        name="jobTitle"
        label="Job title"
        placeholder="Product Designer"
        readOnly={readOnly}
      />
      <div className={styles.field} data-field="department">
        <Select
          name="department"
          label="Department"
          disabled={readOnly}
          options={departmentOptions}
          value={values.department}
          onChange={(value) => setFieldValue('department', value)}
        />
        {!readOnly && departmentOptions.length === 1 && (
          <p className={styles.hint}>Add departments on the Company page.</p>
        )}
      </div>
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
        icon={<LuCalendar />}
        readOnly={readOnly}
      />
      <TextField
        name="phone"
        label="Phone"
        type="tel"
        placeholder="+234 803 555 0198"
        readOnly={readOnly}
      />
      <TextField
        name="homeAddress"
        label="Home address"
        placeholder="12 Akin Adesola St, Victoria Island, Lagos"
        readOnly={readOnly}
      />
      <div className={`${styles.field} ${styles.wide}`}>
        <SegmentedControl
          label="Is this person an executive?"
          options={EXECUTIVE_OPTIONS}
          value={[values.isExecutive ? 'yes' : 'no']}
          disabled={readOnly}
          onChange={([choice]) =>
            setFieldValue('isExecutive', choice === 'yes')
          }
        />
        <p className={styles.hint}>
          Executives don&apos;t get AI advice on weekly reports.
        </p>
      </div>
      {mode === 'create' && (
        <div className={`${styles.inviteBox} ${styles.wide}`}>
          <CheckBox
            name="sendInvite"
            label="Send an invite email"
            checked={values.sendInvite}
            onChange={(event) =>
              setFieldValue('sendInvite', event.target.checked)
            }
          />
          <p className={styles.hint}>
            {`${firstNameOf(
              values.fullName,
            )} gets an email from ${companyName}, sent as ${senderName}, to accept and see their contracts, pay and first-week tasks.`}
          </p>
        </div>
      )}
    </div>
  )
}
