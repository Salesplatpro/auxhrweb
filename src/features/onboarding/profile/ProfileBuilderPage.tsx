import { FormikProvider, getIn, useFormik } from 'formik'
import React, { useRef, useState } from 'react'
import {
  LuArrowLeft,
  LuArrowRight,
  LuBuilding2,
  LuGlobe,
  LuRefreshCw,
  LuSparkle,
  LuUser,
} from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import { TextArea, TextInput } from '@/components/forms'
import { LocationSelect } from '@/components/forms/LocationSelect'
import { RoleMultiSelect } from '@/components/forms/Roles/RoleMultiSelect'
import {
  EXPERIENCE_LEVEL_OPTIONS,
  PROFILE_CURRENCY_OPTIONS,
  Select,
} from '@/components/forms/Select'
import { ValidationSchemaProvider } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile'
import { useUploadCv } from '@/features/profile/hooks/useUploadCv'
import { ProfileUser } from '@/features/profile/types'
import { useGetRoleQuery } from '@/redux/api/talent'
import { getIncompleteProfileFields } from '@/utils/calculateProgress'
import { focusFieldByName } from '@/utils/focusField'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { Role } from '@/utils/types'

import { OnboardingShell } from '../components/OnboardingShell'
import {
  WizardCard,
  WizardIntro,
  WizardLayout,
} from '../components/WizardLayout'
import { OnboardingDoneState } from '../done/OnboardingDoneState'
import { ONBOARDING_PATHS } from '../paths'
import { CvField } from './CvField'
import {
  BIO_MAX_LENGTH,
  buildBuilderBaseline,
  buildBuilderValues,
  buildProfilePatch,
  cvFileError,
  formatSalaryRange,
  PROFILE_STEP_FIELDS,
  profileBuilderSchema,
  ProfileBuilderValues,
  ROLE_LIMIT,
  roleCapFor,
  rolesLocked,
  stepForCompletionField,
} from './profileBuilder'
import styles from './ProfileBuilderPage.module.scss'
import { TalentPreviewCard } from './TalentPreviewCard'

const TALENT_HOME = '/talentDashboard'

const STEPS = [
  {
    title: 'About you',
    description: 'Name, bio, roles and experience',
    cardTitle: 'About you',
    cardSubtitle: 'Tell recruiters who you are in a few lines.',
  },
  {
    title: 'Location, pay & CV',
    description: 'Where you work, what you earn, your CV',
    cardTitle: 'Location, pay & CV',
    cardSubtitle: 'Recruiters filter by these, so be accurate.',
  },
]

const WORK_TYPE_OPTIONS = [
  { value: 'remote', label: 'Remote', icon: <LuGlobe /> },
  { value: 'hybrid', label: 'Hybrid', icon: <LuRefreshCw /> },
  { value: 'onSite', label: 'On-site', icon: <LuBuilding2 /> },
]

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const withCommas = (value: string) =>
  value ? Number(value).toLocaleString('en') : ''

const fieldAnchor = (field: string) =>
  field === 'location' ? 'location.country' : field

const useRoleNames = (ids: string[]) => {
  const { data } = useGetRoleQuery({})
  const roles: Role[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.roles)
    ? data.data.roles
    : []
  return ids
    .map((id) => roles.find((role) => String(role.id) === id)?.name)
    .filter(Boolean) as string[]
}

