import { FormikProvider, useFormik } from 'formik'
import React, { useState } from 'react'
import { LuArrowRight, LuKeyRound, LuMail } from 'react-icons/lu'

import { Alert } from '@/components/feedback'
import {
  FormikFocusOnError,
  TextInput,
  useFocusFieldOnMount,
} from '@/components/forms'
import { ValidationSchemaProvider } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { paths } from '@/paths'

import { AuthPrompt, AuthScreen } from '../components/AuthScreen'
import { AuthShell } from '../components/AuthShell'
import { CheckEmailScreen } from '../components/CheckEmailScreen'
import { useForgotPassword } from '../hooks/useForgotPassword'
import { forgotPasswordSchema } from '../validation/AuthValidationSchema'
import styles from './ForgotPasswordPage.module.scss'

export const RESET_LINK_LIFETIME = '2 hours'

type ForgotPasswordValues = {
  email: string
}

const initialValues: ForgotPasswordValues = { email: '' }

export const ForgotPasswordPage = () => {
  const { submitForgotPassword, isRequesting } = useForgotPassword()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const formik = useFormik<ForgotPasswordValues>({
    initialValues,
    validationSchema: forgotPasswordSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (isRequesting) return
      setSubmitError(null)
      const email = values.email.trim()
      try {
        await submitForgotPassword({ email })
        setSentTo(email)
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Something went wrong.',
        )
      }
    },
  })

  useFocusFieldOnMount('email')

  if (sentTo) {
    return (
      <AuthShell>
        <CheckEmailScreen
          message={
            <>
              We sent a password reset link to {sentTo}. It expires in{' '}
              {RESET_LINK_LIFETIME}, so use it soon.
            </>
          }
          onResend={() => submitForgotPassword({ email: sentTo })}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell accent="violet">
      <AuthScreen
        back={{ to: `/${paths.login}`, label: 'Back to log in' }}
        icon={{ icon: <LuKeyRound /> }}
        title="Forgot your password?"
        subtitle="No worries. Enter the email you signed up with and we'll send you a reset link.">
        <FormikProvider value={formik}>
          <ValidationSchemaProvider schema={forgotPasswordSchema}>
            <form
              onSubmit={formik.handleSubmit}
              noValidate
              className={styles.form}>
              <FormikFocusOnError />
              {submitError && <Alert variant="error">{submitError}</Alert>}

              <TextInput
                title="Email"
                label="email"
                name="email"
                type="email"
                autoComplete="email"
                icon={<LuMail />}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="you@company.com"
                error={
                  formik.touched.email && formik.errors.email
                    ? formik.errors.email
                    : ''
                }
              />

              <Button
                type="submit"
                variant="ink"
                size="xl"
                pill
                stretch
                loading={isRequesting}
                disabled={!formik.isValid || isRequesting}
                iconEnd={<LuArrowRight />}>
                Send reset link
              </Button>

              <AuthPrompt
                text="Remember your password?"
                linkLabel="Log in"
                to={`/${paths.login}`}
              />
            </form>
          </ValidationSchemaProvider>
        </FormikProvider>
      </AuthScreen>
    </AuthShell>
  )
}
