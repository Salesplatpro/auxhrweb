import React, { FormEvent, useState } from 'react'
import { LuArrowLeft, LuMail } from 'react-icons/lu'

import { Alert } from '@/components/feedback'
import { PasswordInput, TextInput } from '@/components/forms'
import { Button } from '@/components/ui/Button'
import { AuthScreen } from '@/features/auth/components/AuthScreen'

import { useEmailVerification } from '../../hooks/useEmailVerification'
import styles from './ChangeEmailScreen.module.scss'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ChangeEmailScreenProps = {
  currentEmail?: string
  redirectPath?: string
  onDone: () => void
  onCancel: () => void
}

type FieldErrors = { newEmail?: string; currentPassword?: string }

export const ChangeEmailScreen = ({
  currentEmail,
  redirectPath,
  onDone,
  onCancel,
}: ChangeEmailScreenProps) => {
  const { submitChangeEmail, isChangingEmail } = useEmailVerification()
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isChangingEmail) return
    const email = newEmail.trim()
    const errors: FieldErrors = {}
    if (!EMAIL_PATTERN.test(email)) errors.newEmail = 'Enter a valid email'
    else if (email.toLowerCase() === currentEmail?.toLowerCase())
      errors.newEmail = 'This is already your email'
    if (!currentPassword) errors.currentPassword = 'Enter your password'
    setFieldErrors(errors)
    if (errors.newEmail || errors.currentPassword) return

    setError(null)
    try {
      await submitChangeEmail({
        newEmail: email,
        currentPassword,
        ...(redirectPath ? { redirectPath } : {}),
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change email.')
    }
  }

  return (
    <AuthScreen
      progress={{ step: 3, total: 3 }}
      icon={{ icon: <LuMail /> }}
      title="Change your email"
      subtitle={
        currentEmail ? (
          <>
            We&apos;ll send a new link to the address you enter. Right now
            it&apos;s {currentEmail}.
          </>
        ) : (
          "We'll send a new link to the address you enter."
        )
      }>
      <form className={styles.form} onSubmit={submit} noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        <TextInput
          title="New email"
          label="newEmail"
          name="newEmail"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={newEmail}
          onChange={(event) => {
            setNewEmail(event.target.value)
            setFieldErrors((prev) => ({ ...prev, newEmail: undefined }))
          }}
          error={fieldErrors.newEmail}
        />
        <PasswordInput
          title="Current password"
          label="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value)
            setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }))
          }}
          error={fieldErrors.currentPassword}
        />
        <Button
          type="submit"
          variant="ink"
          size="xl"
          pill
          stretch
          loading={isChangingEmail}>
          Send new link
        </Button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          <LuArrowLeft aria-hidden />
          Keep my current email
        </button>
      </form>
    </AuthScreen>
  )
}
