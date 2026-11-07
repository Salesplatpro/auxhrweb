import React from 'react'

import {
  workModeNeedsLocation,
  WorkTypeCheckboxes,
} from '@/components/features/jobs/WorkTypeCheckboxes'
import { FieldLabel } from '@/components/forms/FieldLabel'
import {
  EMPTY_LOCATION,
  LocationSelect,
} from '@/components/forms/LocationSelect'
import { RoleSelect } from '@/components/forms/Roles/RoleSelect'
import {
  COMPENSATION_PERIOD_OPTIONS,
  CURRENCY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  Select,
} from '@/components/forms/Select'
import { TagInput } from '@/components/forms/TagInput/TagInput'
import TextField from '@/components/forms/TextField'
import { PostJobFormValues } from '@/utils/jobPostTypes'

import { AiFieldActions } from './AiAssist/AiFieldActions'
import { SuggestionChips } from './AiAssist/SuggestionChips'
import { JobAiContext } from './AiAssist/useJobFieldAssist'
import styles from './PostJob.module.scss'
import { SalaryComparison } from './SalaryComparison'
import { htmlToPlainText } from './utils/aiText'
import { useRoleName } from './utils/useRoleName'

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

  return (
    <>
      {/* Section 1: Job Overview */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Role overview</h3>
        <p className={styles.sectionNote}>
          Start with the role. The AI buttons above each box can write or
          improve the text for you — you can edit everything afterwards.
        </p>
        <div className={styles.fieldGroup}>
          <RoleSelect
            label="Role"
            required
            name="role"
            value={values.role}
            onChange={(value) => setFieldValue('role', value)}
            creatable={!roleDisabled}
            disabled={roleDisabled}
            error={
              touched.role && typeof errors.role === 'string'
                ? (errors.role as string)
                : undefined
            }
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
            label="Job Brief"
            name="jobBrief"
            placeholder="Describe the role in up to 600 words"
            type="textarea"
            MAX_WORDS={600}
            tooltip="What the candidate reads first. Be specific about the work, team, and outcomes — this also drives AI screening questions and CV matching."
          />
        </div>
      </section>

      {/* Section 2: Requirements */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Requirements</h3>

        <div className={styles.fieldGroup}>
          <AiFieldActions
            field="requirements"
            value={values.requirements}
            job={aiContext}
            onApply={(html) => setFieldValue('requirements', html)}
            writeLabel="Write requirements with AI"
          />
          <TextField
            label="Job Requirements"
            name="requirements"
            placeholder="List the qualifications and skills needed"
            type="textarea"
            tooltip="Must-haves and nice-to-haves. CV match and personalized questions are grounded in this text."
          />
        </div>

        <div className={styles.fieldGroup}>
          <Select
            name="experienceLevel"
            label="Experience Level"
            required
            options={EXPERIENCE_LEVEL_OPTIONS}
            value={values.experienceLevel}
            onChange={(value) => setFieldValue('experienceLevel', value)}
            placeholder="Select experience level"
            error={
              touched.experienceLevel &&
              typeof errors.experienceLevel === 'string'
                ? (errors.experienceLevel as string)
                : undefined
            }
          />
        </div>
      </section>

      {/* Section 3: Work & Location */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Work &amp; Location</h3>

        <div className={styles.fieldGroup}>
          <FieldLabel htmlFor="workMode" className={styles.label}>
            Work Mode
          </FieldLabel>
          <WorkTypeCheckboxes
            name="workMode"
            value={values.workMode}
            onChange={(value) => {
              setFieldValue('workMode', value)
              if (!workModeNeedsLocation(value)) {
                setFieldValue('location', { ...EMPTY_LOCATION })
              }
            }}
            error={
              touched.workMode && typeof errors.workMode === 'string'
                ? (errors.workMode as string)
                : undefined
            }
          />
        </div>

        {workModeNeedsLocation(values.workMode) && (
          <>
            <p className={styles.sectionNote}>
              Only Country is required — State/Province and Region/City are
              optional.
            </p>
            <div className={styles.fieldGroup}>
              <LocationSelect
                value={values.location}
                onChange={(location) => setFieldValue('location', location)}
                stateLabel="State/Province (Optional)"
                cityLabel="Region/City (Optional)"
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
          </>
        )}
      </section>

      {/* Section 4: Compensation */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Compensation</h3>

        <div className={styles.compensationRow}>
          <div className={styles.compensationFieldThird}>
            <Select
              name="currency"
              label="Currency"
              required
              options={CURRENCY_OPTIONS}
              value={values.currency}
              onChange={(value) => setFieldValue('currency', value)}
              placeholder="Select currency"
              error={
                Boolean(touched.currency) && typeof errors.currency === 'string'
                  ? (errors.currency as string)
                  : undefined
              }
            />
          </div>

          <div className={styles.compensationFieldThird}>
            <TextField
              label="Min Salary"
              name="minSalary"
              placeholder="e.g. 300000"
              tooltip="Lowest compensation you will offer in the selected currency and period. Shown to candidates on the job post."
            />
          </div>

          <div className={styles.compensationFieldThird}>
            <TextField
              label="Max Salary"
              name="maxSalary"
              placeholder="e.g. 600000"
              tooltip="Optional upper bound. Leave blank if you prefer not to publish a range ceiling."
            />
          </div>

          <div className={styles.compensationFieldThird}>
            <Select
              name="compensationPeriod"
              label="Compensation Period"
              required
              options={COMPENSATION_PERIOD_OPTIONS}
              value={values.compensationPeriod}
              onChange={(value) => setFieldValue('compensationPeriod', value)}
              placeholder="Select period"
              error={
                Boolean(touched.compensationPeriod) &&
                typeof errors.compensationPeriod === 'string'
                  ? (errors.compensationPeriod as string)
                  : undefined
              }
            />
          </div>
        </div>
        <SalaryComparison
          roleId={values.role}
          experienceLevel={values.experienceLevel}
          currency={values.currency}
          compensationPeriod={values.compensationPeriod}
          locationCountry={values.location?.country?.name}
          locationState={values.location?.state?.name}
          locationCity={values.location?.city?.name}
          excludeJobId={jobId}
        />
      </section>

      {/* Section 5: Goals & Skills */}
      <section className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Goals &amp; Skills</h3>

        <div className={styles.fieldGroup}>
          <TagInput
            name="skills"
            label="Required Skills"
            required
            value={values.skills}
            onChange={(tags) => setFieldValue('skills', tags)}
            placeholder="Type a skill and press Enter"
            maxLength={250}
            error={
              touched.skills && typeof errors.skills === 'string'
                ? (errors.skills as string)
                : undefined
            }
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
            label="Top Goals"
            required
            value={values.goals}
            onChange={(tags) => setFieldValue('goals', tags)}
            placeholder="Type a goal and press Enter"
            maxLength={250}
            error={
              touched.goals && typeof errors.goals === 'string'
                ? (errors.goals as string)
                : undefined
            }
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
      </section>
    </>
  )
}
