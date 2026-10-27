import React, { ReactNode } from 'react'

import { EyebrowPill } from './EyebrowPill'
import styles from './PageHero.module.scss'

type PageHeroProps = {
  eyebrow?: ReactNode
  title: ReactNode
  meta?: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}

export const PageHero = ({
  eyebrow,
  title,
  meta,
  subtitle,
  children,
}: PageHeroProps) => (
  <section className={styles.hero}>
    {eyebrow && <EyebrowPill>{eyebrow}</EyebrowPill>}
    <h1 className={styles.title}>{title}</h1>
    {meta && <p className={styles.meta}>{meta}</p>}
    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    {children && <div className={styles.extra}>{children}</div>}
  </section>
)
