import { Alert } from '@mui/material'
import { Field, Form, FormikProps, useFormikContext } from 'formik'
import React, { useEffect, useRef } from 'react'

import { WorkTypeCheckboxes } from '@/components/features/jobs/WorkTypeCheckboxes'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { LocationSelect } from '@/components/forms/LocationSelect'
import { RoleMultiSelect } from '@/components/forms/Roles/RoleMultiSelect'
import {
  COMPENSATION_PERIOD_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PROFILE_CURRENCY_OPTIONS,
  Select,
} from '@/components/forms/Select'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { CvFile } from '@/components/ui/CvFile'
import { Spinner } from '@/components/ui/Spinner'
import { ProfileFormValues } from '@/features/profile/types'
import { getIncompleteProfileFields } from '@/utils/calculateProgress'
import { focusFieldByName } from '@/utils/focusField'

import BioTextArea from './BioTextArea'
import styles from './Profile.module.scss'
import TalentProfileHeader from './ProfileHeader'
import { validationSchema } from './ProileValidationSchema'
import UploadCV from './UploadCV'
import { useProfileForm } from './useProfileForm'

type TalentProfileProps = {
  formikRef?: React.Ref<FormikProps<ProfileFormValues>>
}

const FocusFirstIncompleteField = ({ hasCv }: { hasCv: boolean }) => {
  const { values } = useFormikContext<ProfileFormValues>()
  const didFocus = useRef(false)

  useEffect(() => {
    if (didFocus.current) return
    const first = getIncompleteProfileFields(values, hasCv)[0]
    if (!first) return
    didFocus.current = true
    const frame = window.requestAnimationFrame(() => {
      focusFieldByName(first.name)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hasCv, values])

  return null
}

const TalentProfile = ({ formikRef }: TalentProfileProps) => {
  const {
    profile,
    isLoading,
    error,
    isUpdating,
    isUploading,
    progress,
    cvFileName,
    formProgress,
    initialValues,
    updateFormProgress,
    handleSubmit,
    handleCvChange,
  } = useProfileForm()

  if (isLoading) return <Spinner fullPage />

  if (error) {
    return <Alert severity="error">Error fetching user profile info</Alert>
  }

  return (
    <PageShell>
      <TalentProfileHeader profile={profile} progress={formProgress} />

      <PagePanel>
        <ValidatedForm
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize>
          {({
            values,
            errors,
            touched,
            dirty,
            isSubmitting,
            setFieldValue,
            status,
          }) => {
            useEffect(() => {
              updateFormProgress(values)
            }, [values])

            const hasCv = !!(profile?.cvFileName || profile?.cvUploadedAt)
            const fieldError = (name: keyof ProfileFormValues) => {
              const error = errors[name]
              const isTouched = touched[name]
              return isTouched && typeof error === 'string' ? error : undefined
            }

            return (
              <Form noValidate data-tour="profile-form">
                <FormikFocusOnError />
                <FocusFirstIncompleteField hasCv={hasCv} />
                <div className={styles.fieldGroup} data-tour="profile-bio">
                  <label className={styles.label} htmlFor="bio">
                    Bio
                  </label>
                  <BioTextArea />
                  {errors.bio && touched.bio && (
                    <div
                      id="bio-error"
                      className={styles.errorText}
                      role="alert">
                      {errors.bio}
                    </div>
                  )}
                </div>

                <div className={`${styles.row} ${styles.rowLarge}`}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      readOnly
                      value={`${profile?.firstName || ''} ${
                        profile?.lastName || ''
                      }`}
                      className={styles.readonlyInput}
                    />
                  </div>
                  <div className={styles.field} data-tour="profile-role">
                    <div className={styles.labelRow}>
                      <span className={styles.label}>Role</span>
                      {profile?.roleChangeCount !== undefined && (
                        <span className={styles.roleChangeHint}>
                          {profile.roleChangeCount}/3 changes left
                        </span>
                      )}
                    </div>
                    <RoleMultiSelect
                      name="role"
                      value={values.role}
                      creatable
                      onChange={(value) => setFieldValue('role', value)}
                      error={fieldError('role')}
                    />
                    <p className={styles.hint}>
                      Can&apos;t find your role? Type it and press Enter.
                    </p>
                  </div>
                </div>

                <div data-tour="profile-fit">
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <Select
                        name="experience"
                        label="Experience Level"
                        options={EXPERIENCE_LEVEL_OPTIONS}
                        value={values.experience}
                        onChange={(value) => setFieldValue('experience', value)}
                        placeholder="Select experience level"
                        error={fieldError('experience')}
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fullField}>
                      <div className={styles.label}>Work Type</div>
                      <WorkTypeCheckboxes
                        name="workType"
                        value={values.workType}
                        onChange={(value) => setFieldValue('workType', value)}
                        error={
                          touched.workType &&
                          typeof errors.workType === 'string'
                            ? errors.workType
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fullField}>
                      <LocationSelect
                        value={values.location}
                        onChange={(location) =>
                          setFieldValue('location', location)
                        }
                        stateLabel="State/Province (Optional)"
                        cityLabel="Region/City (Optional)"
                        countryRequired
                        errors={{
                          country:
                            touched.location?.country &&
                            typeof errors.location?.country?.name === 'string'
                              ? errors.location.country.name
                              : undefined,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`${styles.row} ${styles.salaryRow}`}
                  data-tour="profile-salary">
                  <div className={styles.salaryField}>
                    <Select
                      name="currency"
                      label="Currency"
                      options={PROFILE_CURRENCY_OPTIONS}
                      value={values.currency}
                      onChange={(value) => setFieldValue('currency', value)}
                      placeholder="Select currency"
                      error={fieldError('currency')}
                    />
                  </div>
                  <div className={styles.salaryField}>
                    <label className={styles.label} htmlFor="minSalary">
                      Min Salary
                    </label>
                    <Field
                      type="text"
                      id="minSalary"
                      name="minSalary"
                      placeholder="Your minimum salary"
                      inputMode="numeric"
                      aria-invalid={
                        errors.minSalary && touched.minSalary ? true : undefined
                      }
                      className={
                        errors.minSalary && touched.minSalary
                          ? `${styles.input} ${styles.inputInvalid}`
                          : styles.input
                      }
                    />
                    {errors.minSalary && touched.minSalary && (
                      <div
                        id="minSalary-error"
                        className={styles.errorText}
                        role="alert">
                        {errors.minSalary}
                      </div>
                    )}
                  </div>
                  <div className={styles.salaryField}>
                    <label className={styles.label} htmlFor="maxSalary">
                      Max Salary
                    </label>
                    <Field
                      type="text"
                      id="maxSalary"
                      name="maxSalary"
                      placeholder="Your maximum salary"
                      inputMode="numeric"
                      aria-invalid={
                        errors.maxSalary && touched.maxSalary ? true : undefined
                      }
                      className={
                        errors.maxSalary && touched.maxSalary
                          ? `${styles.input} ${styles.inputInvalid}`
                          : styles.input
                      }
                    />
                    {errors.maxSalary && touched.maxSalary && (
                      <div
                        id="maxSalary-error"
                        className={styles.errorText}
                        role="alert">
                        {errors.maxSalary}
                      </div>
                    )}
                  </div>
                  <div className={styles.salaryField}>
                    <Select
                      name="compensationPeriod"
                      label="Compensation Period"
                      options={COMPENSATION_PERIOD_OPTIONS}
                      value={values.compensationPeriod}
                      onChange={(value) =>
                        setFieldValue('compensationPeriod', value)
                      }
                      placeholder="Select period"
                      error={fieldError('compensationPeriod')}
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div
                    className={styles.fullField}
                    data-field="cv"
                    data-tour="profile-cv"
                    id="cv-field"
                    tabIndex={-1}>
                    <label className={styles.label} htmlFor="cv">
                      {profile?.cvFileName || profile?.cvUploadedAt
                        ? 'CV / Resume'
                        : 'Upload CV'}
                    </label>
                    <p className={styles.hint}>
                      We extract the text from your PDF or DOCX for matching,
                      and store the original file securely so you and recruiters
                      can view it.
                    </p>
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf,.docx"
                      className={styles.fileInput}
                      disabled={isUploading}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0]
                        if (file) handleCvChange(file)
                        event.target.value = ''
                      }}
                    />
                    {(profile?.cvFileName || profile?.cvUploadedAt) &&
                    !isUploading ? (
                      <CvFile
                        fileName={profile.cvFileName || 'CV'}
                        url={profile.cvUrl ?? undefined}
                        replaceInputId="cv"
                      />
                    ) : (
                      <label htmlFor="cv" className={styles.fileInputWrapper}>
                        <UploadCV
                          fileName={isUploading ? cvFileName : null}
                          progress={progress}
                        />
                      </label>
                    )}
                    {typeof status?.cv === 'string' && (
                      <div
                        id="cv-error"
                        className={styles.errorText}
                        role="alert">
                        {status.cv}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!dirty || isSubmitting || isUpdating}
                    loading={isSubmitting || isUpdating}>
                    Save
                  </Button>
                </div>
              </Form>
            )
          }}
        </ValidatedForm>
      </PagePanel>
    </PageShell>
  )
}

export default TalentProfile
