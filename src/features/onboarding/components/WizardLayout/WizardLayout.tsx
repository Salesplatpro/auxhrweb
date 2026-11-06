import React, { ReactNode } from 'react'
import { LuCheck } from 'react-icons/lu'

import { StepRail, StepRailStep } from '@/components/ui/StepRail'
import { TipCard } from '@/components/ui/TipCard'

import styles from './WizardLayout.module.scss'

type WizardLayoutProps = {
  intro: ReactNode
  previewLabel: string
  preview: ReactNode
  children: ReactNode
}

export const WizardLayout = ({
  intro,
  previewLabel,
  preview,
  children,
}: WizardLayoutProps) => (
  <div className={styles.layout}>
    <aside className={styles.intro}>{intro}</aside>
    <div className={styles.main}>{children}</div>
    <aside className={styles.preview} aria-label={previewLabel}>
      <p className={styles.eyebrow}>{previewLabel}</p>
      {preview}
    </aside>
  </div>
)

type WizardIntroProps = {
  eyebrow: string
  title: string
  lead: string
  steps: StepRailStep[]
  current: number
  tip: { icon: ReactNode; title: string; body: ReactNode }
}

export const WizardIntro = ({
  eyebrow,
  title,
  lead,
  steps,
  current,
  tip,
}: WizardIntroProps) => (
  <>
    <p className={styles.eyebrow}>{eyebrow}</p>
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.lead}>{lead}</p>
    <StepRail steps={steps} current={current} label="Setup steps" />
    <TipCard icon={tip.icon} title={tip.title}>
      {tip.body}
    </TipCard>
  </>
)

type WizardCardProps = {
  step: number
  total: number
  title: string
  subtitle: string
  draftSaved?: boolean
  footer: ReactNode
  children: ReactNode
}

export const WizardCard = ({
  step,
  total,
  title,
  subtitle,
  draftSaved = false,
  footer,
  children,
}: WizardCardProps) => (
  <section className={styles.card} aria-labelledby="wizard-card-title">
    <div className={styles.cardTop}>
      <span className={styles.stepLabel}>
        Step {step} of {total}
      </span>
      {draftSaved && (
        <span className={styles.draft} role="status">
          <LuCheck aria-hidden /> Draft saved
        </span>
      )}
    </div>
    <h2 id="wizard-card-title" className={styles.cardTitle}>
      {title}
    </h2>
    <p className={styles.cardSubtitle}>{subtitle}</p>
    <div className={styles.fields}>{children}</div>
    <div className={styles.footer}>{footer}</div>
  </section>
)
