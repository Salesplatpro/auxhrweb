import React, { useEffect, useRef, useState } from 'react'
import { LuArrowLeft, LuCheck, LuLogOut, LuMailWarning } from 'react-icons/lu'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { AuthScreen } from '@/features/auth/components/AuthScreen'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { CheckEmailScreen } from '@/features/auth/components/CheckEmailScreen'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import {
  dashboardPathForRole,
  loginPathWithNext,
} from '@/features/auth/utils/dashboardPath'
import { onboardingDestination } from '@/features/onboarding/destination'
import { OnboardingDoneState } from '@/features/onboarding/done/OnboardingDoneState'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { ProfileUser } from '@/features/profile/types'
import { paths } from '@/paths'

import { ChangeEmailScreen } from '../components/ChangeEmailScreen'
import { EmailVerifiedScreen } from '../components/EmailVerifiedScreen'
import { useEmailVerification } from '../hooks/useEmailVerification'
import styles from './AccountEmailVerification.module.scss'

const SAFE_REDIRECT_PATTERN =
  /^\/apply\/[A-Za-z0-9-]+$|^\/join-company\/[a-f0-9]+$|^\/join-staff\/[a-f0-9]+$/

const verifyToastMessage = (joinedCompanyName?: string) =>
  joinedCompanyName
    ? `Your email is verified. You joined ${joinedCompanyName}.`
    : 'Your email has been verified.'

const nextStepFor = (user: ProfileUser, safeRedirect: string | null) =>
  safeRedirect ??
  onboardingDestination(user) ??
  dashboardPathForRole(user.userRole)

const useKeepSessionVerified = (profile?: ProfileUser | null) => {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const verifiedAt = profile?.emailVerifiedAt
  useEffect(() => {
    if (verifiedAt && user && !user.emailVerifiedAt) {
      setUser({ ...user, emailVerifiedAt: verifiedAt })
    }
  }, [verifiedAt, user, setUser])
}

const LogOutButton = ({ label }: { label: string }) => {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={styles.textButton}
      onClick={() => {
        logout()
        navigate(`/${paths.login}`, { replace: true })
      }}>
      <LuArrowLeft aria-hidden />
      {label}
    </button>
  )
}

const InboxStep = ({ safeRedirect }: { safeRedirect: string | null }) => {
  const { profile, isLoading, error, mutate } = useProfile()
  const { submitResend } = useEmailVerification()
  const [changing, setChanging] = useState(false)
  useKeepSessionVerified(profile)

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void mutate()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [mutate])

  if (!profile) {
    return (
      <OnboardingDoneState
        isLoading={isLoading || !error}
        error={error}
        onRetry={() => void mutate()}
      />
    )
  }

  if (profile.emailVerifiedAt) {
    return <Navigate to={nextStepFor(profile, safeRedirect)} replace />
  }

  if (changing) {
    return (
      <ChangeEmailScreen
        currentEmail={profile.email}
        redirectPath={safeRedirect ?? undefined}
        onDone={() => setChanging(false)}
        onCancel={() => setChanging(false)}
      />
    )
  }

  return (
    <CheckEmailScreen
      key={profile.email}
      progress={{ step: 3, total: 3 }}
      title="Check your inbox"
      message={
        <>
          We sent a verification link to {profile.email ?? 'your email'}. Click
          it to activate your account. The link works for 24 hours.
        </>
      }
      onResend={() => submitResend(safeRedirect ?? undefined)}
      onChangeEmail={() => setChanging(true)}
      footer={<LogOutButton label="Back to log in" />}
    />
  )
}

type TokenOutcome =
  | { kind: 'verifying' }
  | { kind: 'verified'; profile: ProfileUser; joinedCompanyName?: string }
  | { kind: 'verified-logged-out' }
  | { kind: 'other-account'; email?: string }
  | { kind: 'error' }

