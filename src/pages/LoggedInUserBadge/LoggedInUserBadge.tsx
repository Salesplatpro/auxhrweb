import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import {
  HiOutlineCreditCard,
  HiOutlineLockClosed,
  HiOutlineQuestionMarkCircle,
  HiOutlineUser,
} from 'react-icons/hi'
import { HiArrowRightOnRectangle } from 'react-icons/hi2'
import {
  IoIosArrowDown,
  IoIosArrowForward,
  IoMdNotificationsOutline,
} from 'react-icons/io'
import { IoCheckmarkCircle } from 'react-icons/io5'
import { MdOutlineWorkspacePremium } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'

import { NotificationPanel } from '@/components/features/notifications/NotificationPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Typography'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { changePasswordPathForRole } from '@/features/auth/utils/dashboardPath'
import { getEmailVerificationBadge } from '@/features/email-verification/utils/getEmailVerificationBadge'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getBillingPlanBadge } from '@/features/pricing/utils/getBillingPlanBadge'
import { pageTourFor, useTourStore } from '@/features/product-tour'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { ProfileUser } from '@/features/profile/types'
import { ThemeMode, useTheme } from '@/features/theme/ThemeProvider'

import styles from './LoggedInUserBadge.module.scss'

const NOTIFICATION_ROUTE_BY_ROLE: Partial<Record<string, string>> = {
  talent: '/talentDashboard/notification',
  recruiter: '/recruiterDashboard/notifications',
  admin: '/adminDashboard/notifications',
}

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

const subtitleFor = (
  role: string | undefined,
  profile?: ProfileUser | null,
) => {
  if (role === 'recruiter') {
    const ownsCompany =
      !!profile?.id && profile.activeOrganization?.ownerId === profile.id
    return ownsCompany ? 'Recruiter · Owner' : 'Recruiter'
  }
  if (role === 'talent') return profile?.userRoles?.[0]?.name ?? 'Talent'
  if (role === 'admin') return 'Admin'
  return ''
}

