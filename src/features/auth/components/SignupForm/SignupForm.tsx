import { Form, useFormikContext } from 'formik'
import React, { useEffect } from 'react'
import { LuArrowRight, LuCircleAlert, LuLock, LuMail } from 'react-icons/lu'
import { Link, useLocation } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import {
  CheckBox,
  FormikFocusOnError,
  PasswordInput,
  PasswordStrength,
  TextInput,
  useFocusFieldOnMount,
} from '@/components/forms'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { loginPathWithNext } from '@/features/auth/utils/dashboardPath'
import { paths } from '@/paths'

import { SignupRole, useSignup } from '../../hooks/useSignup'
import { useAuthStore } from '../../store/useAuthStore'
import { SignUpSchema } from '../../validation/AuthValidationSchema'
import { AuthPrompt } from '../AuthScreen'
import styles from './SignupForm.module.scss'

type SignupFormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  remember: boolean
}

type SignupFormProps = {
  accountType: SignupRole
  onSuccess?: (lastName: string, role: SignupRole) => void
  lockedEmail?: string
  redirectPath?: string
  showLoginLink?: boolean
}

const ROLE_LABEL: Record<SignupRole, string> = {
  recruiter: 'Recruiter',
  talent: 'Talent',
}

const Fields = ({
  accountType,
  lockedEmail,
}: {
  accountType: SignupRole
  lockedEmail?: string
}) => {
  const { values, handleChange, handleBlur } =
    useFormikContext<SignupFormValues>()

  return (
    <>
      <div className={styles.names}>
        <TextInput
          title="First name"
          label="firstName"
          name="firstName"
          autoComplete="given-name"
          value={values.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Ada"
        />
        <TextInput
          title="Last name"
          label="lastName"
          name="lastName"
          autoComplete="family-name"
          value={values.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Obi"
        />
      </div>

      <TextInput
        title={accountType === 'recruiter' ? 'Work email' : 'Email'}
        label="email"
        name="email"
        type="email"
        autoComplete="email"
        icon={<LuMail />}
        endAdornment={
          <Pill size="sm" tone="brand">
            {ROLE_LABEL[accountType]}
          </Pill>
        }
        endAdornmentSize="md"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={
          accountType === 'recruiter' ? 'you@company.com' : 'you@example.com'
        }
        disabled={!!lockedEmail}
      />

      <div className={styles.passwordField}>
        <PasswordInput
          title="Password"
          label="password"
          name="password"
          autoComplete="new-password"
          icon={<LuLock />}
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Create a password"
        />
        <PasswordStrength value={values.password} />
      </div>

      <PasswordInput
        title="Confirm password"
        label="confirmPassword"
        name="confirmPassword"
        autoComplete="new-password"
        icon={<LuLock />}
        value={values.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Type it again"
      />

      <CheckBox
        name="remember"
        label="Keep me signed in"
        checked={values.remember}
        onChange={handleChange}
      />
    </>
  )
}

export const SignupForm = ({
  accountType,
  onSuccess,
  lockedEmail,
  redirectPath,
  showLoginLink = true,
}: SignupFormProps) => {
  const { submitSignup, clearError, isLoading } = useSignup()
  const error = useAuthStore((state) => state.error)
  const location = useLocation()
  useFocusFieldOnMount('firstName')

  useEffect(() => {
    clearError()
  }, [])

  const initialValues: SignupFormValues = {
    firstName: '',
    lastName: '',
    email: lockedEmail ?? '',
    password: '',
    confirmPassword: '',
    remember: true,
  }

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      await submitSignup({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        remember: values.remember,
        userType: accountType,
        ...(redirectPath ? { redirectPath } : {}),
      })
      onSuccess?.(values.lastName.trim(), accountType)
    } catch {
      return
    }
  }

  return (
    <ValidatedForm
      initialValues={initialValues}
      validationSchema={SignUpSchema}
      onSubmit={handleSubmit}>
      <Form noValidate className={styles.form}>
        <FormikFocusOnError />
        {error && (
          <Alert variant="error" icon={<LuCircleAlert />}>
            {error}
          </Alert>
        )}

        <Fields accountType={accountType} lockedEmail={lockedEmail} />

        <Button
          type="submit"
          variant="ink"
          size="xl"
          pill
          stretch
          loading={isLoading}
          iconEnd={<LuArrowRight />}>
          Create account
        </Button>

        <p className={styles.legal}>
          By creating an account you agree to the{' '}
          <Link to={`/${paths.termsConditions}`}>Terms</Link> and{' '}
          <Link to={`/${paths.privacyPolicy}`}>Privacy Policy</Link>.
        </p>

        {showLoginLink && (
          <AuthPrompt
            text="Already have an account?"
            linkLabel="Log in"
            to={
              redirectPath
                ? loginPathWithNext(redirectPath)
                : { pathname: `/${paths.login}`, search: location.search }
            }
          />
        )}
      </Form>
    </ValidatedForm>
  )
}