const TokenStep = ({
  token,
  safeRedirect,
}: {
  token: string
  safeRedirect: string | null
}) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const { submitVerifyToken } = useEmailVerification()
  const { mutate } = useProfile()
  const [outcome, setOutcome] = useState<TokenOutcome>({ kind: 'verifying' })
  const processedTokenRef = useRef<string | null>(null)
  useKeepSessionVerified(
    outcome.kind === 'verified' ? outcome.profile : undefined,
  )

  useEffect(() => {
    if (processedTokenRef.current === token) return
    processedTokenRef.current = token

    const settle = (
      profile: ProfileUser | undefined,
      joinedCompanyName?: string,
    ) => {
      if (!isLoggedIn) {
        setOutcome({ kind: 'verified-logged-out' })
        return
      }
      if (profile && !profile.emailVerifiedAt) {
        setOutcome({ kind: 'other-account', email: profile.email })
        return
      }
      if (safeRedirect && !joinedCompanyName) {
        navigate(safeRedirect, {
          replace: true,
          state: { toast: { type: 'success', message: verifyToastMessage() } },
        })
        return
      }
      if (!profile) {
        navigate(dashboardPathForRole(userRole), { replace: true })
        return
      }
      setOutcome({ kind: 'verified', profile, joinedCompanyName })
    }

    submitVerifyToken(token)
      .then((result) => settle(result.profile, result.joinedCompanyName))
      .catch(async () => {
        if (isLoggedIn) {
          const refreshed = await mutate()
          const profile = refreshed?.data?.user
          if (profile?.emailVerifiedAt) {
            settle(profile)
            return
          }
        }
        setOutcome({ kind: 'error' })
      })
  }, [
    token,
    isLoggedIn,
    userRole,
    safeRedirect,
    navigate,
    mutate,
    submitVerifyToken,
  ])

  if (outcome.kind === 'verifying') {
    return <Spinner fullPage />
  }

  if (outcome.kind === 'verified') {
    return (
      <EmailVerifiedScreen
        profile={outcome.profile}
        joinedCompanyName={outcome.joinedCompanyName}
      />
    )
  }

  if (outcome.kind === 'verified-logged-out') {
    return (
      <AuthScreen
        icon={{ icon: <LuCheck />, tone: 'success' }}
        title="Email verified"
        subtitle="Your account is active. Log in to pick up where you left off.">
        <Button
          type="button"
          variant="ink"
          size="xl"
          pill
          stretch
          onClick={() =>
            navigate(loginPathWithNext(safeRedirect), { replace: true })
          }>
          Log in to continue
        </Button>
      </AuthScreen>
    )
  }

  if (outcome.kind === 'other-account') {
    return (
      <AuthScreen
        icon={{ icon: <LuLogOut />, tone: 'warning' }}
        title="That link was for another account"
        subtitle={
          <>
            The address in that link is now verified, but you&apos;re signed in
            as {outcome.email ?? 'a different account'}, which still needs
            verifying. Log out, then sign in with the account you just verified.
          </>
        }>
        <LogOutButton label="Log out and sign in with that account" />
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      icon={{ icon: <LuMailWarning />, tone: 'danger' }}
      title="Link invalid or expired"
      subtitle="This verification link is invalid or has expired. Only the newest link we sent works, and each one lasts 24 hours.">
      {isLoggedIn ? (
        <Button
          type="button"
          variant="ink"
          size="xl"
          pill
          stretch
          onClick={() =>
            setSearchParams(safeRedirect ? { redirect: safeRedirect } : {}, {
              replace: true,
            })
          }>
          Send a new link
        </Button>
      ) : (
        <Button
          type="button"
          variant="ink"
          size="xl"
          pill
          stretch
          onClick={() => navigate(loginPathWithNext(safeRedirect))}>
          Log in to get a new link
        </Button>
      )}
    </AuthScreen>
  )
}

const AccountEmailVerification: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const redirect = searchParams.get('redirect')
  const safeRedirect =
    redirect && SAFE_REDIRECT_PATTERN.test(redirect) ? redirect : null

  if (!token && !isLoggedIn) {
    return <Navigate to={loginPathWithNext(safeRedirect)} replace />
  }

  return (
    <AuthShell>
      {token ? (
        <TokenStep key={token} token={token} safeRedirect={safeRedirect} />
      ) : (
        <InboxStep safeRedirect={safeRedirect} />
      )}
    </AuthShell>
  )
}

export default AccountEmailVerification
