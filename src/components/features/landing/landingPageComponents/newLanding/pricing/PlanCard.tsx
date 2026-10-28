import React from 'react'
import { FiArrowUpRight, FiCheck } from 'react-icons/fi'

import styles from './PlanCard.module.scss'

type PlanCardProps = {
  name: string
  description: string
  price: string
  priceSuffix?: string
  caption?: string
  badge?: string
  highlighted?: boolean
  ctaLabel: string
  onCta: () => void
  busy?: boolean
  featuresIntro?: string | null
  features: string[]
}

export const PlanCard = ({
  name,
  description,
  price,
  priceSuffix,
  caption,
  badge,
  highlighted,
  ctaLabel,
  onCta,
  busy,
  featuresIntro,
  features,
}: PlanCardProps) => (
  <article
    className={[styles.card, highlighted ? styles.highlighted : ''].join(' ')}>
    <div className={styles.header}>
      <h3 className={styles.name}>{name}</h3>
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
    <p className={styles.description}>{description}</p>

    <p className={styles.price}>
      <span className={styles.amount}>{price}</span>
      {priceSuffix && <span className={styles.suffix}>{priceSuffix}</span>}
    </p>
    {caption && <p className={styles.caption}>{caption}</p>}

    <button
      type="button"
      className={styles.cta}
      onClick={onCta}
      disabled={busy}>
      {busy ? 'Redirecting…' : ctaLabel}
      <FiArrowUpRight size={16} aria-hidden />
    </button>

    <div className={styles.divider} />

    {featuresIntro && <p className={styles.featuresIntro}>{featuresIntro}</p>}
    <ul className={styles.features}>
      {features.map((feature) => (
        <li key={feature} className={styles.feature}>
          <span className={styles.check} aria-hidden>
            <FiCheck size={11} />
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </article>
)
