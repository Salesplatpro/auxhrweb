import React from 'react'
import { Link } from 'react-router-dom'

import styles from './PageHero.module.scss'

export const pageHeroStyles = styles

type HeroMetaItem = {
  label: string
  value: React.ReactNode
}

type PageHeroProps = {
  kicker?: React.ReactNode
  title?: React.ReactNode
  lead?: React.ReactNode
  identity?: React.ReactNode
  pills?: React.ReactNode
  actions?: React.ReactNode
  meta?: HeroMetaItem[]
  chips?: React.ReactNode
  children?: React.ReactNode
  compact?: boolean
}

type HeroButtonProps = {
  children: React.ReactNode
  to?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  tourId?: string
}

const HeroButton: React.FC<
  HeroButtonProps & { variant: 'solid' | 'ghost' }
> = ({
  children,
  to,
  onClick,
  type = 'button',
  className,
  variant,
  tourId,
}) => {
  const cls = [
    variant === 'solid' ? styles.actionBtn : styles.ghostBtn,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link className={cls} to={to} data-tour={tourId}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={cls} onClick={onClick} data-tour={tourId}>
      {children}
    </button>
  )
}

export const HeroAction: React.FC<HeroButtonProps> = (props) => (
  <HeroButton variant="solid" {...props} />
)

export const HeroGhost: React.FC<HeroButtonProps> = (props) => (
  <HeroButton variant="ghost" {...props} />
)

export const PageHero: React.FC<PageHeroProps> = ({
  kicker,
  title,
  lead,
  identity,
  pills,
  actions,
  meta,
  chips,
  children,
  compact = false,
}) => {
  const copy = (
    <div className={styles.copy}>
      {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
      {title ? <h1 className={styles.title}>{title}</h1> : null}
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {pills ? <div className={styles.pills}>{pills}</div> : null}
    </div>
  )
  const hasCopy = Boolean(kicker || title || lead || pills)
  const left = identity ? (
    <div className={styles.identity}>
      {identity}
      {hasCopy ? copy : null}
    </div>
  ) : hasCopy ? (
    copy
  ) : null

  return (
    <section className={`${styles.hero} ${compact ? styles.compact : ''}`}>
      <div className={styles.glow} />
      {(left || actions) && (
        <div className={styles.top}>
          {left ?? <div />}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      )}
      {chips ? <div className={styles.chips}>{chips}</div> : null}
      {meta && meta.length > 0 ? (
        <div className={styles.meta}>
          {meta.map((item) => (
            <div key={item.label} className={styles.metaCard}>
              <span className={styles.metaLabel}>{item.label}</span>
              <span className={styles.metaValue}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
      {children}
    </section>
  )
}
