import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { IoIosArrowDown, IoMdNotificationsOutline } from 'react-icons/io'

import { NotificationPanel } from '@/components/features/notifications/NotificationPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Typography'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

import styles from './LoggedInUserBadge.module.scss'
import { UserMenu } from './UserMenu'
import { useUserIdentity } from './useUserIdentity'

const NOTIFICATION_ROUTE_BY_ROLE: Partial<Record<string, string>> = {
  talent: '/talentDashboard/notification',
  recruiter: '/recruiterDashboard/notifications',
  admin: '/adminDashboard/notifications',
}

export const LoggedInUserBadge: React.FC = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { unReadCount } = useNotifications()
  const {
    role,
    isLoading,
    error,
    firstName,
    lastName,
    fullName,
    imageUrl,
    roleLabel,
  } = useUserIdentity()

  const notificationRoute = role ? NOTIFICATION_ROUTE_BY_ROLE[role] : undefined

  const toggleDropdown = () => {
    setIsNotificationsOpen(false)
    setIsDropdownVisible((prev) => !prev)
  }

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
        aria-expanded={notificationRoute ? isNotificationsOpen : undefined}
        data-tour="nav-notifications">
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
              src={imageUrl}
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
            {roleLabel && (
              <Text
                as="span"
                size="fs-sm"
                color="muted"
                className={styles.subtitle}>
                {roleLabel}
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
        <UserMenu onClose={() => setIsDropdownVisible(false)} />
      )}
    </div>
  )
}
