import React, { ReactNode } from 'react'

import styles from './EyebrowPill.module.scss'

export const EyebrowPill = ({ children }: { children: ReactNode }) => (
  <span className={styles.pill}>
    <span className={styles.dot} aria-hidden />
    {children}
  </span>
)
