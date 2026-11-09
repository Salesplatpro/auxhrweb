import { FormikProvider, useFormik } from 'formik'
import React, { useEffect } from 'react'
import { LuArrowRight, LuCircleAlert, LuLock, LuMail } from 'react-icons/lu'
import { useLocation } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import {
  CheckBox,
  FormikFocusOnError,
  PasswordInput,
  TextInput,
  useFocusFieldOnMount,
} from '@/components/forms'
import { ValidationSchemaProvider } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { TextLink } from '@/components/ui/TextLink'
import { paths } from '@/paths'

import { useLogin } from '../../hooks/useLogin'
import { useAuthStore } from '../../store/useAuthStore'
import { LoginFormValues } from '../../types'
import { loginSchema } from '../../validation/AuthValidationSchema'
import { AuthPrompt } from '../AuthScreen'
import styles from './LoginForm.module.scss'

const defaultValues: LoginFormValues = {
  email: '',
  password: '',
  remember: false,
}

type LoginFormProps = {
  lockedEmail?: string
  hideSignupLink?: boolean
}

export const LoginForm = ({
  lockedEmail,
  hideSignupLink = false,
}: LoginFormProps) => {
  const { submitLogin, clearError, invalidCredentials, isLoading } = useLogin()
  const error = useAuthStore((state) => state.error)
  const location = useLocation()

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      ...defaultValues,
      email: lockedEmail ?? '',
    },
    enableReinitialize: !!lockedEmail,
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        await submitLogin(values)
      } catch {
        return
      }
    },
  })

  useFocusFieldOnMount('email')

  useEffect(() => {
    clearError()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event)
    if (error) clearError()
  }

  const fieldError = (name: 'email' | 'password') =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : ''

  return (
    <FormikProvider value={formik}>
      <ValidationSchemaProvider schema={loginSchema}>
        <form onSubmit={formik.handleSubmit} noValidate className={styles.form}>
          <FormikFocusOnError />
          {error && (
            <Alert
              variant="error"
              icon={<LuCircleAlert />}
              title={invalidCredentials ? error : undefined}>
              {invalidCredentials
                ? 'Check your details and try again, or reset your password.'
                : error}
            </Alert>
          )}

          <TextInput
            title="Email"
            label="email"
            name="email"
            type="email"
            autoComplete="email"
            icon={<LuMail />}
            value={formik.values.email}
            onChange={handleChange}
            onBlur={formik.handleBlur}
            placeholder="you@company.com"
            disabled={!!lockedEmail}
            invalid={invalidCredentials}
            error={fieldError('email')}
          />

          <PasswordInput
            title="Password"
            label="password"
            name="password"
            autoComplete="current-password"
            icon={<LuLock />}
            value={formik.values.password}
            onChange={handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter your password"
            error={
              fieldError('password') ||
              (invalidCredentials ? 'Check your password and try again.' : '')
            }
          />

          <div className={styles.row}>
            <CheckBox
              name="remember"
              label="Remember me on this device"
              checked={formik.values.remember}
              onChange={formik.handleChange}
            />
            <TextLink to={`/${paths.forgotPassword}`}>
              Forgot password?
            </TextLink>
          </div>

          <Button
            type="submit"
            variant="ink"
            size="xl"
            pill
            stretch
            loading={isLoading}
            iconEnd={<LuArrowRight />}>
            Log in
          </Button>

          {!hideSignupLink && (
            <AuthPrompt
              text="Don't have an account?"
              linkLabel="Sign up"
              to={{ pathname: `/${paths.register}`, search: location.search }}
            />
          )}
        </form>
      </ValidationSchemaProvider>
    </FormikProvider>
  )
}
