import { FormikErrors, FormikProps } from 'formik'
import React, { useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { ProfileFormValues } from '@/features/profile/types'
import TalentProfile from '@/pages/TalentProfile/Profile'
import { getProfileCompletionErrors } from '@/utils/calculateProgress'
import { focusFieldByName, focusFirstInvalidField } from '@/utils/focusField'
import { notify } from '@/utils/toastNotifications'

import styles from './ProfileCompletionForm.module.scss'

export const PROFILE_INCOMPLETE_MESSAGE =
  'Complete your profile to continue. Include bio, role, CV, work type, location, experience, and min/max salary.'

const COMPLETION_TOUCH_PATHS = [
  'bio',
  'role',
  'experience',
  'workType',
  'location.country.name',
  'minSalary',
  'maxSalary',
] as const

const markCompletionFieldsTouched = async (
  form: FormikProps<ProfileFormValues>,
) => {
  await Promise.all(
    COMPLETION_TOUCH_PATHS.map((path) =>
      form.setFieldTouched(path, true, false),
    ),
  )
}

const mergeErrors = (
  yupErrors: FormikErrors<ProfileFormValues>,
  completionErrors: FormikErrors<ProfileFormValues>,
): FormikErrors<ProfileFormValues> => {
  const merged: FormikErrors<ProfileFormValues> = {
    ...completionErrors,
    ...yupErrors,
  }
  if (completionErrors.location || yupErrors.location) {
    merged.location = {
      ...(completionErrors.location as object),
      ...(yupErrors.location as object),
    } as FormikErrors<ProfileFormValues>['location']
  }
  return merged
}

interface ProfileCompletionFormProps {
  /** Runs once the profile is saved and the server reports it complete. */
  onComplete: () => void | Promise<void>
  continueLabel?: string
}

export const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({
  onComplete,
  continueLabel = 'Continue',
}) => {
  const { profile, mutate } = useProfile()
  const [isChecking, setIsChecking] = useState(false)
  const formikRef = useRef<FormikProps<ProfileFormValues>>(null)

  const handleContinue = async () => {
    setIsChecking(true)
    try {
      const form = formikRef.current
      if (form) {
        const yupErrors = await form.validateForm()
        const hasCv = !!(profile?.cvFileName || profile?.cvUploadedAt)
        const completion = getProfileCompletionErrors(form.values, hasCv)
        const merged = mergeErrors(yupErrors, completion.errors)
        const hasFieldErrors = Object.keys(merged).length > 0
        const incomplete = hasFieldErrors || !!completion.cv

        if (incomplete) {
          await markCompletionFieldsTouched(form)
          form.setErrors(merged)
          form.setStatus(completion.cv ? { cv: completion.cv } : undefined)
          const focused = focusFirstInvalidField(merged)
          if (!focused && completion.cv) {
            focusFieldByName('cv')
          }
          notify('info', PROFILE_INCOMPLETE_MESSAGE, { autoClose: 4000 })
          return
        }

        form.setStatus(undefined)
        await form.submitForm()
      }

      const refreshed = await mutate()
      const completion = refreshed?.data?.user?.profileCompletion
      if (completion && !completion.isProfileComplete) {
        notify('info', PROFILE_INCOMPLETE_MESSAGE, { autoClose: 4000 })
        return
      }

      await onComplete()
    } catch (error) {
      if (error instanceof Error && error.message === 'Profile update failed') {
        return
      }
      notify('info', PROFILE_INCOMPLETE_MESSAGE, { autoClose: 4000 })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className={styles.page}>
      <TalentProfile formikRef={formikRef} />
      <div className={styles.continueBar}>
        <Button onClick={() => void handleContinue()} loading={isChecking}>
          {continueLabel}
        </Button>
      </div>
    </div>
  )
}
