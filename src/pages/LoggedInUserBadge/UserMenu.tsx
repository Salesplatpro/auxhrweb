import cn from 'classnames'
import React from 'react'
import {
  HiOutlineCreditCard,
  HiOutlineLockClosed,
  HiOutlineQuestionMarkCircle,
  HiOutlineUser,
} from 'react-icons/hi'
import { HiArrowRightOnRectangle } from 'react-icons/hi2'
import { IoIosArrowForward } from 'react-icons/io'
import { IoCheckmarkCircle } from 'react-icons/io5'
import { MdOutlineWorkspacePremium } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { changePasswordPathForRole } from '@/features/auth/utils/dashboardPath'
import { getEmailVerificationBadge } from '@/features/email-verification/utils/getEmailVerificationBadge'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getBillingPlanBadge } from '@/features/pricing/utils/getBillingPlanBadge'
import { pageTourFor, useTourStore } from '@/features/product-tour'
import { ThemeMode, useTheme } from '@/features/theme/ThemeProvider'

import styles from './UserMenu.module.scss'
import { useUserIdentity } from './useUserIdentity'

const PROFILE_ROUTE_BY_ROLE: Partial<Record<string, string>> = {
  talent: '/talentDashboard/talentProfile',
  recruiter: '/recruiterDashboard/profile',
}

const PLAN_ROUTE_BY_ROLE: Partial<Record<string, string>> = {
  recruiter: '/recruiterDashboard/plan',
}

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

type UserMenuProps = {
  placement?: 'below' | 'above'
  onClose: () => void
}

export const UserMenu = ({ placement = 'below', onClose }: UserMenuProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const startTour = useTourStore((state) => state.start)
  const logout = useAuthStore((state) => state.logout)
  const { mode: themeMode, setMode: setThemeMode } = useTheme()
  const { role, profile, firstName, lastName, fullName, email, imageUrl } =
    useUserIdentity()

  const profileRoute = role ? PROFILE_ROUTE_BY_ROLE[role] : undefined
  const planRoute = role ? PLAN_ROUTE_BY_ROLE[role] : undefined
  const changePasswordRoute = changePasswordPathForRole(role)
  const isVerified = !!profile?.emailVerifiedAt
  const verificationBadge = getEmailVerificationBadge(profile?.emailVerifiedAt)
  const planBadge = getBillingPlanBadge(
    getActiveOrganizationBilling(profile).billingPlan,
  )

  const tourRole = role === 'talent' || role === 'recruiter' ? role : null
  const hasPageTour = !!tourRole && !!pageTourFor(tourRole, pathname)

  const goTo = (path: string) => {
    onClose()
    navigate(path)
  }

  const takeTour = () => {
    if (!tourRole) return
    onClose()
    startTour(tourRole, hasPageTour ? 'page' : undefined)
  }

  return (
    <div
      className={cn(styles.menu, {
        [styles.above]: placement === 'above',
      })}
      role="menu">
      <div className={styles.header}>
        <div className={styles.headerAvatar}>
          <Avatar
            firstName={firstName}
            lastName={lastName}
            src={imageUrl}
            size="lg"
          />
          <span className={styles.onlineDot} aria-hidden />
        </div>
        <p className={styles.headerName}>{fullName}</p>
        <p className={styles.headerEmail}>{email}</p>
        <div className={styles.headerPills}>
          <span
            className={styles.pill}
            style={{
              backgroundColor: verificationBadge.backgroundColor,
              color: verificationBadge.color,
            }}>
            {isVerified ? (
              <IoCheckmarkCircle size={14} />
            ) : (
              <span className={styles.pillDot} />
            )}
            {verificationBadge.status}
          </span>
          {role === 'recruiter' && (
            <span
              className={styles.pill}
              style={{
                backgroundColor: planBadge.backgroundColor,
                color: planBadge.color,
              }}>
              <MdOutlineWorkspacePremium size={14} />
              {planBadge.status}
            </span>
          )}
        </div>
      </div>

      {profileRoute && (
        <button
          type="button"
          className={styles.row}
          onClick={() => goTo(profileRoute)}
          role="menuitem">
          <span className={styles.rowIcon}>
            <HiOutlineUser size={20} />
          </span>
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>My Profile</span>
            <span className={styles.rowHint}>View and manage your profile</span>
          </span>
          <IoIosArrowForward className={styles.rowChevron} />
        </button>
      )}

      {planRoute && (
        <button
          type="button"
          className={styles.row}
          onClick={() => goTo(planRoute)}
          role="menuitem">
          <span className={styles.rowIcon}>
            <HiOutlineCreditCard size={20} />
          </span>
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>Plan & Billing</span>
            <span className={styles.rowHint}>
              View your plan details and billing history
            </span>
          </span>
          <IoIosArrowForward className={styles.rowChevron} />
        </button>
      )}

      {changePasswordRoute && (
        <button
          type="button"
          className={styles.row}
          onClick={() => goTo(changePasswordRoute)}
          role="menuitem">
          <span className={styles.rowIcon}>
            <HiOutlineLockClosed size={20} />
          </span>
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>Change password</span>
            <span className={styles.rowHint}>
              Update the password for your account
            </span>
          </span>
          <IoIosArrowForward className={styles.rowChevron} />
        </button>
      )}

      {tourRole && (
        <button
          type="button"
          className={styles.row}
          onClick={takeTour}
          role="menuitem">
          <span className={styles.rowIcon}>
            <HiOutlineQuestionMarkCircle size={20} />
          </span>
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>
              {hasPageTour ? 'Tour this page' : 'Take the tour'}
            </span>
            <span className={styles.rowHint}>
              {hasPageTour
                ? 'See what this page is for'
                : 'A quick look around the app'}
            </span>
          </span>
          <IoIosArrowForward className={styles.rowChevron} />
        </button>
      )}

      <div className={styles.appearance}>
        <p className={styles.appearanceLabel}>Appearance</p>
        <div className={styles.themeSwitch} role="group" aria-label="Theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cn(styles.themeOption, {
                [styles.themeOptionActive]: themeMode === option.id,
              })}
              onClick={() => setThemeMode(option.id)}
              aria-pressed={themeMode === option.id}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={cn(styles.row, styles.logoutRow)}
        onClick={() => logout()}
        role="menuitem">
        <span className={cn(styles.rowIcon, styles.logoutIcon)}>
          <HiArrowRightOnRectangle size={20} />
        </span>
        <span className={styles.rowCopy}>
          <span className={cn(styles.rowTitle, styles.logoutTitle)}>
            Logout
          </span>
          <span className={styles.rowHint}>Sign out of your account</span>
        </span>
      </button>
    </div>
  )
}
