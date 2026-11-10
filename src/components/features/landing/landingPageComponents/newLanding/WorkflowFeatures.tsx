import cn from 'classnames'
import React from 'react'

import checkItem from './assets/check-item.svg'
import { EyebrowPill } from './ui'
import styles from './WorkflowFeatures.module.scss'
import {
  Recruiter,
  WorkflowFeature,
  workflowFeatures,
  WorkflowVisual,
} from './workflowFeaturesData'

const RecruiterPill = ({ recruiter }: { recruiter: Recruiter }) => (
  <div className={styles.recruiterPill}>
    <img src={recruiter.avatar} alt="" className={styles.recruiterAvatar} />
    <div className={styles.recruiterText}>
      <span className={cn(styles.recruiterName, styles[recruiter.tone])}>
        {recruiter.name}
      </span>
      <span className={styles.recruiterRole}>{recruiter.role}</span>
    </div>
  </div>
)

export const FeatureVisual = ({ visual }: { visual: WorkflowVisual }) => {
  if (visual.kind === 'scores') {
    return (
      <div
        className={cn(
          styles.visual,
          styles.visualScores,
          visual.url && styles.browser,
        )}
        aria-hidden>
        {visual.url && (
          <div className={styles.browserBar}>
            <span className={styles.browserDots} />
            {visual.url}
          </div>
        )}
        <div className={styles.scoreList}>
          {visual.items.map((item) => (
            <div
              key={item.label}
              className={cn(styles.scoreCard, styles[item.tone])}>
              <div className={styles.scoreHeader}>
                <span
                  className={cn(
                    styles.scoreLabel,
                    item.largeLabel && styles.large,
                  )}>
                  {item.label}
                </span>
                <span
                  className={cn(
                    styles.scoreValue,
                    item.largeScore && styles.large,
                  )}>
                  {item.score}
                </span>
              </div>
              <span className={styles.scoreTrack}>
                <span
                  className={styles.scoreFill}
                  style={{ width: `${item.fill}%` }}
                />
              </span>
            </div>
          ))}
          {visual.questions && (
            <div className={styles.scoreCard}>
              <span className={styles.scoreLabel}>Screening Questions</span>
              {visual.questions.map((question) => (
                <div key={question.text} className={styles.questionRow}>
                  {question.text}
                  <span className={styles.weightPill}>{question.weight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (visual.kind === 'pipeline') {
    return (
      <div className={cn(styles.visual, styles.visualPipeline)} aria-hidden>
        <div className={styles.jobList}>
          <span className={styles.pipelineLabel}>{visual.label}</span>
          {visual.stages.map((stage) => (
            <div key={stage.title} className={styles.jobCard}>
              <div className={styles.jobText}>
                <span className={styles.jobTitle}>{stage.title}</span>
                <span className={styles.jobMeta}>{stage.meta}</span>
              </div>
              <span className={styles.pipelineCount}>{stage.count}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (visual.kind === 'jobs') {
    return (
      <div className={cn(styles.visual, styles.visualJobs)} aria-hidden>
        <div className={styles.jobList}>
          {visual.items.map((job) => (
            <div key={job.title} className={styles.jobCard}>
              <div className={styles.jobText}>
                <span className={styles.jobTitle}>{job.title}</span>
                <span className={styles.jobMeta}>{job.meta}</span>
              </div>
              <div className={styles.jobStats}>
                <span className={cn(styles.jobStatus, styles[job.status])}>
                  {job.status === 'open' ? 'Open' : 'Closed'}
                </span>
                <span className={styles.jobApplicants}>{job.applicants}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (visual.kind === 'recruiters') {
    return (
      <div className={cn(styles.visual, styles.visualRecruiters)} aria-hidden>
        <div className={styles.recruiterRows}>
          {visual.rows.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.recruiterRow}>
              {row.map((recruiter, index) => (
                <RecruiterPill key={index} recruiter={recruiter} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(styles.visual, styles.visualStats)} aria-hidden>
      <div className={styles.statsBody}>
        <div className={styles.statGrid}>
          {visual.stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span
                className={cn(styles.statValue, stat.large && styles.large)}>
                {stat.value}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.barChart}>
          {visual.bars.map((bar, index) => (
            <span
              key={index}
              className={cn(styles.bar, bar.highlight && styles.highlight)}
              style={{ height: bar.height }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type WorkflowFeaturesProps = {
  features?: WorkflowFeature[]
  hideHeader?: boolean
}

export const WorkflowFeatures = ({
  features = workflowFeatures,
  hideHeader = false,
}: WorkflowFeaturesProps) => (
  <section className={styles.section}>
    {!hideHeader && (
      <div className={styles.header}>
        <h2 className={styles.heading}>
          Your Recruitment Workflow, Reinvented.
        </h2>
        <p className={styles.subcopy}>
          Optimized for speed, high diagnostic clarity, and frictionless
          collaboration.
        </p>
      </div>
    )}

    <div className={styles.rows}>
      {features.map((feature) => (
        <div
          key={feature.id}
          className={cn(styles.row, feature.visualFirst && styles.visualFirst)}>
          <div className={styles.copyCell}>
            <div className={styles.copy}>
              <div className={styles.copyText}>
                {feature.eyebrow && (
                  <EyebrowPill>{feature.eyebrow}</EyebrowPill>
                )}
                <h3 className={styles.title}>{feature.title}</h3>
                <p className={styles.description}>{feature.description}</p>
              </div>
              <ul className={styles.points}>
                {feature.points.map((point) => (
                  <li key={point} className={styles.point}>
                    <img src={checkItem} alt="" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <FeatureVisual visual={feature.visual} />
        </div>
      ))}
    </div>
  </section>
)
