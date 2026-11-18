import { FormikProvider, useFormik } from 'formik'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  LuArrowRight,
  LuCheck,
  LuCircleHelp,
  LuClock3,
  LuFileText,
  LuInfo,
  LuLink2Off,
  LuListChecks,
  LuLock,
} from 'react-icons/lu'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mutate } from 'swr'

import logoMark from '@/components/features/landing/landingPageComponents/newLanding/assets/logo-mark.png'
import { Alert } from '@/components/feedback'
import {
  FormikFocusOnError,
  PasswordInput,
  PasswordStrength,
} from '@/components/forms'
import { ValidationSchemaProvider } from '@/components/forms/ValidatedForm'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CheckList } from '@/components/ui/CheckList'
import { IconBadge } from '@/components/ui/IconBadge'
import { Spinner } from '@/components/ui/Spinner'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { resetPasswordSchema } from '@/features/auth/validation/AuthValidationSchema'
import { myWorkPath } from '@/features/people/paths'
import {
  acceptStaffInvite,
  joinStaffWithPassword,
} from '@/features/people/services/peopleService'
import type { JoinedStaff, StaffInvitePreview } from '@/features/people/types'
import {
  fetchProfile,
  PROFILE_ENDPOINT,
} from '@/features/profile/services/profileService'
import { useProfileStore } from '@/features/profile/store/useProfileStore'
import { paths } from '@/paths'
import { getErrorCode, getErrorMessage } from '@/utils/getErrorMessage'
import { passwordRuleItems } from '@/utils/passwordRules'

import styles from './JoinStaffPage.module.scss'
import { joinStaffScreen } from './joinStaffScreen'
import { useJoinStaffInvite } from './useJoinStaffInvite'

type PendingInvite = Extract<StaffInvitePreview, { status: 'pending' }>
type ExpiredInvite = Extract<StaffInvitePreview, { status: 'expired' }>

const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : ''

const nameParts = (name: string) => {
  const [first = '', second = ''] = name.trim().split(/\s+/)
  return { firstName: first, lastName: second }
}

const CompanyMark = ({
  name,
  size = 'md',
}: {
  name: string
  size?: 'md' | 'lg'
}) => <Avatar {...nameParts(name)} size={size} className={styles.companyMark} />

const Shell = ({
  organizationName,
  children,
}: {
  organizationName?: string
  children: ReactNode
}) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <img src={logoMark} alt="AuxHR" className={styles.logo} />
        {organizationName && (
          <div className={styles.invite}>
            <CompanyMark name={organizationName} />
            <div className={styles.inviteText}>
              <p className={styles.inviteTitle}>
                Join {organizationName} · Staff invite
              </p>
              <p className={styles.inviteSub}>{organizationName}</p>
            </div>
          </div>
        )}
      </div>
      <Link to={`/${paths.contact}`} className={styles.help}>
        <LuCircleHelp aria-hidden />
        <span className={styles.helpLong}>Need help?</span>
        <span className={styles.helpShort}>Help</span>
      </Link>
    </header>
    <main className={styles.main}>
      <section className={styles.card}>{children}</section>
    </main>
  </div>
)

const CardHeader = ({
  organizationName,
  title,
  lead,
}: {
  organizationName: string
  title: string
  lead: ReactNode
}) => (
  <header className={styles.cardHeader}>
    <div className={styles.lockup} aria-hidden>
      <CompanyMark name={organizationName} size="lg" />
      <span className={styles.plus}>+</span>
      <img src={logoMark} alt="" className={styles.lockupLogo} />
    </div>
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.lead}>{lead}</p>
  </header>
)

const StatusHeader = ({
  icon,
  tone,
  title,
  lead,
}: {
  icon: ReactNode
  tone: 'success' | 'warning' | 'danger'
  title: string
  lead: ReactNode
}) => (
  <header className={styles.cardHeader}>
    <IconBadge icon={icon} tone={tone} size="lg" />
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.lead}>{lead}</p>
  </header>
)

