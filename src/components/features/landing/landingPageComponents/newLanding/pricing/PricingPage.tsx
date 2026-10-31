import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { usePricingCatalog } from '@/features/pricing/hooks/usePricingCatalog'
import { usePublicPlanSelect } from '@/features/pricing/hooks/usePublicPlanSelect'
import { BillingInterval } from '@/features/pricing/types'
import { paths } from '@/paths'

import { CtaBanner } from '../CtaBanner'
import { PageHero, SegmentedToggle } from '../ui'
import { ComparisonTable } from './ComparisonTable'
import { PlanCard } from './PlanCard'
import { planFeatureLabels, planPrice } from './planDisplay'
import { Audience, pricingFaqs, pricingHero, talentPlan } from './pricingData'
import { PricingFaq } from './PricingFaq'
import styles from './PricingPage.module.scss'

export const PricingPage = () => {
  const { catalog, isLoading, error } = usePricingCatalog()
  const { selectPlan, checkingOutPlanKey } = usePublicPlanSelect()
  const [audience, setAudience] = useState<Audience>('recruiter')
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const navigate = useNavigate()

  if (isLoading) return <Spinner fullPage />
  if (error || !catalog) {
    return (
      <p className={styles.unavailable}>Pricing is temporarily unavailable.</p>
    )
  }

  const isRecruiter = audience === 'recruiter'
  const isMailto = catalog.contact.href.startsWith('mailto:')

  return (
    <>
      <PageHero
        eyebrow={pricingHero.eyebrow}
        title={pricingHero.title}
        subtitle={pricingHero.subtitle}>
        <div className={styles.toggles}>
          <SegmentedToggle
            label="Pricing for"
            className={styles.audienceToggle}
            options={[
              { value: 'recruiter', label: 'Recruiter / Business' },
              { value: 'talent', label: 'Talent / Job seeker' },
            ]}
            value={audience}
            onChange={setAudience}
          />
          {isRecruiter && (
            <SegmentedToggle
              label="Billing interval"
              className={styles.intervalToggle}
              options={[
                { value: 'monthly', label: 'Monthly' },
                {
                  value: 'annually',
                  label: (
                    <span className={styles.annualLabel}>
                      Annual
                      <span className={styles.savePill}>
                        Save {catalog.yearlyDiscountPercent}%
                      </span>
                    </span>
                  ),
                },
              ]}
              value={interval}
              onChange={setInterval}
            />
          )}
        </div>
      </PageHero>

      <section className={styles.plans}>
        {isRecruiter ? (
          <>
            <div className={styles.grid}>
              {catalog.plans.map((plan) => {
                const price = planPrice(plan, interval, catalog.currencySymbol)
                return (
                  <PlanCard
                    key={plan.key}
                    name={plan.name}
                    description={plan.description}
                    price={price.amount}
                    priceSuffix={price.suffix}
                    caption={price.caption}
                    badge={plan.badge}
                    highlighted={plan.highlighted}
                    ctaLabel={plan.cta}
                    onCta={() => selectPlan(plan, interval)}
                    busy={checkingOutPlanKey === plan.key}
                    featuresIntro={plan.featuresIntro}
                    features={planFeatureLabels(plan)}
                  />
                )
              })}
            </div>
            <p className={styles.contact}>
              {catalog.contact.prompt}{' '}
              <a
                href={catalog.contact.href}
                target={isMailto ? undefined : '_blank'}
                rel={isMailto ? undefined : 'noopener noreferrer'}>
                {catalog.contact.cta}
              </a>
            </p>
          </>
        ) : (
          <div className={styles.grid}>
            <PlanCard
              name={talentPlan.name}
              description={talentPlan.description}
              price={talentPlan.price}
              caption={talentPlan.caption}
              highlighted
              ctaLabel={talentPlan.cta}
              onCta={() => navigate(`/${paths.register}`)}
              features={talentPlan.features}
            />
          </div>
        )}
      </section>

      {isRecruiter && <ComparisonTable plans={catalog.plans} />}
      <PricingFaq items={pricingFaqs(catalog)} />
      <CtaBanner />
    </>
  )
}
