import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { FiArrowRight, FiShield } from 'react-icons/fi'
import { HiOutlineRocketLaunch, HiOutlineSparkles } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { notify } from '@/utils/toastNotifications'

import { useDisplayCurrency } from '../hooks/useDisplayCurrency'
import { usePaidCheckout } from '../hooks/usePaidCheckout'
import { usePricingCatalog } from '../hooks/usePricingCatalog'
import {
  BillingInterval,
  DEFAULT_BILLING_PLAN_KEY,
  isSubscriptionPlan,
  PricingPlan,
} from '../types'
import { PricingCard } from './PricingCard'
import cardStyles from './PricingCard.module.scss'
import styles from './PricingContent.module.scss'

const valueIcon = (icon: string) => {
  if (icon === 'rocket') return <HiOutlineRocketLaunch size={22} />
  if (icon === 'shield') return <FiShield size={22} />
  return <HiOutlineSparkles size={22} />
}

type PricingContentProps = {
  variant?: 'public' | 'dashboard'
  currentPlan?: string
}

export const PricingContent: React.FC<PricingContentProps> = ({
  variant = 'public',
  currentPlan = DEFAULT_BILLING_PLAN_KEY,
}) => {
  const { catalog, isLoading, error } = usePricingCatalog()
  const { currency, isLoading: isFindingCurrency } = useDisplayCurrency()
  const { startCheckout, checkingOutPlanKey } = usePaidCheckout()
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)

  const updateCarouselControls = () => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < maxScroll - 8)
  }

  useEffect(() => {
    if (!catalog?.plans.length) return
    const el = trackRef.current
    if (!el) return

    const frame = requestAnimationFrame(updateCarouselControls)
    el.addEventListener('scroll', updateCarouselControls, { passive: true })
    window.addEventListener('resize', updateCarouselControls)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', updateCarouselControls)
      window.removeEventListener('resize', updateCarouselControls)
    }
  }, [catalog?.plans.length])

  const scrollCarousel = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(`.${cardStyles.card}`)
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (isLoading || isFindingCurrency) {
    return <Spinner fullPage={variant === 'public'} />
  }
  if (error || !catalog) {
    return (
      <p className={styles.unavailable}>Pricing is temporarily unavailable.</p>
    )
  }

  const isYearly = interval === 'annually'
  const salesHref = catalog.contact.href

  const onSelect = async (plan: PricingPlan) => {
    if (plan.key === DEFAULT_BILLING_PLAN_KEY) {
      if (variant === 'dashboard' || (isLoggedIn && userRole === 'recruiter')) {
        notify(
          'info',
          'Pay per Use is billed when you post a job — no monthly subscription.',
        )
        navigate('/recruiterDashboard/myJobPosts')
        return
      }
      navigate('/register')
      return
    }

    if (!isSubscriptionPlan(plan)) {
      notify('error', 'This plan is not available for checkout.')
      return
    }

    const checkoutInterval: BillingInterval =
      isYearly && plan.yearlyAmountNgn == null ? 'monthly' : interval

    await startCheckout(plan.key, checkoutInterval)
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>{catalog.hero.kicker}</p>
          <h1 className={styles.title}>{catalog.hero.title}</h1>
          <p className={styles.subtitle}>{catalog.hero.subtitle}</p>
          <div
            className={styles.toggle}
            role="tablist"
            aria-label="Billing interval">
            <button
              type="button"
              className={cn(styles.toggleButton, {
                [styles.active]: !isYearly,
              })}
              onClick={() => setInterval('monthly')}>
              Monthly billing
            </button>
            <button
              type="button"
              className={cn(styles.toggleButton, {
                [styles.active]: isYearly,
              })}
              onClick={() => setInterval('annually')}>
              Annual billing
            </button>
          </div>
        </div>
      </header>

      <div className={styles.plansSection}>
        <div className={styles.carouselHeader}>
          {canPrev ? (
            <button
              type="button"
              className={styles.carouselLink}
              onClick={() => scrollCarousel(-1)}>
              Prev
            </button>
          ) : (
            <span />
          )}
          {canNext ? (
            <button
              type="button"
              className={styles.carouselLink}
              onClick={() => scrollCarousel(1)}>
              See More
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className={styles.track} ref={trackRef}>
          {catalog.plans.map((plan) => (
            <PricingCard
              key={plan.key}
              plan={plan}
              currency={currency}
              currencySymbol={catalog.currencySymbol}
              isYearly={isYearly}
              isCurrent={currentPlan === plan.key && variant === 'dashboard'}
              isCheckingOut={checkingOutPlanKey === plan.key}
              salesHref={salesHref}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <div className={styles.lower}>
        <section className={styles.why}>
          <div>
            <span className={styles.whyBadge}>{catalog.valueProps.badge}</span>
            <h2 className={styles.whyTitle}>{catalog.valueProps.title}</h2>
            <p className={styles.whyBody}>{catalog.valueProps.body}</p>
          </div>
          <div className={styles.whyGrid}>
            {catalog.valueProps.items.map((item) => (
              <div key={item.title} className={styles.whyItem}>
                {valueIcon(item.icon)}
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <p className={styles.contact}>
          {catalog.contact.prompt}{' '}
          <a href={catalog.contact.href}>
            {catalog.contact.cta} <FiArrowRight size={14} />
          </a>
        </p>
      </div>
    </div>
  )
}
