import React from 'react'
import { FiCheck } from 'react-icons/fi'

import { formatPlanPrice } from '../formatPlanPrice'
import type { DisplayCurrency } from '../hooks/useDisplayCurrency'
import { isSubscriptionPlan, PricingFeature, PricingPlan } from '../types'
import styles from './PricingCard.module.scss'

const featureLabel = (feature: PricingFeature) =>
  feature.text ?? feature.label ?? ''

const featureIncluded = (feature: PricingFeature) => feature.included !== false

const planTitle = (name: string) =>
  /plan$/i.test(name.trim()) ? name : `${name} plan`

export type PricingCardProps = {
  plan: PricingPlan
  currency: DisplayCurrency
  currencySymbol: string
  isYearly: boolean
  isCurrent: boolean
  isCheckingOut: boolean
  salesHref: string
  onSelect: (plan: PricingPlan) => void
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  currency,
  currencySymbol,
  isYearly,
  isCurrent,
  isCheckingOut,
  salesHref,
  onSelect,
}) => {
  const { amount, yearly } = formatPlanPrice(
    plan,
    isYearly ? 'annually' : 'monthly',
    currency,
    currencySymbol,
  )
  const caption =
    plan.priceCaption ?? (yearly ? 'Billed annually' : plan.description)
  const isMailto = salesHref.startsWith('mailto:')

  return (
    <article className={styles.card}>
      {plan.badge && (
        <span
          className={
            plan.badgeTone === 'success' ? styles.badgeSuccess : styles.badge
          }>
          {plan.badge}
        </span>
      )}
      <p className={styles.planEyebrow}>{planTitle(plan.name)}</p>
      <p className={styles.price}>{amount ?? '—'}</p>
      <p className={styles.planCaption}>{caption}</p>

      <div className={styles.ctaStack}>
        <button
          type="button"
          className={styles.ctaPrimary}
          onClick={() => onSelect(plan)}
          disabled={isCheckingOut || isCurrent}>
          {isCheckingOut && isSubscriptionPlan(plan)
            ? 'Redirecting…'
            : isCurrent
            ? 'Current plan'
            : plan.cta}
        </button>
        <a
          className={styles.ctaSecondary}
          href={salesHref}
          target={isMailto ? undefined : '_blank'}
          rel={isMailto ? undefined : 'noopener noreferrer'}>
          {plan.secondaryCta ?? 'Chat to sales'}
        </a>
      </div>

      <div className={styles.featuresBlock}>
        <p className={styles.featuresLabel}>FEATURES</p>
        {plan.featuresIntro && (
          <p className={styles.featuresIntro}>{plan.featuresIntro}</p>
        )}
        <ul className={styles.features}>
          {plan.features.map((feature) => {
            const label = featureLabel(feature)
            if (!label || !featureIncluded(feature)) return null
            return (
              <li key={label} className={styles.feature}>
                <span className={styles.checkIcon} aria-hidden>
                  <FiCheck size={12} />
                </span>
                <span>{label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}