const SetPasswordForm = ({
  token,
  invite,
  onJoined,
  onAccountExists,
}: {
  token: string
  invite: PendingInvite
  onJoined: (joined: JoinedStaff) => void
  onAccountExists: () => void
}) => {
  const setSession = useAuthStore((state) => state.setSession)
  const [error, setError] = useState<string | null>(null)

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async ({ password }) => {
      setError(null)
      try {
        const result = await joinStaffWithPassword(token, password)
        setSession({ user: result.user, token: result.token })
        onJoined(result.joined)
      } catch (err) {
        if (getErrorCode(err) === 'ACCOUNT_EXISTS') {
          onAccountExists()
          return
        }
        setError(getErrorMessage(err, 'We could not set your password'))
      }
    },
  })

  const fieldError = (name: 'password' | 'confirmPassword') =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : ''

  return (
    <>
      <CardHeader
        organizationName={invite.organizationName}
        title={`Set a password to join ${invite.organizationName}`}
        lead={`You'll use it to log in to AuxHR as ${invite.invitedEmail}.`}
      />
      <FormikProvider value={formik}>
        <ValidationSchemaProvider schema={resetPasswordSchema}>
          <form
            onSubmit={formik.handleSubmit}
            noValidate
            className={styles.form}>
            <FormikFocusOnError />
            {error && <Alert variant="error">{error}</Alert>}
            <div className={styles.field}>
              <PasswordInput
                title="Password"
                label="password"
                name="password"
                autoComplete="new-password"
                icon={<LuLock />}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Choose a password"
                error={fieldError('password')}
              />
              <PasswordStrength value={formik.values.password} />
              <CheckList items={passwordRuleItems(formik.values.password)} />
            </div>
            <PasswordInput
              title="Confirm password"
              label="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              icon={<LuLock />}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Type it again"
              error={fieldError('confirmPassword')}
            />
            <Button
              type="submit"
              size="xl"
              pill
              stretch
              loading={formik.isSubmitting}>
              Set password and accept
            </Button>
          </form>
        </ValidationSchemaProvider>
      </FormikProvider>
    </>
  )
}

const ExpiredCard = ({ invite }: { invite: ExpiredInvite }) => (
  <>
    <StatusHeader
      icon={<LuClock3 />}
      tone="warning"
      title="This invite has expired"
      lead={`Invites work for 7 days. Ask ${invite.organizationName} to send you a new one.`}
    />
    <p className={styles.note}>
      Sent to {invite.invitedEmail}
      {invite.invitedAt && ` on ${shortDate(invite.invitedAt)}`}
      {invite.expiresAt && ` · expired ${shortDate(invite.expiresAt)}`}
    </p>
    {invite.contactEmail && (
      <a
        className={styles.linkButton}
        href={`mailto:${invite.contactEmail}?subject=${encodeURIComponent(
          `New AuxHR invite for ${invite.invitedEmail}`,
        )}`}>
        Email {invite.organizationName}
      </a>
    )}
  </>
)

