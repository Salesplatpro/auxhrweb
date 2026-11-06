import React, { ReactNode, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mutate } from 'swr'

import { Alert } from '@/components/feedback'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { loginPathWithNext } from '@/features/auth/utils/dashboardPath'
import {
  acceptOrganizationInvite,
  fetchOrganizationInvitePreview,
  MY_ORGANIZATIONS_ENDPOINT,
} from '@/features/organizations/services/organizationService'
import { OrganizationInvitePreview } from '@/features/organizations/types'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { AuthScreen } from '../components/AuthScreen'
import { AuthShell } from '../components/AuthShell'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { useAuthStore } from '../store/useAuthStore'
import styles from './JoinCompanyInvitePage.module.scss'

const verifyEmailPath = (next?: string) =>
  next ? `/verify-email?redirect=${encodeURIComponent(next)}` : '/verify-email'

const InviteLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) => (
  <AuthShell>
    <AuthScreen title={title} subtitle={subtitle}>
      {children}
    </AuthScreen>
  </AuthShell>
)

export const JoinCompanyInvitePage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)
  const userEmail = useAuthStore((state) => state.user?.email)
  const sessionEmailVerifiedAt = useAuthStore(
    (state) => state.user?.emailVerifiedAt,
  )
  const {
    profile,
    isLoading: isLoadingProfile,
    mutate: mutateProfile,
  } = useProfile()

  const [preview, setPreview] = useState<OrganizationInvitePreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(true)

  const redirectPath = token ? `/join-company/${token}` : undefined
  const isEmailVerified = !!(profile?.emailVerifiedAt || sessionEmailVerifiedAt)
  const emailsMatch =
    !!userEmail &&
    !!preview?.invitedEmail &&
    userEmail.toLowerCase() === preview.invitedEmail.toLowerCase()
  const canAutoAccept =
    !!token &&
    !!preview &&
    isLoggedIn &&
    userRole === 'recruiter' &&
    emailsMatch &&
    isEmailVerified
  const waitingForSessionProfile =
    isLoggedIn && isLoadingProfile && !isEmailVerified

  useEffect(() => {
    if (!token) {
      setLoadError('This invite link is invalid.')
      setIsLoadingPreview(false)
      return
    }

    fetchOrganizationInvitePreview(token)
      .then((res) => setPreview(res.data.invite))
      .catch((error) =>
        setLoadError(getErrorMessage(error, 'This invite link is invalid.')),
      )
      .finally(() => setIsLoadingPreview(false))
  }, [token])

  useEffect(() => {
    if (!isLoggedIn) return
    void mutateProfile()
  }, [isLoggedIn, mutateProfile])

  useEffect(() => {
    if (!canAutoAccept || !token || !preview) {
      return
    }

    let cancelled = false
    setIsAccepting(true)
    acceptOrganizationInvite(token)
      .then(async () => {
        if (cancelled) return
        await mutate(MY_ORGANIZATIONS_ENDPOINT)
        navigate('/recruiterDashboard/dashboard', {
          replace: true,
          state: {
            toast: {
              type: 'success',
              message: `You joined ${preview.organizationName}.`,
            },
          },
        })
      })
      .catch((error) => {
        if (cancelled) return
        setAcceptError(getErrorMessage(error, 'Failed to accept invite'))
      })
      .finally(() => {
        if (!cancelled) setIsAccepting(false)
      })

    return () => {
      cancelled = true
    }
  }, [canAutoAccept, token, preview, navigate])

  if (
    isLoadingPreview ||
    isAccepting ||
    waitingForSessionProfile ||
    (canAutoAccept && !acceptError)
  ) {
    return <Spinner fullPage />
  }

  if (loadError || !preview || !token) {
    return (
      <InviteLayout
        title="Invite unavailable"
        subtitle="This company invite can no longer be used.">
        <Alert variant="error">{loadError ?? 'Invite not found.'}</Alert>
        <div className={styles.footerLinks}>
          <Link to="/login">Go to login</Link>
        </div>
      </InviteLayout>
    )
  }

  if (isLoggedIn && !emailsMatch) {
    return (
      <InviteLayout
        title="Wrong account"
        subtitle={`This invite was sent to ${preview.invitedEmail}.`}>
        <Alert variant="error">
          Sign in with {preview.invitedEmail} to join {preview.organizationName}
          .
        </Alert>
        <div className={styles.footerLinks}>
          <Link to={loginPathWithNext(redirectPath!)}>Switch account</Link>
        </div>
      </InviteLayout>
    )
  }

  if (isLoggedIn && userRole !== 'recruiter') {
    return (
      <InviteLayout
        title="Recruiter account required"
        subtitle={`Join ${preview.organizationName} as a recruiter.`}>
        <Alert variant="error">
          Talent accounts cannot accept company invites. Sign up or log in as a
          recruiter using {preview.invitedEmail}.
        </Alert>
      </InviteLayout>
    )
  }

  if (isLoggedIn && !isEmailVerified) {
    return (
      <InviteLayout
        title="Verify your email"
        subtitle={`Confirm ${preview.invitedEmail} before joining ${preview.organizationName}.`}>
        <Alert variant="warning">
          Check your inbox for a verification link. After verifying, you will
          join your team automatically.
        </Alert>
        <Button
          type="button"
          variant="ink"
          size="xl"
          pill
          stretch
          onClick={() => navigate(verifyEmailPath(redirectPath))}>
          Go to email verification
        </Button>
      </InviteLayout>
    )
  }

  if (acceptError) {
    return (
      <InviteLayout
        title="Could not join company"
        subtitle={preview.organizationName}>
        <Alert variant="error">{acceptError}</Alert>
      </InviteLayout>
    )
  }

  if (preview.inviteeExists) {
    return (
      <InviteLayout
        title={`Join ${preview.organizationName}`}
        subtitle="Log in with your recruiter account to accept this invite.">
        <p className={styles.lead}>
          You were invited to join <strong>{preview.organizationName}</strong>.
          Log in with <strong>{preview.invitedEmail}</strong> to continue.
        </p>
        <LoginForm lockedEmail={preview.invitedEmail} hideSignupLink />
        <div className={styles.footerLinks}>
          <Link to={loginPathWithNext(redirectPath!)}>
            Use a different account
          </Link>
        </div>
      </InviteLayout>
    )
  }

  return (
    <InviteLayout
      title={`Join ${preview.organizationName}`}
      subtitle="Create your recruiter account to accept this invite.">
      <p className={styles.lead}>
        You were invited to join <strong>{preview.organizationName}</strong> as
        a recruiter. Sign up with <strong>{preview.invitedEmail}</strong> —
        talent signup is not available for company invites. You must verify your
        email before you can join the company.
      </p>

      <SignupForm
        accountType="recruiter"
        lockedEmail={preview.invitedEmail}
        redirectPath={redirectPath}
        onSuccess={() => navigate(verifyEmailPath(redirectPath))}
      />
    </InviteLayout>
  )
}
