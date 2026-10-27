import React, { ReactNode } from 'react'

import styles from './IconTile.module.scss'

export const IconTile = ({ children }: { children: ReactNode }) => (
  <span className={styles.tile} aria-hidden>
    {children}
  </span>
)
