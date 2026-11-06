import React, { ReactNode } from 'react'

import { BrandMosaic } from '@/components/ui/BrandMosaic'

import styles from './AuthShell.module.scss'

type AuthShellProps = {
  accent?: 'brand' | 'violet'
  children: ReactNode
}

export const AuthShell = ({ accent = 'brand', children }: AuthShellProps) => (
  <div className={styles.shell}>
    <div className={styles.art}>
      <BrandMosaic accent={accent} />
    </div>
    <div className={styles.content}>{children}</div>
  </div>
)
