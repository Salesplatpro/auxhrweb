import React, { ReactNode } from 'react'

import logoMark from '@/components/features/landing/landingPageComponents/newLanding/assets/logo-mark.png'
import { ArcBackdrop } from '@/components/ui/ArcBackdrop'

import { AccountChip } from '../AccountChip'
import styles from './OnboardingShell.module.scss'

type OnboardingShellProps = {
  status?: { icon: ReactNode; label: string }
  account: React.ComponentProps<typeof AccountChip>
  children: ReactNode
}

export const OnboardingShell = ({
  status,
  account,
  children,
}: OnboardingShellProps) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <img src={logoMark} alt="AuxHR" className={styles.logo} />
      {status && (
        <p className={styles.status}>
          <span className={styles.statusIcon} aria-hidden>
            {status.icon}
          </span>
          {status.label}
        </p>
      )}
      <div className={styles.account}>
        <AccountChip {...account} />
      </div>
    </header>
    <main className={styles.panel}>
      <ArcBackdrop />
      <div className={styles.inner}>{children}</div>
    </main>
  </div>
)
