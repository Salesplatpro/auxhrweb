import { FormikProvider, useFormik } from 'formik'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuClock3,
  LuLock,
  LuShieldCheck,
  LuWifiOff,
} from 'react-icons/lu'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import {
  FormikFocusOnError,
  PasswordInput,
  PasswordStrength,
  useFocusFieldOnMount,
} from '@/components/forms'
import { ValidationSchemaProvider } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { CheckList } from '@/components/ui/CheckList'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { TextLink } from '@/components/ui/TextLink'
import { paths } from '@/paths'
import { getErrorMessage, getErrorStatus } from '@/utils/getErrorMessage'
import { passwordRuleItems } from '@/utils/passwordRules'

import { AuthScreen } from '../components/AuthScreen'
import { AuthShell } from '../components/AuthShell'
import { useResetPassword } from '../hooks/useResetPassword'
import { destinationAfterAuth, SessionUser } from '../utils/dashboardPath'
import { resetPasswordSchema } from '../validation/AuthValidationSchema'
import styles from './ResetPasswordPage.module.scss'

type ScreenState =
  | 'missing'
  | 'validating'
  | 'valid'
  | 'invalid'
  | 'unreachable'
  | 'done'

type ResetPasswordValues = {
  password: string
  confirmPassword: string
}

const initialValues: ResetPasswordValues = {
  password: '',
  confirmPassword: '',
}

const REJECTED_LINK_STATUSES = [400, 401, 404]

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const nextPath = searchParams.get('next')
  const { submitValidateToken, submitResetPassword, isResetting } =
    useResetPassword()

  const [screen, setScreen] = useState<ScreenState>(
    token ? 'validating' : 'missing',
  )
  const [checkError, setCheckError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resetUser, setResetUser] = useState<SessionUser | undefined>()
  const processedTokenRef = useRef<string | null>(null)

  const checkToken = useCallback(
    (value: string) => {
      setScreen('validating')
      setCheckError(null)
      submitValidateToken(value)
        .then(() => setScreen('valid'))
        .catch((err) => {
          const status = getErrorStatus(err)
          if (status && REJECTED_LINK_STATUSES.includes(status)) {
            setScreen('invalid')
            return
          }
          setCheckError(
            getErrorMessage(err, 'Check your connection and try again.'),
          )
          setScreen('unreachable')
        })
    },
    [submitValidateToken],
  )

  useEffect(() => {
    if (!token) {
      setScreen('missing')
      return
    }
    if (processedTokenRef.current === token) return
    processedTokenRef.current = token
    checkToken(token)
  }, [token, checkToken])

  const formik = useFormik<ResetPasswordValues>({
    initialValues,
    validationSchema: resetPasswordSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!token || isResetting) return
      setSubmitError(null)
      try {
        const data = await submitResetPassword({
          token,
          password: values.password,
        })
        setResetUser(data.data?.user)
        setScreen('done')
      } catch (err) {
        if (getErrorStatus(err) === 401) {
          setScreen('invalid')
          return
        }
        setSubmitError(
          err instanceof Error
            ? err.message
            : 'Failed to update password. Please try again.',
        )
      }
    },
  })

  useFocusFieldOnMount('password')

  if (screen === 'validating') {
    return <Spinner fullPage />
  }

  if (screen === 'done') {
    return (
      <AuthShell>
        <AuthScreen
          icon={{ icon: <LuCheck />, tone: 'success' }}
          eyebrow={<Pill icon={<LuShieldCheck />}>All done</Pill>}
          title="Password updated"
          subtitle="Your password has been reset. For your security, we logged you out of other devices.">
          <Button
            type="button"
            variant="ink"
            size="xl"
            pill
            stretch
            iconEnd={<LuArrowRight />}
            onClick={() =>
              navigate(destinationAfterAuth(resetUser, nextPath), {
                replace: true,
              })
            }>
            Log in
          </Button>
        </AuthScreen>
      </AuthShell>
    )
  }

  if (screen === 'unreachable') {
    return (
      <AuthShell>
        <AuthScreen
          icon={{ icon: <LuWifiOff />, tone: 'warning' }}
          title="We couldn't check your link"
          subtitle={checkError}>
          <Button
            type="button"
            variant="ink"
            size="xl"
            pill
            stretch
            onClick={() => checkToken(token)}>
            Try again
          </Button>
        </AuthScreen>
      </AuthShell>
    )
  }

  if (screen === 'missing' || screen === 'invalid') {
    return (
      <AuthShell>
        <AuthScreen
          icon={{ icon: <LuClock3 />, tone: 'warning' }}
          title="Reset link expired"
          subtitle="This password reset link is invalid or has expired. Request a new one to continue.">
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ink"
              size="xl"
              pill
              stretch
              iconEnd={<LuArrowRight />}
              onClick={() => navigate(`/${paths.forgotPassword}`)}>
              Request a new reset link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xl"
              pill
              stretch
              icon={<LuArrowLeft />}
              onClick={() => navigate(`/${paths.login}`)}>
              Back to log in
            </Button>
          </div>
        </AuthScreen>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthScreen
        icon={{ icon: <LuLock /> }}
        title="Set a new password"
        subtitle="Choose a strong password you don't use anywhere else.">
        <FormikProvider value={formik}>
          <ValidationSchemaProvider schema={resetPasswordSchema}>
            <form
              onSubmit={formik.handleSubmit}
              noValidate
              className={styles.form}>
              <FormikFocusOnError />
              {submitError && <Alert variant="error">{submitError}</Alert>}

              <div className={styles.field}>
                <PasswordInput
                  title="New password"
                  label="password"
                  name="password"
                  autoComplete="new-password"
                  icon={<LuLock />}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter a new password"
                  error={
                    formik.touched.password && formik.errors.password
                      ? formik.errors.password
                      : ''
                  }
                />
                <PasswordStrength value={formik.values.password} />
              </div>

              <PasswordInput
                title="Confirm new password"
                label="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                icon={<LuLock />}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Type it again"
                error={
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                    ? formik.errors.confirmPassword
                    : ''
                }
              />

              <CheckList items={passwordRuleItems(formik.values.password)} />

              <Button
                type="submit"
                variant="ink"
                size="xl"
                pill
                stretch
                loading={isResetting}
                disabled={!formik.isValid || isResetting}
                iconEnd={<LuArrowRight />}>
                Reset password
              </Button>

              <TextLink
                to={`/${paths.login}`}
                tone="muted"
                icon={<LuArrowLeft />}>
                Back to log in
              </TextLink>
            </form>
          </ValidationSchemaProvider>
        </FormikProvider>
      </AuthScreen>
    </AuthShell>
  )
}
