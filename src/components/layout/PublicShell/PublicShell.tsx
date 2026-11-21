import React, { ReactNode } from 'react'
import { LuCircleHelp } from 'react-icons/lu'
import { Link } from 'react-router-dom'

import logoMark from '@/components/features/landing/landingPageComponents/newLanding/assets/logo-mark.png'
import { Avatar } from '@/components/ui/Avatar'
import { paths } from '@/paths'

import styles from './PublicShell.module.scss'

type PublicShellProps = {
  companyName?: string | null
  title?: string
  width?: 'narrow' | 'medium' | 'wide'
  children: ReactNode
}

const nameParts = (name: string) => {
  const [first = '', second = ''] = name.trim().split(/\s+/)
  return { firstName: first, lastName: second }
}

export const PublicShell = ({
  companyName,
  title,
  width = 'medium',
  children,
}: PublicShellProps) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <img src={logoMark} alt="AuxHR" className={styles.logo} />
        {(title || companyName) && (
          <div className={styles.context}>
            {companyName && (
              <Avatar
                {...nameParts(companyName)}
                size="md"
                className={styles.companyMark}
              />
            )}
            <div className={styles.contextText}>
              {title && <p className={styles.contextTitle}>{title}</p>}
              {companyName && (
                <p className={styles.contextSub}>{companyName}</p>
              )}
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
    <main className={[styles.main, styles[width]].join(' ')}>{children}</main>
  </div>
)
