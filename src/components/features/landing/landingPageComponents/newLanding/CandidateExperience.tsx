import cn from 'classnames'
import React from 'react'

import { paths } from '@/paths'

import searchCta from './assets/search-cta.svg'
import styles from './CandidateExperience.module.scss'
import { candidateSteps, journeyStages } from './candidateExperienceData'

export const CandidateExperience = ({ timelineOnly = false }) => (
  <section className={styles.section}>
    <div className={styles.inner}>
      {!timelineOnly && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.heading}>
              Because hiring is a two-way experience.
            </h2>
            <p className={styles.tagline}>
              The best candidates are evaluating you too.
            </p>
            <p className={styles.subcopy}>
              AuxHR helps create a recruitment experience that is simple,
              professional, and transparent—from application to offer.
            </p>
          </div>
          <a href={`/${paths.register}`} className={styles.cta}>
            Find your dream job <img src={searchCta} alt="" aria-hidden />
          </a>
        </div>
      )}

      <div className={styles.tracker}>
        <p className={styles.trackerTitle}>CANDIDATE LIVE JOURNEY TIMELINE</p>
        <div className={styles.stages}>
          {journeyStages.map((stage) => (
            <div
              key={stage.id}
              className={cn(styles.stage, styles[stage.state])}>
              <span className={styles.stageIcon}>
                <img src={stage.icon} alt="" aria-hidden />
              </span>
              <span className={styles.stageLabel}>{stage.label}</span>
              <span className={styles.stageCaption}>{stage.caption}</span>
            </div>
          ))}
        </div>
      </div>

      {!timelineOnly && (
        <div className={styles.steps}>
          <span className={styles.connector} aria-hidden />
          {candidateSteps.map((step) => (
            <div key={step.id} className={styles.step}>
              <span className={styles.stepIcon}>
                <img src={step.icon} alt="" aria-hidden />
              </span>
              <div className={styles.stepText}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)
