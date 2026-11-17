import React, { ReactNode } from 'react'
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import logoMark from '@/components/features/landing/landingPageComponents/newLanding/assets/logo-mark.png'
import { initialsOf } from '@/features/talent-applications/format'
import { PipelineOrganization } from '@/features/talent-applications/types'

import styles from './TestShell.module.scss'

type TestShellProps = {
  title?: string
  organization?: PipelineOrganization | null
  children: ReactNode
}

export const TestShell = ({
  title,
  organization,
  children,
}: TestShellProps) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <img src={logoMark} alt="AuxHR" className={styles.logo} />
      {title && organization && (
        <div className={styles.context}>
          <span className={styles.badge} aria-hidden>
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt="" />
            ) : (
              initialsOf(organization.name)
            )}
          </span>
          <span className={styles.contextText}>
            <span className={styles.contextTitle}>{title}</span>
            <span className={styles.contextCompany}>{organization.name}</span>
          </span>
        </div>
      )}
      <Link to="/talentDashboard/support" className={styles.help}>
        <HiOutlineQuestionMarkCircle aria-hidden />
        <span className={styles.helpLong}>Need help?</span>
        <span className={styles.helpShort}>Help</span>
      </Link>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
)