const ProfileBuilder = ({ profile }: { profile: ProfileUser }) => {
  const navigate = useNavigate()
  const { mutate } = useProfile()
  const { saveProfile } = useUpdateProfile()
  const { uploadCv, isUploading, progress } = useUploadCv()
  const [step, setStep] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [cvName, setCvName] = useState<string | null>(
    profile.cvFileName ?? (profile.cvUrl ? 'Your CV' : null),
  )
  const [cvError, setCvError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saving = useRef(false)
  const baseline = useRef(buildBuilderBaseline(profile))
  const roleCap = useRef(roleCapFor(baseline.current.role.length)).current
  const locked = rolesLocked(profile)

  const formik = useFormik<ProfileBuilderValues>({
    initialValues: buildBuilderValues(profile),
    validationSchema: profileBuilderSchema,
    onSubmit: () => undefined,
  })
  const { values } = formik
  const roleNames = useRoleNames(values.role)

  const fieldError = (field: string) =>
    getIn(formik.touched, field) &&
    typeof getIn(formik.errors, field) === 'string'
      ? (getIn(formik.errors, field) as string)
      : undefined

  const validateStep = async (index: number) => {
    const errors = await formik.validateForm()
    const fields = PROFILE_STEP_FIELDS[index]
    await formik.setTouched(
      {
        ...formik.touched,
        ...Object.fromEntries(
          fields.map((field) => [
            field,
            field === 'location' ? { country: { name: true } } : true,
          ]),
        ),
      },
      false,
    )
    const failing = fields.find((field) => getIn(errors, field))
    if (failing) {
      focusFieldByName(fieldAnchor(failing))
      return false
    }
    return true
  }

  const save = async () => {
    const patch = buildProfilePatch(baseline.current, values)
    if (Object.keys(patch).length === 0) {
      const fresh = await mutate()
      return fresh?.data?.user
    }
    const user = await saveProfile(patch)
    baseline.current = { ...values }
    return user
  }

  const run = async (task: () => Promise<void>) => {
    if (saving.current) return
    saving.current = true
    setIsSaving(true)
    setSaveError(null)
    try {
      await task()
    } catch (err) {
      setSaveError(
        getErrorMessage(err, 'We could not save your profile. Try again.'),
      )
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  const continueStep = () =>
    run(async () => {
      if (!(await validateStep(0))) return
      await save()
      setMissing([])
      setStep(1)
    })

  const finish = () =>
    run(async () => {
      if (isUploading) return
      if (!(await validateStep(1))) return
      if (!cvName) {
        setCvError('Upload your CV to finish.')
        focusFieldByName('cv')
        return
      }
      const user = await save()
      if (user?.profileCompletion?.isProfileComplete) {
        navigate(ONBOARDING_PATHS.profileDone, { replace: true })
        return
      }
      const incomplete = getIncompleteProfileFields(values, !!cvName)
      if (incomplete.length > 0) {
        setMissing(incomplete.map((field) => field.message))
        setStep(stepForCompletionField(incomplete[0].name))
        return
      }
      setSaveError(
        "We saved your profile, but it isn't complete yet. Check each field and try again.",
      )
    })

  const handleCv = async (file: File) => {
    const problem = cvFileError(file)
    if (problem) {
      setCvError(problem)
      return
    }
    const previous = cvName
    setCvError(null)
    setCvName(file.name)
    try {
      await uploadCv(file)
    } catch {
      setCvName(previous)
      setCvError('We could not upload your CV. Try again.')
    }
  }

  const location = [
    values.location.city.name,
    values.location.state.name,
    values.location.country.name,
  ]
    .filter(Boolean)
    .join(', ')
  const workTypes = WORK_TYPE_OPTIONS.filter((option) =>
    values.workType.includes(option.value as never),
  )
    .map((option) => option.label)
    .join(', ')
  const headline = [
    values.experience,
    workTypes,
    values.location.city.name || values.location.state.name,
  ]
    .filter(Boolean)
    .join(' · ')
  const percentage = profile.profileCompletion?.percentage ?? 0
  const period = values.compensationPeriod === 'monthly' ? 'month' : 'year'
  const busy = isSaving || isUploading

  return (
    <OnboardingShell
      account={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.profileImageUrl,
        subtitle: `Talent · Profile ${percentage}%`,
      }}>
      <FormikProvider value={formik}>
        <ValidationSchemaProvider schema={profileBuilderSchema}>
          <WizardLayout
            intro={
              <WizardIntro
                eyebrow="Your profile"
                title="Let's build your profile"
                lead="Fill this once. AuxHR uses it to match you to jobs and pre-fill every application."
                steps={STEPS}
                current={step}
                tip={{
                  icon: <LuSparkle />,
                  title: 'Tip',
                  body: 'Profiles with a CV and salary range get matched more often. Only recruiters you apply to see your pay range.',
                }}
              />
            }
            previewLabel="How recruiters see you"
            preview={
              <TalentPreviewCard
                fullName={values.fullName}
                avatarUrl={profile.profileImageUrl}
                headline={headline}
                percentage={percentage}
                roles={roleNames}
                bio={values.bio}
                location={location}
                salary={formatSalaryRange(
                  values.currency,
                  values.minSalary,
                  values.maxSalary,
                  values.compensationPeriod,
                )}
                cvName={cvName}
              />
            }>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void (step === 0 ? continueStep() : finish())
              }}>
              <WizardCard
                step={step + 1}
                total={STEPS.length}
                title={STEPS[step].cardTitle}
                subtitle={STEPS[step].cardSubtitle}
                footer={
                  step === 0 ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="xl"
                        pill
                        disabled={busy}
                        onClick={() => navigate(TALENT_HOME)}>
                        Finish later
                      </Button>
                      <Button
                        type="submit"
                        variant="ink"
                        size="xl"
                        pill
                        loading={isSaving}
                        iconEnd={<LuArrowRight />}>
                        Continue
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="xl"
                        pill
                        icon={<LuArrowLeft />}
                        disabled={busy}
                        onClick={() => setStep(0)}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="ink"
                        size="xl"
                        pill
                        loading={isSaving}
                        disabled={isUploading}
                        iconEnd={<LuArrowRight />}>
                        Finish profile
                      </Button>
                    </>
                  )
                }>
                {saveError && <Alert variant="error">{saveError}</Alert>}
                {missing.length > 0 && (
                  <Alert variant="warning" title="A few things are missing">
                    <ul className={styles.missing}>
                      {missing.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </Alert>
                )}

                {step === 0 ? (
                  <>
                    <TextInput
                      title="Full name"
                      name="fullName"
                      label="fullName"
                      autoComplete="name"
                      icon={<LuUser />}
                      value={values.fullName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Tunde Bakare"
                    />
                    <TextArea
                      title="Short bio"
                      name="bio"
                      value={values.bio}
                      maxLength={BIO_MAX_LENGTH}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="What you do and what you're great at."
                    />
                    <div className={styles.roles} data-field="role">
                      <div className={styles.rolesHead}>
                        <span className={styles.label}>
                          Roles you want
                          <span className={styles.required} aria-hidden>
                            *
                          </span>
                        </span>
                        <span className={styles.counter}>
                          {values.role.length} of {roleCap}
                        </span>
                      </div>
                      <RoleMultiSelect
                        name="role"
                        value={values.role}
                        disabled={locked}
                        onChange={(next) => {
                          if (next.length > roleCap) return
                          formik.setFieldValue('role', next)
                        }}
                        error={fieldError('role')}
                      />
                      <p className={styles.hint}>
                        {locked
                          ? "You've used all 3 role changes, so your roles are fixed."
                          : `Pick up to ${ROLE_LIMIT} roles. We match you to jobs for these.`}
                      </p>
                    </div>
                    <Select
                      name="experience"
                      label="Experience"
                      options={EXPERIENCE_LEVEL_OPTIONS}
                      value={values.experience}
                      onChange={(value) => {
                        formik.setFieldValue('experience', value)
                        formik.setFieldTouched('experience', true, false)
                      }}
                      placeholder="Select your experience"
                      error={fieldError('experience')}
                    />
                    <div className={styles.group} data-field="workType">
                      <span className={styles.label}>
                        Work type
                        <span className={styles.required} aria-hidden>
                          *
                        </span>
                      </span>
                      <SegmentedControl
                        multiple
                        label="Work type"
                        options={WORK_TYPE_OPTIONS}
                        value={values.workType}
                        onChange={(next) => {
                          formik.setFieldValue('workType', next)
                          formik.setFieldTouched('workType', true, false)
                        }}
                      />
                      {fieldError('workType') && (
                        <p className={styles.error} role="alert">
                          {fieldError('workType')}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <LocationSelect
                      value={values.location}
                      onChange={(next) => {
                        formik.setFieldValue('location', next)
                        formik.setFieldTouched(
                          'location',
                          { country: { name: true } } as never,
                          false,
                        )
                      }}
                      countryRequired
                      errors={{ country: fieldError('location.country.name') }}
                    />
                    <div className={styles.pay}>
                      <Select
                        name="currency"
                        label="Currency"
                        options={PROFILE_CURRENCY_OPTIONS}
                        value={values.currency}
                        onChange={(value) =>
                          formik.setFieldValue('currency', value)
                        }
                        error={fieldError('currency')}
                      />
                      <TextInput
                        title={`Min salary / ${period}`}
                        name="minSalary"
                        label="minSalary"
                        inputMode="numeric"
                        value={withCommas(values.minSalary)}
                        onChange={(event) =>
                          formik.setFieldValue(
                            'minSalary',
                            digitsOnly(event.target.value),
                          )
                        }
                        onBlur={formik.handleBlur}
                        placeholder="6,000,000"
                      />
                      <TextInput
                        title={`Max salary / ${period}`}
                        name="maxSalary"
                        label="maxSalary"
                        inputMode="numeric"
                        value={withCommas(values.maxSalary)}
                        onChange={(event) =>
                          formik.setFieldValue(
                            'maxSalary',
                            digitsOnly(event.target.value),
                          )
                        }
                        onBlur={formik.handleBlur}
                        placeholder="9,000,000"
                      />
                    </div>
                    <CvField
                      fileName={cvName}
                      progress={progress}
                      isUploading={isUploading}
                      error={cvError}
                      onSelect={(file) => void handleCv(file)}
                    />
                  </>
                )}
              </WizardCard>
            </form>
          </WizardLayout>
        </ValidationSchemaProvider>
      </FormikProvider>
    </OnboardingShell>
  )
}

export const ProfileBuilderPage = () => {
  const { profile, isLoading, error, mutate } = useProfile()

  if (!profile) {
    return (
      <OnboardingDoneState
        isLoading={isLoading || !error}
        error={error}
        onRetry={() => void mutate()}
      />
    )
  }

  return <ProfileBuilder profile={profile} />
}

export default ProfileBuilderPage
