import cn from 'classnames'
import React, { ReactNode } from 'react'

import { paths } from '@/paths'

import arrowUpRight from './assets/arrow-up-right.svg'
import circlePlay from './assets/circle-play.svg'
import styles from './Hero.module.scss'
import { HeroPanel } from './HeroPanel'

type HeroProps = {
  title?: ReactNode
  subcopy?: ReactNode
  panel?: ReactNode
}

export const Hero = ({
  title = (
    <>
      Hire better.
      <br className={styles.mobileBreak} /> Move faster.
      <br />
      Build stronger teams.
    </>
  ),
  subcopy = 'AuxHR is an AI-powered recruitment platform that helps you find, screen, and match the right candidates so your team can spend less time hiring and more time building.',
  panel,
}: HeroProps) => (
  <section className={styles.hero}>
    <div className={cn(styles.heroInner, !!panel && styles.split)}>
      <div className={styles.copy}>
        <h1 className={styles.headline}>{title}</h1>
        <p className={styles.subcopy}>{subcopy}</p>
        <div className={styles.actions}>
          <a href={`/${paths.register}`} className={styles.ctaSolid}>
            Get Started <img src={arrowUpRight} alt="" aria-hidden />
          </a>
          {/* placeholder destination until a real "how it works" target exists */}
          <a href="#how-it-works" className={styles.ctaOutline}>
            <img src={circlePlay} alt="" aria-hidden /> See how it works
          </a>
        </div>
      </div>
      {panel ?? <HeroPanel />}
    </div>
  </section>
)
