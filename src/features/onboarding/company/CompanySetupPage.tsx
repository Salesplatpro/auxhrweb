import { FormikProvider, useFormik } from 'formik'
import React, { useRef, useState } from 'react'
import {
  LuArrowLeft,
  LuArrowRight,
  LuBriefcase,
  LuShieldCheck,
  LuSparkle,
  LuUsers,
} from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import { ValidationSchemaProvider } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { TipCard } from '@/components/ui/TipCard'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'
import {
  COMPANY_STEP_FIELDS,
  CompanyField,
  CompanyFormValues,
  CompanyPreviewCard,
  ContactFields,
  createCompanySchema,
  fieldForServerError,
  IdentityFields,
  PresenceFields,
  stepForField,
  toCreatePayload,
} from '@/features/organizations/companyForm'
import { MAX_COMPANY_TEAMMATES } from '@/features/organizations/constants/team'
import { useCreateOrganization } from '@/features/organizations/hooks/useCreateOrganization'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { focusFieldByName } from '@/utils/focusField'
import { getErrorFields, getErrorMessage } from '@/utils/getErrorMessage'

import { OnboardingShell } from '../components/OnboardingShell'
import {
  WizardCard,
  WizardIntro,
  WizardLayout,
} from '../components/WizardLayout'
import { ONBOARDING_PATHS } from '../paths'
import { isCompanyDraftEmpty, useCompanyDraft } from './companyDraft'
import styles from './CompanySetupPage.module.scss'
import { useDraftAutosave } from './draftStorage'

const STEPS = [
  {
    title: 'Identity',
    description: 'Name, industry and address',
    cardTitle: 'Company identity',
    cardSubtitle: 'This is how candidates will recognise you.',
  },
  {
    title: 'Contact',
    description: 'Work email and phone',
    cardTitle: 'Contact details',
    cardSubtitle: 'Where candidates and AuxHR can reach your company.',
  },
  {
    title: 'Presence',
    description: 'Website and social links',
    cardTitle: 'Online presence',
    cardSubtitle: 'Help candidates check you out before they apply.',
  },
]

const STEP_FIELD_SECTIONS = [IdentityFields, ContactFields, PresenceFields]

const LAST_STEP = STEPS.length - 1

const FIELD_ORDER = COMPANY_STEP_FIELDS.flat()

export const CompanySetupPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { profile } = useProfile()
  const draft = useCompanyDraft(user?.id)
  const { createOrganization, isCreating } = useCreateOrganization()
  const [step, setStep] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)
  const creating = useRef(false)

  const formik = useFormik<CompanyFormValues>({
    initialValues: draft.initialValues,
    validationSchema: createCompanySchema,
    onSubmit: () => undefined,
  })

  const draftSaved = useDraftAutosave(
    draft.key,
    formik.values,
    draft.cleared,
    isCompanyDraftEmpty,
  )

  const showFieldError = (field: CompanyField) => {
    setStep(stepForField(field))
    window.requestAnimationFrame(() => focusFieldByName(field))
  }

  const touch = (fields: CompanyField[]) =>
    formik.setTouched(
      {
        ...formik.touched,
        ...Object.fromEntries(fields.map((field) => [field, true])),
      },
      false,
    )

  const goNext = async () => {
    const errors = await formik.validateForm()
    const fields = COMPANY_STEP_FIELDS[step]
    await touch(fields)
    const failing = fields.find((field) => errors[field])
    if (failing) {
      focusFieldByName(failing)
      return
    }
    setStep(step + 1)
  }

  const create = async () => {
    if (creating.current) return
    creating.current = true
    setServerError(null)
    const errors = await formik.validateForm()
    await touch(FIELD_ORDER)
    const failing = FIELD_ORDER.find((field) => errors[field])
    if (failing) {
      creating.current = false
      showFieldError(failing)
      return
    }

    try {
      await createOrganization(toCreatePayload(formik.values))
      draft.clear()
      navigate(ONBOARDING_PATHS.companyDone, { replace: true })
    } catch (err) {
      const message = getErrorMessage(
        err,
        'We could not create your company. Please try again.',
      )
      const field = fieldForServerError(message, getErrorFields(err))
      setServerError(message)
      if (field) {
        formik.setFieldError(field, message)
        showFieldError(field)
      }
    } finally {
      creating.current = false
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (step < LAST_STEP) {
      void goNext()
    } else {
      void create()
    }
  }

  const current = STEPS[step]
  const Fields = STEP_FIELD_SECTIONS[step]

  return (
    <OnboardingShell
      status={{
        icon: <LuShieldCheck />,
        label: 'Set up your company · takes about 2 minutes',
      }}
      account={{
        firstName: profile?.firstName ?? user?.firstName,
        lastName: profile?.lastName ?? user?.lastName,
        avatarUrl: profile?.profileImageUrl,
        subtitle: `Recruiter · ${
          profile?.activeOrganization?.name ?? 'No company yet'
        }`,
      }}>
      <FormikProvider value={formik}>
        <ValidationSchemaProvider schema={createCompanySchema}>
          <WizardLayout
            intro={
              <WizardIntro
                eyebrow="New workspace"
                title="Tell us about your company"
                lead="Jobs are posted under your company, and candidates see it on every role."
                steps={STEPS}
                current={step}
                tip={{
                  icon: <LuSparkle />,
                  title: 'Why we ask',
                  body: 'A complete company profile gets more applicants. You can add your logo after creating the company.',
                }}
              />
            }
            previewLabel="How it will look"
            preview={
              <>
                <CompanyPreviewCard values={formik.values} status="pending" />
                <TipCard variant="glass" title="What happens next">
                  <ul className={styles.next}>
                    <li>
                      <LuShieldCheck aria-hidden />
                      AuxHR reviews new companies, usually within a day.
                    </li>
                    <li>
                      <LuUsers aria-hidden />
                      Invite up to {MAX_COMPANY_TEAMMATES} recruiters with an
                      access code.
                    </li>
                    <li>
                      <LuBriefcase aria-hidden />
                      Post your first job and let AI screen applicants.
                    </li>
                  </ul>
                </TipCard>
              </>
            }>
            <form noValidate onSubmit={handleSubmit}>
              <WizardCard
                step={step + 1}
                total={STEPS.length}
                title={current.cardTitle}
                subtitle={current.cardSubtitle}
                draftSaved={draftSaved}
                footer={
                  <>
                    {step === 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xl"
                        pill
                        onClick={() =>
                          navigate(dashboardPathForRole(user?.userRole))
                        }>
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xl"
                        pill
                        icon={<LuArrowLeft />}
                        disabled={isCreating}
                        onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="ink"
                      size="xl"
                      pill
                      loading={isCreating}
                      iconEnd={<LuArrowRight />}>
                      {step === LAST_STEP ? 'Create company' : 'Continue'}
                    </Button>
                  </>
                }>
                {serverError && <Alert variant="error">{serverError}</Alert>}
                <Fields mode="create" />
              </WizardCard>
            </form>
          </WizardLayout>
        </ValidationSchemaProvider>
      </FormikProvider>
    </OnboardingShell>
  )
}

export default CompanySetupPage