const JoinedCard = ({ joined }: { joined: JoinedStaff }) => {
  const navigate = useNavigate()
  const items = [
    joined.documentsToSign > 0 && {
      icon: <LuFileText />,
      label: `${joined.documentsToSign} ${
        joined.documentsToSign === 1 ? 'document' : 'documents'
      } to sign`,
    },
    joined.openTasks > 0 && {
      icon: <LuListChecks />,
      label: `${joined.openTasks} first-week ${
        joined.openTasks === 1 ? 'task' : 'tasks'
      }`,
    },
    (joined.hasPay || joined.hasShareOptions) && {
      icon: <LuInfo />,
      label: joined.hasShareOptions ? 'Your pay and share options' : 'Your pay',
    },
  ].filter(Boolean) as { icon: ReactNode; label: string }[]

  return (
    <>
      <StatusHeader
        icon={<LuCheck />}
        tone="success"
        title={`You've joined ${joined.organizationName}`}
        lead="Your contracts, pay and first-week tasks are in My work."
      />
      {items.length > 0 && (
        <ul className={styles.summary}>
          {items.map((item) => (
            <li key={item.label}>
              <span className={styles.summaryIcon} aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <Button
        size="xl"
        pill
        stretch
        onClick={() => navigate(myWorkPath, { replace: true })}>
        Go to My work
      </Button>
    </>
  )
}

const refreshProfile = async () => {
  try {
    const fresh = await fetchProfile()
    useProfileStore.getState().setProfile(fresh.data.user)
    await mutate(PROFILE_ENDPOINT, fresh, { revalidate: false })
  } catch {
    await mutate(PROFILE_ENDPOINT)
  }
}

const JoinStaffPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>()
  const { invite, isLoading, isInvalid } = useJoinStaffInvite(token)
  const session = {
    token: useAuthStore((state) => state.token),
    userRole: useAuthStore((state) => state.user?.userRole),
    email: useAuthStore((state) => state.user?.email),
  }
  const logout = useAuthStore((state) => state.logout)
  const [joined, setJoined] = useState<JoinedStaff | null>(null)
  const [accountExists, setAccountExists] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const triedAccepted = useRef(false)

  const screen = joinStaffScreen({
    invite,
    isLoading,
    isInvalid,
    session,
    hasJoined: !!joined,
    accountExists,
  })

  const finishJoin = useCallback((result: JoinedStaff) => {
    setJoined(result)
    void refreshProfile()
  }, [])

  const accept = useCallback(async () => {
    setAccepting(true)
    setAcceptError(null)
    try {
      finishJoin(await acceptStaffInvite(token))
    } catch (err) {
      setAcceptError(
        getErrorMessage(err, 'We could not add you to this company'),
      )
    } finally {
      setAccepting(false)
    }
  }, [token, finishJoin])

  useEffect(() => {
    if (
      screen === 'accept' &&
      invite?.status === 'accepted' &&
      !triedAccepted.current
    ) {
      triedAccepted.current = true
      void accept()
    }
  }, [screen, invite, accept])

  if (screen === 'loading') return <Spinner fullPage />

  const organizationName =
    invite && invite.status !== 'accepted'
      ? invite.organizationName
      : joined?.organizationName

  const body = (() => {
    switch (screen) {
      case 'joined':
        return <JoinedCard joined={joined!} />
      case 'expired':
        return <ExpiredCard invite={invite as ExpiredInvite} />
      case 'invalid':
        return (
          <StatusHeader
            icon={<LuLink2Off />}
            tone="danger"
            title="This invite link isn't valid"
            lead="Check that you copied the whole link from your email, or ask your company to send it again."
          />
        )
      case 'used':
        return (
          <>
            <StatusHeader
              icon={<LuCheck />}
              tone="success"
              title="This invite has already been used"
              lead="Log in to your AuxHR account to see My work."
            />
            <Link to={`/${paths.login}`} className={styles.linkButton}>
              Log in
            </Link>
          </>
        )
      case 'password':
        return (
          <SetPasswordForm
            token={token}
            invite={invite as PendingInvite}
            onJoined={finishJoin}
            onAccountExists={() => setAccountExists(true)}
          />
        )
      case 'login': {
        const pending = invite as PendingInvite
        return (
          <>
            <CardHeader
              organizationName={pending.organizationName}
              title={`Log in to join ${pending.organizationName}`}
              lead={`You already have an AuxHR account with ${pending.invitedEmail}.`}
            />
            <LoginForm
              lockedEmail={pending.invitedEmail}
              hideSignupLink
              submitLabel="Log in and accept"
              onSuccess={async () => {
                const user = useAuthStore.getState().user
                if (
                  user?.userRole === 'talent' &&
                  user.email?.toLowerCase() ===
                    pending.invitedEmail.toLowerCase()
                ) {
                  await accept()
                }
              }}
            />
          </>
        )
      }
      case 'wrong-role':
      case 'wrong-email': {
        const email = (invite as PendingInvite).invitedEmail
        return (
          <>
            <StatusHeader
              icon={<LuInfo />}
              tone="warning"
              title="Use the invited account"
              lead={
                screen === 'wrong-role'
                  ? 'This invite is for a personal AuxHR account. You are signed in with a recruiter or admin account.'
                  : `This invite was sent to ${email}. You are signed in with a different account.`
              }
            />
            <Button
              variant="outline"
              size="xl"
              pill
              stretch
              onClick={() => logout()}>
              Log out and use {email}
            </Button>
          </>
        )
      }
      case 'accept':
        return (
          <>
            {invite?.status === 'pending' ? (
              <CardHeader
                organizationName={invite.organizationName}
                title={`Join ${invite.organizationName}`}
                lead={`${invite.organizationName} added you as ${invite.jobTitle}.`}
              />
            ) : (
              <StatusHeader
                icon={<LuCheck />}
                tone="success"
                title="Opening your invite"
                lead="One moment while we check this invite."
              />
            )}
            {acceptError && <Alert variant="error">{acceptError}</Alert>}
            <Button
              size="xl"
              pill
              stretch
              loading={accepting}
              iconEnd={<LuArrowRight />}
              onClick={() => void accept()}>
              Accept and join
            </Button>
          </>
        )
    }
  })()

  return <Shell organizationName={organizationName}>{body}</Shell>
}

export default JoinStaffPage
