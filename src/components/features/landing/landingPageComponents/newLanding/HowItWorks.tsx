import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './HowItWorks.module.scss'
import {
  HowItWorksStep,
  howItWorksSteps,
  StepCard,
} from './howItWorksStepsData'
import { EyebrowPill } from './ui'

const StepMock = ({ card }: { card: StepCard }) => {
  if (card.kind === 'choices') {
    return (
      <div className={styles.choiceList}>
        {card.items.map((item) => (
          <span
            key={item.label}
            className={cn(
              styles.choice,
              styles[card.control],
              item.on && styles.on,
            )}>
            <span className={styles.choiceMark} />
            {item.label}
          </span>
        ))}
      </div>
    )
  }

  if (card.kind === 'compare') {
    return (
      <div className={styles.compareMock}>
        <p className={styles.compareSide}>
          <strong>{card.left.title}</strong>
          {card.left.text}
        </p>
        <span className={styles.compareScore}>{card.score}</span>
        <p className={styles.compareSide}>
          <strong>{card.right.title}</strong>
          {card.right.text}
        </p>
      </div>
    )
  }

  if (card.kind === 'bars') {
    return (
      <div className={styles.barsMock}>
        {card.heights.map((height, index) => (
          <span key={index} className={styles.bar} style={{ height }} />
        ))}
      </div>
    )
  }

  if (card.kind === 'chart') {
    return (
      <div className={styles.chartMock}>
        <div className={styles.statChips}>
          {card.stats.map((stat, index) => (
            <span key={index} className={styles.statChip}>
              <strong>{stat.value}</strong> {stat.label}
            </span>
          ))}
        </div>
        <div className={styles.chartCard}>
          {card.heights.map((height, index) => (
            <span key={index} className={styles.chartBar} style={{ height }} />
          ))}
        </div>
      </div>
    )
  }

  if (card.kind === 'chat') {
    return (
      <div className={styles.chatMock}>
        {card.messages.map((message) => (
          <p
            key={message.text}
            className={cn(styles.bubble, message.mine && styles.mine)}>
            {message.text}
            <span>Read</span>
          </p>
        ))}
      </div>
    )
  }

  if (card.kind === 'search') {
    return (
      <div className={styles.searchMock}>
        <img src={card.icon} alt="" aria-hidden />
        <span>{card.placeholder}</span>
      </div>
    )
  }

  if (card.kind === 'pill') {
    return (
      <div className={styles.pillMock}>
        <img src={card.icon} alt="" aria-hidden />
        <span>{card.text}</span>
      </div>
    )
  }

  if (card.kind === 'skeletonTable') {
    return (
      <div className={styles.skeletonCard}>
        {card.columns.map((rows, columnIndex) => (
          <div key={columnIndex} className={styles.skeletonColumn}>
            {rows.map((width, rowIndex) => (
              <div key={rowIndex} className={styles.skeletonCell}>
                <span
                  className={styles.skeletonBar}
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.profileCard}>
      <span className={styles.iconBadge}>
        <img src={card.badgeIcon} alt="" aria-hidden />
      </span>
      <p className={styles.profileName}>{card.name}</p>
      <div className={styles.profileMeta}>
        <span className={styles.profileRole}>{card.role}</span>
        <span className={styles.fitBadge}>{card.fitLabel}</span>
      </div>
    </div>
  )
}

type HowItWorksProps = {
  eyebrow?: ReactNode
  heading?: ReactNode
  subcopy?: ReactNode
  steps?: HowItWorksStep[]
  variant?: 'steps' | 'features'
}

export const HowItWorks = ({
  eyebrow,
  heading = "Great candidates shouldn't get lost in a pile of CVs...",
  subcopy = 'AuxHR helps you cut through the noise and focus on the right candidates with automated semantic distillation.',
  steps = howItWorksSteps,
  variant = 'steps',
}: HowItWorksProps) => (
  <section className={cn(styles.section, styles[variant])}>
    <div className={styles.copy}>
      {eyebrow && <EyebrowPill>{eyebrow}</EyebrowPill>}
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.subcopy}>{subcopy}</p>
    </div>

    <div className={styles.grid}>
      {variant === 'steps' && <span className={styles.connector} aria-hidden />}
      {steps.map((step) => (
        <div key={step.id} className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.badge}>{step.number}</span>
            <h3 className={styles.title}>{step.title}</h3>
            <p className={styles.description}>{step.description}</p>
          </div>
          <div className={styles.mockPanel}>
            <StepMock card={step.card} />
          </div>
        </div>
      ))}
    </div>
  </section>
)
