import React from 'react'

import { paths } from '@/paths'

import arrowUpRight from './assets/arrow-up-right.svg'
import circlePlay from './assets/circle-play.svg'
import styles from './CtaBanner.module.scss'

export const CtaBanner = () => (
  <section className={styles.section}>
    <div className={styles.panel}>
      <h2 className={styles.heading}>Your next great hire starts here</h2>
      <p className={styles.subcopy}>
        Stop searching through endless applications.
        <br />
        Start finding the people who fit with autonomous talent intelligence.
      </p>
      <div className={styles.actions}>
        <a href={`/${paths.register}`} className={styles.ctaSolid}>
          Get Started <img src={arrowUpRight} alt="" aria-hidden />
        </a>
        <a href="/#how-it-works" className={styles.ctaOutline}>
          <img src={circlePlay} alt="" aria-hidden /> See how it works
        </a>
      </div>
    </div>
  </section>
)
