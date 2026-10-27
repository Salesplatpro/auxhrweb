import React, { useEffect, useRef, useState } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import { BsBuilding } from 'react-icons/bs'
import {
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi2'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'

import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { peoplePaths } from '@/features/people/paths'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getBillingPlanBadge } from '@/features/pricing/utils/getBillingPlanBadge'
import { useProfile } from '@/features/profile/hooks/useProfile'

import styles from './CompanyBanner.module.scss'

interface CompanyBannerProps {
  onNavigate?: () => void
}

export const CompanyBanner: React.FC<CompanyBannerProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { profile } = useProfile()
  const { isOwner, canManagePeople } = usePeopleAccess()
  const activeOrganization = profile?.activeOrganization
  const { billingPlan } = getActiveOrganizationBilling(profile)

  const rows = [
    {
      label: 'Manage companies',
      icon: <HiOutlineUserGroup size={16} />,
      path: '/recruiterDashboard/company',
    },
    {
      label: 'Create company',
      icon: <AiOutlinePlus size={16} />,
      path: '/recruiterDashboard/company/new',
    },
    ...(canManagePeople
      ? [
          {
            label: 'Employees',
            icon: <HiOutlineUsers size={16} />,
            path: peoplePaths.employees,
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            label: 'Access log',
            icon: <HiOutlineShieldCheck size={16} />,
            path: peoplePaths.accessLog,
          },
        ]
      : []),
    {
      label: 'View plan',
      icon: <HiOutlineCreditCard size={16} />,
      path: '/recruiterDashboard/plan',
    },
  ]

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

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      data-tour="company-switcher">
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}>
        <div className={styles.iconBox}>
          <BsBuilding size={18} />
        </div>
        <div className={styles.info}>
          <span className={styles.name}>
            {activeOrganization?.name ?? 'No company yet'}
          </span>
          <span className={styles.metaRow}>
            {activeOrganization && (
              <span className={styles.activeTag}>Active</span>
            )}
            <span className={styles.planTag}>
              {getBillingPlanBadge(billingPlan).status}
            </span>
          </span>
        </div>
        {isOpen ? <IoIosArrowUp size={16} /> : <IoIosArrowDown size={16} />}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {rows.map((row) => (
            <button
              key={row.label}
              type="button"
              className={styles.dropdownRow}
              onClick={() => goTo(row.path)}>
              <div className={styles.iconBox}>{row.icon}</div>
              <span>{row.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
