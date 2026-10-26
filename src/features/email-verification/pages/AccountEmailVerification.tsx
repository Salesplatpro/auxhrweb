import React, { useEffect, useRef, useState } from 'react'
import { HiOutlineMail } from 'react-icons/hi'
import { HiArrowRightOnRectangle } from 'react-icons/hi2'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import {
  dashboardPathForRole,
  loginPathWithNext,
} from '@/features/auth/utils/dashboardPath'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { EmailVerificationPanel } from '../components/EmailVerificationPanel'
import { useEmailVerification } from '../hooks/useEmailVerification'
import styles from './AccountEmailVerification.module.scss'

type TokenStatus = 'verifying' | 'success' | 'already-verified' | 'error'

const SAFE_REDIRECT_PATTERN =
  /^\/apply\/[A-Za-z0-9-]+$|^\/join-company\/[a-f0-9]+$|^\/join-staff\/[a-f0-9]+$/

const verifyToastMessage = (joinedCompanyName?: string) =>
  joinedCompanyName
    ? `Your email is verified. You joined ${joinedCompanyName}.`
    : 'Your email has been verified.'

const AccountEmailVerification: React.FC = () => {
  const logout = useAuthStore((state) => state.logout)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const token = searchParams.get('token')
  const redirect = searchParams.get('redirect')
  const safeRedirect =
    redirect && SAFE_REDIRECT_PATTERN.test(redirect) ? redirect : null
  const continueTarget = safeRedirect ?? dashboardPathForRole(userRole)

  const { submitVerifyToken } = useEmailVerification()
  const { mutate } = useProfile()

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('verifying')
  const [joinedCompanyName, setJoinedCompanyName] = useState<string>()
  const processedTokenRef = useRef<string | null>(null)

  const destinationAfterVerify = (joinedName?: string) =>
    joinedName ? dashboardPathForRole(userRole) : continueTarget

  useEffect(() => {
    if (!token || processedTokenRef.current === token) return
    processedTokenRef.current = token
    setTokenStatus('verifying')

    submitVerifyToken(token)
      .then((result) => {
        setTokenStatus('success')
        setJoinedCompanyName(result?.joinedCompanyName)
        if (isLoggedIn) {
          const destination = result?.joinedCompanyName
            ? dashboardPathForRole(userRole)
            : continueTarget
          navigate(destination, {
            replace: true,
            state: {
              toast: {
                type: 'success',
                message: verifyToastMessage(result?.joinedCompanyName),
              },
            },
          })
        }
      })
      .catch(async () => {
        if (isLoggedIn) {
          const refreshed = await mutate()
          if (refreshed?.data?.user?.emailVerifiedAt) {
            setTokenStatus('already-verified')
            navigate(continueTarget, { replace: true })
            return
          }
        }
        setTokenStatus('error')
      })
  }, [
    token,
    isLoggedIn,
    userRole,
    continueTarget,
    navigate,
    mutate,
    submitVerifyToken,
  ])

  if (token) {
    if (
      tokenStatus === 'verifying' ||
      (tokenStatus === 'success' && isLoggedIn)
    ) {
      return <Spinner fullPage />
    }

    return (
      <div className={styles.page}>
        <div className={styles.content}>
          {tokenStatus === 'success' && !isLoggedIn && (
            <>
              <h1 className={styles.title}>Email verified</h1>
              <p className={styles.subtitle}>Your email has been verified.</p>
              <Link
                to={loginPathWithNext(
                  destinationAfterVerify(joinedCompanyName),
                )}>
                <Button>Log in</Button>
              </Link>
            </>
          )}

          {tokenStatus === 'already-verified' && (
            <>
              <h1 className={styles.title}>Already verified</h1>
              <p className={styles.subtitle}>
                Your email address is already verified.
              </p>
              <Button onClick={() => navigate(continueTarget)}>
                {safeRedirect ? 'Continue application' : 'Go to dashboard'}
              </Button>
            </>
          )}

          {tokenStatus === 'error' && (
            <>
              <h1 className={styles.title}>Link invalid or expired</h1>
              <p className={styles.subtitle}>
                This verification link is invalid or has expired.
              </p>
              {isLoggedIn ? (
                <Button
                  onClick={() =>
                    setSearchParams(
                      safeRedirect ? { redirect: safeRedirect } : {},
                    )
                  }>
                  Resend verification email
                </Button>
              ) : (
                <Link to={loginPathWithNext(safeRedirect)}>
                  <Button>Log in to resend</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Button
          variant="outline"
          size="sm"
          icon={<HiArrowRightOnRectangle />}
          onClick={() => logout()}>
          Log out
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <HiOutlineMail />
          </div>
          <div>
            <h1 className={styles.title}>Email & account</h1>
            <p className={styles.subtitle}>
              Manage your email address and ensure your account is secure.
            </p>
          </div>
        </div>

        <EmailVerificationPanel redirectPath={safeRedirect ?? undefined} />
      </div>
    </div>
  )
}

export default AccountEmailVerification
