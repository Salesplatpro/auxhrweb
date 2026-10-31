import React, { ReactNode } from 'react'

import styles from './SectionHeading.module.scss'

type SectionHeadingProps = {
  title: ReactNode
  subtitle?: ReactNode
}

export const SectionHeading = ({ title, subtitle }: SectionHeadingProps) => (
  <div className={styles.heading}>
    <h2 className={styles.title}>{title}</h2>
    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
  </div>
)