export const LoggedInUserBadge: React.FC = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const startTour = useTourStore((state) => state.start)

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { profile: userInfo, isLoading, error } = useProfile()
  const { unReadCount } = useNotifications()
  const { mode: themeMode, setMode: setThemeMode } = useTheme()

  const role = user?.userRole
  const notificationRoute = role ? NOTIFICATION_ROUTE_BY_ROLE[role] : undefined
  const profileRoute = role ? PROFILE_ROUTE_BY_ROLE[role] : undefined
  const planRoute = role ? PLAN_ROUTE_BY_ROLE[role] : undefined
  const changePasswordRoute = changePasswordPathForRole(role)

  const firstName = userInfo?.firstName || user?.firstName || ''
  const lastName = userInfo?.lastName || user?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'Account'
  const email = userInfo?.email || user?.email || ''
  const isVerified = !!userInfo?.emailVerifiedAt
  const billing = getActiveOrganizationBilling(userInfo)
  const verificationBadge = getEmailVerificationBadge(userInfo?.emailVerifiedAt)
  const planBadge = getBillingPlanBadge(billing.billingPlan)

  const subtitle = subtitleFor(role, userInfo)

  const toggleDropdown = () => {
    setIsNotificationsOpen(false)
    setIsDropdownVisible((prev) => !prev)
  }

  const closeDropdown = () => setIsDropdownVisible(false)

  const toggleNotifications = () => {
    setIsDropdownVisible(false)
    setIsNotificationsOpen((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // A dialog opened from the panel renders outside it, so a click on one isn't "outside".
      if ((event.target as Element).closest?.('.react-responsive-modal-root')) {
        return
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false)
        setIsNotificationsOpen(false)
      }
    }

    if (isDropdownVisible || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownVisible, isNotificationsOpen])

  const tourRole = role === 'talent' || role === 'recruiter' ? role : null
  const hasPageTour = !!tourRole && !!pageTourFor(tourRole, pathname)

  const takeTour = () => {
    if (!tourRole) return
    closeDropdown()
    startTour(tourRole, hasPageTour ? 'page' : undefined)
  }

  const goTo = (path: string) => {
    closeDropdown()
    setIsNotificationsOpen(false)
    navigate(path)
  }

  return (
    <div
      className={styles.container}
      ref={dropdownRef}
      data-tour="profile-menu">
      <div
        className={cn(styles.notificationIcon, {
          [styles.notificationIconClickable]: !!notificationRoute,
        })}
        onClick={notificationRoute ? toggleNotifications : undefined}
        role={notificationRoute ? 'button' : undefined}
        aria-label="Notifications"
        aria-expanded={notificationRoute ? isNotificationsOpen : undefined}>
        <IoMdNotificationsOutline size={22} />
        {!!unReadCount && <span className={styles.unreadDot} aria-hidden />}
      </div>

      {isNotificationsOpen && notificationRoute ? (
        <NotificationPanel
          viewAllTo={notificationRoute}
          onNavigate={() => setIsNotificationsOpen(false)}
        />
      ) : null}

      {isLoading ? (
        <div className={styles.loadingRow}>
          <div className={styles.avatarSkeleton} />
          <div className={styles.textSkeletons}>
            <div className={cn(styles.skeletonLine, styles.short)} />
          </div>
        </div>
      ) : error ? (
        <div className={styles.errorText}>Error loading profile</div>
      ) : (
        <button
          type="button"
          className={styles.trigger}
          onClick={toggleDropdown}
          aria-expanded={isDropdownVisible}
          aria-haspopup="menu">
          <span className={styles.avatarWrap}>
            <Avatar
              firstName={firstName}
              lastName={lastName}
              src={userInfo?.profileImageUrl}
              size="md"
            />
          </span>
          <span className={styles.identity}>
            <Text
              as="span"
              size="fs-md"
              weight="bolder"
              className={styles.name}>
              {fullName}
            </Text>
            {subtitle && (
              <Text
                as="span"
                size="fs-sm"
                color="muted"
                className={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </span>
          <IoIosArrowDown
            size={16}
            className={cn(styles.chevron, {
              [styles.chevronOpen]: isDropdownVisible,
            })}
          />
        </button>
      )}

      {isDropdownVisible && !isLoading && !error && (
        <div className={styles.dropdownMenu} role="menu">
          <div className={styles.dropdownHeader}>
            <div className={styles.headerAvatar}>
              <Avatar
                firstName={firstName}
                lastName={lastName}
                src={userInfo?.profileImageUrl}
                size="lg"
              />
              <span className={styles.onlineDot} aria-hidden />
            </div>
            <p className={styles.headerName}>{fullName}</p>
            <p className={styles.headerEmail}>{email}</p>
            <div className={styles.headerPills}>
              <span
                className={cn(styles.pill, styles.verifiedPill)}
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
                  className={cn(styles.pill, styles.paidPill)}
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
              className={styles.menuRow}
              onClick={() => goTo(profileRoute)}
              role="menuitem">
              <span className={styles.menuIcon}>
                <HiOutlineUser size={20} />
              </span>
              <span className={styles.menuCopy}>
                <span className={styles.menuTitle}>My Profile</span>
                <span className={styles.menuHint}>
                  View and manage your profile
                </span>
              </span>
              <IoIosArrowForward className={styles.menuChevron} />
            </button>
          )}

          {planRoute && (
            <button
              type="button"
              className={styles.menuRow}
              onClick={() => goTo(planRoute)}
              role="menuitem">
              <span className={styles.menuIcon}>
                <HiOutlineCreditCard size={20} />
              </span>
              <span className={styles.menuCopy}>
                <span className={styles.menuTitle}>Plan & Billing</span>
                <span className={styles.menuHint}>
                  View your plan details and billing history
                </span>
              </span>
              <IoIosArrowForward className={styles.menuChevron} />
            </button>
          )}

          {changePasswordRoute && (
            <button
              type="button"
              className={styles.menuRow}
              onClick={() => goTo(changePasswordRoute)}
              role="menuitem">
              <span className={styles.menuIcon}>
                <HiOutlineLockClosed size={20} />
              </span>
              <span className={styles.menuCopy}>
                <span className={styles.menuTitle}>Change password</span>
                <span className={styles.menuHint}>
                  Update the password for your account
                </span>
              </span>
              <IoIosArrowForward className={styles.menuChevron} />
            </button>
          )}

          {tourRole && (
            <button
              type="button"
              className={styles.menuRow}
              onClick={takeTour}
              role="menuitem">
              <span className={styles.menuIcon}>
                <HiOutlineQuestionMarkCircle size={20} />
              </span>
              <span className={styles.menuCopy}>
                <span className={styles.menuTitle}>
                  {hasPageTour ? 'Tour this page' : 'Take the tour'}
                </span>
                <span className={styles.menuHint}>
                  {hasPageTour
                    ? 'See what this page is for'
                    : 'A quick look around the app'}
                </span>
              </span>
              <IoIosArrowForward className={styles.menuChevron} />
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
            className={cn(styles.menuRow, styles.logoutRow)}
            onClick={() => logout()}
            role="menuitem">
            <span className={cn(styles.menuIcon, styles.logoutIcon)}>
              <HiArrowRightOnRectangle size={20} />
            </span>
            <span className={styles.menuCopy}>
              <span className={cn(styles.menuTitle, styles.logoutTitle)}>
                Logout
              </span>
              <span className={styles.menuHint}>Sign out of your account</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
