import React from 'react'

import { workModeNeedsLocation } from '@/components/features/jobs/WorkTypeCheckboxes'
import { FieldLabel } from '@/components/forms/FieldLabel'
import {
  EMPTY_LOCATION,
  LocationSelect,
} from '@/components/forms/LocationSelect'
import { RoleSelect } from '@/components/forms/Roles/RoleSelect'
import {
  COMPENSATION_PERIOD_OPTIONS,
  CURRENCY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  Select,
} from '@/components/forms/Select'
import { TagInput } from '@/components/forms/TagInput/TagInput'
import TextField from '@/components/forms/TextField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Switch } from '@/components/ui/Switch'
import { PostJobFormValues } from '@/utils/jobPostTypes'

import { AiFieldActions } from './AiAssist/AiFieldActions'
import { SuggestionChips } from './AiAssist/SuggestionChips'
import { JobAiContext } from './AiAssist/useJobFieldAssist'
import styles from './PostJob.module.scss'
import { SalaryComparison } from './SalaryComparison/SalaryComparison'
import { htmlToPlainText } from './utils/aiText'
import { useRoleName } from './utils/useRoleName'

const WORK_MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onSite', label: 'On-site' },
]

const Section = ({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) => (
  <section className={styles.formSection}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    <p className={styles.sectionNote}>{note}</p>
    {children}
  </section>
)

type FormikErrorsLike = Partial<Record<keyof PostJobFormValues, unknown>> & {
  location?: { country?: { name?: string } }
}
type FormikTouchedLike = Partial<Record<keyof PostJobFormValues, unknown>> & {
  location?: { country?: unknown }
}

type JobDetailsFieldsProps = {
  values: PostJobFormValues
  errors: FormikErrorsLike
  touched: FormikTouchedLike
  setFieldValue: (key: keyof PostJobFormValues, value: unknown) => void
  roleDisabled?: boolean
  /** The saved job being edited, left out of the salary comparison. */
  jobId?: string
}

export const JobDetailsFields = ({
  values,
  errors,
  touched,
  setFieldValue,
  roleDisabled,
  jobId,
}: JobDetailsFieldsProps) => {
  const roleName = useRoleName(values.role)
  const aiContext: JobAiContext = {
    role: roleName,
    experienceLevel: values.experienceLevel,
    jobBrief: htmlToPlainText(values.jobBrief ?? ''),
    requirements: htmlToPlainText(values.requirements ?? ''),
    skills: values.skills,
    goals: values.goals,
  }

  const fieldError = (key: keyof PostJobFormValues) =>
    touched[key] && typeof errors[key] === 'string'
      ? (errors[key] as string)
      : undefined

  return (
    <>
      <Section title="Role overview" note="The basics candidates read first.">
        <div className={styles.grid2}>
          <RoleSelect
            label="Role"
            required
            name="role"
            value={values.role}
            onChange={(value) => setFieldValue('role', value)}
            creatable={!roleDisabled}
            disabled={roleDisabled}
            error={fieldError('role')}
          />
          <Select
            name="experienceLevel"
            label="Experience level"
            required
            options={EXPERIENCE_LEVEL_OPTIONS}
            value={values.experienceLevel}
            onChange={(value) => setFieldValue('experienceLevel', value)}
            placeholder="Select experience level"
            error={fieldError('experienceLevel')}
          />
        </div>

        <div className={styles.grid3}>
          <TextField
            label="Department (optional)"
            name="department"
            placeholder="e.g. Design"
          />
          <Select
            name="employmentType"
            label="Job type"
            options={EMPLOYMENT_TYPE_OPTIONS}
            value={values.employmentType}
            onChange={(value) => setFieldValue('employmentType', value)}
            error={fieldError('employmentType')}
          />
          <TextField
            label="Closing date (optional)"
            name="closesAt"
            type="date"
          />
        </div>

        <div className={styles.fieldGroup}>
          <AiFieldActions
            field="jobBrief"
            value={values.jobBrief}
            job={aiContext}
            onApply={(html) => setFieldValue('jobBrief', html)}
            writeLabel="Write the brief with AI"
          />
          <TextField
            label="Job brief"
            name="jobBrief"
            placeholder="Describe the role in up to 600 words"
            type="textarea"
            MAX_WORDS={600}
          />
        </div>
      </Section>

      <Section
        title="Requirements"
        note="What candidates need to bring. CV match and tailored questions use this.">
        <div className={styles.fieldGroup}>
          <AiFieldActions
            field="requirements"
            value={values.requirements}
            job={aiContext}
            onApply={(html) => setFieldValue('requirements', html)}
            writeLabel="Write requirements with AI"
          />
          <TextField
            label="Job requirements"
            name="requirements"
            placeholder="List the qualifications and skills needed"
            type="textarea"
          />
        </div>
      </Section>

      <Section title="Work & location" note="Where the work happens.">
        <div className={styles.workRow}>
          <div className={styles.workMode}>
            <FieldLabel htmlFor="workMode" className={styles.label}>
              Work mode
            </FieldLabel>
            <SegmentedControl
              label="Work mode"
              multiple
              options={WORK_MODE_OPTIONS}
              value={values.workMode}
              onChange={(value) => {
                setFieldValue('workMode', value)
                if (!workModeNeedsLocation(value as typeof values.workMode)) {
                  setFieldValue('location', { ...EMPTY_LOCATION })
                }
              }}
            />
            {fieldError('workMode') && (
              <div className={styles.errorText} role="alert">
                {fieldError('workMode')}
              </div>
            )}
          </div>
          {workModeNeedsLocation(values.workMode) && (
            <div className={styles.location}>
              <LocationSelect
                value={values.location}
                onChange={(location) => setFieldValue('location', location)}
                stateLabel="State"
                cityLabel="City"
                countryRequired
                errors={{
                  country:
                    touched.location?.country &&
                    typeof errors.location?.country?.name === 'string'
                      ? errors.location?.country?.name
                      : undefined,
                }}
              />
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Compensation"
        note="What this role pays. Candidates see the range.">
        <div className={styles.grid4}>
          <Select
            name="currency"
            label="Currency"
            required
            options={CURRENCY_OPTIONS}
            value={values.currency}
            onChange={(value) => setFieldValue('currency', value)}
            placeholder="Select currency"
            error={fieldError('currency')}
          />
          <TextField label="Min salary" name="minSalary" placeholder="300000" />
          <TextField
            label="Max salary (optional)"
            name="maxSalary"
            placeholder="380000"
          />
          <Select
            name="compensationPeriod"
            label="Period"
            required
            options={COMPENSATION_PERIOD_OPTIONS}
            value={values.compensationPeriod}
            onChange={(value) => setFieldValue('compensationPeriod', value)}
            placeholder="Select period"
            error={fieldError('compensationPeriod')}
          />
        </div>

        <SalaryComparison values={values} roleName={roleName} jobId={jobId} />

        <div className={styles.switchRow}>
          <div>
            <p className={styles.switchTitle}>Offers share options</p>
            <p className={styles.sectionNote}>
              Mentioned on the job post for candidates to see.
            </p>
          </div>
          <Switch
            label="Offers share options"
            hideLabel
            checked={values.shareOptions}
            onChange={(checked) => setFieldValue('shareOptions', checked)}
          />
        </div>
      </Section>

      <Section
        title="Skills & goals"
        note="Used by AI to match and screen candidates.">
        <div className={styles.fieldGroup}>
          <TagInput
            name="skills"
            label="Required skills"
            required
            addLabel="Add skill"
            value={values.skills}
            onChange={(tags) => setFieldValue('skills', tags)}
            placeholder="Type a skill"
            maxLength={250}
            error={fieldError('skills')}
          />
          <SuggestionChips
            field="skills"
            current={values.skills}
            job={aiContext}
            onAdd={(items) =>
              setFieldValue('skills', [...values.skills, ...items])
            }
          />
        </div>

        <div className={styles.fieldGroup}>
          <TagInput
            name="goals"
            label="Top goals"
            required
            addLabel="Add goal"
            value={values.goals}
            onChange={(tags) => setFieldValue('goals', tags)}
            placeholder="Type a goal"
            maxLength={250}
            error={fieldError('goals')}
          />
          <SuggestionChips
            field="goals"
            current={values.goals}
            job={aiContext}
            onAdd={(items) =>
              setFieldValue('goals', [...values.goals, ...items])
            }
          />
        </div>
      </Section>
    </>
  )
}
