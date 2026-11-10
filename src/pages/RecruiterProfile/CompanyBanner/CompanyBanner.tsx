import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import {
  HiChevronUpDown,
  HiOutlineCreditCard,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { Text } from '@/components/ui/Typography'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { usePricingCatalog } from '@/features/pricing/hooks/usePricingCatalog'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getPlanDisplayName } from '@/features/pricing/utils/getPlanDisplayName'
import { useProfile } from '@/features/profile/hooks/useProfile'

import styles from './CompanyBanner.module.scss'

interface CompanyBannerProps {
  onNavigate?: () => void
}

const ROWS = [
  {
    label: 'Manage companies',
    icon: <HiOutlineUserGroup size={16} />,
    path: '/recruiterDashboard/company',
  },
  {
    label: 'Create company',
    icon: <AiOutlinePlus size={16} />,
    path: ONBOARDING_PATHS.company,
  },
  {
    label: 'View plan',
    icon: <HiOutlineCreditCard size={16} />,
    path: '/recruiterDashboard/plan',
  },
]

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

export const CompanyBanner: React.FC<CompanyBannerProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { profile } = useProfile()
  const { catalog } = usePricingCatalog()
  const activeOrganization = profile?.activeOrganization
  const { usage } = useOrganizationUsage(activeOrganization?.id ?? null)
  const { billingPlan } = getActiveOrganizationBilling(profile)

  const members = usage?.meters.find(
    (meter) => meter.key === 'team_members',
  )?.used
  const meta = [
    `${getPlanDisplayName(billingPlan, catalog)} plan`,
    members ? `${members} member${members === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const goTo = (path: string) => {
    setIsOpen(false)
    onNavigate?.()
    navigate(path)
  }

  const name = activeOrganization?.name ?? 'No company yet'

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      data-tour="company-switcher">
      <button
        type="button"
        className={cn(styles.trigger, { [styles.open]: isOpen })}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu">
        <span className={styles.initials} aria-hidden>
          {activeOrganization ? initialsOf(activeOrganization.name) : '?'}
        </span>
        <span className={styles.info}>
          <Text as="span" size="fs-md" weight="bolder" className={styles.line}>
            {name}
          </Text>
          {activeOrganization && (
            <Text as="span" size="fs-sm" color="muted" className={styles.line}>
              {meta}
            </Text>
          )}
        </span>
        <HiChevronUpDown className={styles.chevron} size={18} aria-hidden />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          {ROWS.map((row) => (
            <button
              key={row.label}
              type="button"
              role="menuitem"
              className={styles.dropdownRow}
              onClick={() => goTo(row.path)}>
              <span className={styles.rowIcon} aria-hidden>
                {row.icon}
              </span>
              <Text as="span" size="fs-md" weight="bold">
                {row.label}
              </Text>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
