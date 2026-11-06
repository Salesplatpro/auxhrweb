import React, { useState } from 'react'
import { LuArrowRight, LuBriefcaseBusiness, LuSearch } from 'react-icons/lu'
import { Navigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { Pill } from '@/components/ui/Pill'
import { TextLink } from '@/components/ui/TextLink'
import { useEmailVerification } from '@/features/email-verification/hooks/useEmailVerification'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { paths } from '@/paths'

import { AuthPrompt, AuthScreen } from '../components/AuthScreen'
import { AuthShell } from '../components/AuthShell'
import { CheckEmailScreen } from '../components/CheckEmailScreen'
import { SignupForm } from '../components/SignupForm'
import { SignupRole } from '../hooks/useSignup'
import { useAuthStore } from '../store/useAuthStore'
import { dashboardPathForRole } from '../utils/dashboardPath'
import styles from './SignupPage.module.scss'

const TOTAL_STEPS = 3

const ROLE_COPY: Record<SignupRole, { cta: string; subtitle: string }> = {
  recruiter: {
    cta: 'Continue as recruiter',
    subtitle: 'Start hiring with AuxHR. Your team can join you later.',
  },
  talent: {
    cta: 'Continue as talent',
    subtitle: 'Set up your free talent profile in under 2 minutes.',
  },
}

const parseRole = (value: string | null): SignupRole | null =>
  value === 'recruiter' || value === 'talent' ? value : null

const withoutRole = (params: URLSearchParams) => {
  const next = new URLSearchParams(params)
  next.delete('role')
  const search = next.toString()
  return search ? `?${search}` : ''
}

const RoleStep = ({
  onContinue,
}: {
  onContinue: (role: SignupRole) => void
}) => {
  const [searchParams] = useSearchParams()
  const [selected, setSelected] = useState<SignupRole>('recruiter')

  return (
    <AuthScreen
      back={{ to: `/${paths.login}`, label: 'Back to log in' }}
      progress={{ step: 1, total: TOTAL_STEPS }}
      title="How will you use AuxHR?"
      subtitle="Pick one to get the right setup. You can't switch roles later, but you can make a second account.">
      <div
        className={styles.choices}
        role="radiogroup"
        aria-label="Account type">
        <ChoiceCard
          name="role"
          value="recruiter"
          checked={selected === 'recruiter'}
          onSelect={() => setSelected('recruiter')}
          icon={<LuBriefcaseBusiness />}
          title="I'm hiring"
          description="For recruiters, founders and HR teams. Post jobs and let AI screen every applicant."
          features={['Post jobs', 'AI screening', 'Team access']}
        />
        <ChoiceCard
          name="role"
          value="talent"
          checked={selected === 'talent'}
          onSelect={() => setSelected('talent')}
          icon={<LuSearch />}
          title="I'm looking for work"
          badge={
            <Pill tone="success" size="sm">
              Free, always
            </Pill>
          }
          description="For talent. One profile, AI matches you to roles you actually fit."
          features={['Job matches', 'Apply in 1 tap']}
        />
      </div>
      <Button
        type="button"
        variant="ink"
        size="xl"
        pill
        stretch
        iconEnd={<LuArrowRight />}
        onClick={() => onContinue(selected)}>
        {ROLE_COPY[selected].cta}
      </Button>
      <AuthPrompt
        text="Already have an account?"
        linkLabel="Log in"
        to={`/${paths.login}${withoutRole(searchParams)}`}
      />
    </AuthScreen>
  )
}

const VerifyStep = () => {
  const user = useAuthStore((state) => state.user)
  const { profile } = useProfile()
  const { submitResend } = useEmailVerification()
  const verified = !!(profile?.emailVerifiedAt || user?.emailVerifiedAt)
  const email = profile?.email ?? user?.email

  if (verified) {
    return <Navigate to={dashboardPathForRole(user?.userRole)} replace />
  }

  return (
    <CheckEmailScreen
      progress={{ step: 3, total: TOTAL_STEPS }}
      title="Verify your email"
      message={
        <>
          We sent a verification link to {email ?? 'your email'}. Open it to
          activate your account.
        </>
      }
      onResend={() => submitResend()}
      footer={
        <TextLink to="/verify-email" tone="muted">
          Wrong email? Change it
        </TextLink>
      }
    />
  )
}

export const SignupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const role = parseRole(searchParams.get('role'))

  const chooseRole = (next: SignupRole) => {
    const params = new URLSearchParams(searchParams)
    params.set('role', next)
    setSearchParams(params)
  }

  return (
    <AuthShell>
      {isLoggedIn ? (
        <VerifyStep />
      ) : role ? (
        <AuthScreen
          progress={{ step: 2, total: TOTAL_STEPS }}
          title="Create your account"
          subtitle={ROLE_COPY[role].subtitle}>
          <SignupForm accountType={role} showLoginLink={false} />
        </AuthScreen>
      ) : (
        <RoleStep onContinue={chooseRole} />
      )}
    </AuthShell>
  )
}
