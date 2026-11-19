import React from 'react'
import { useNavigate } from 'react-router-dom'

import aiConfig from '@/assets/aiConfig.png'
import cypress from '@/assets/cypress.png'
import auxHrPink from '@/assets/pinkAuxHr.png'
import { Text } from '@/components/ui/Typography'
import { paths } from '@/paths'

import { LandingButton } from '../LandingButton'
import { RecruitmentWorkflow } from '../RecruitmentWorkflow'
import { featuresData } from '../utils'
import styles from './Features.module.scss'
import { FeaturesSection } from './FeaturesSection'

export type FeatureDataType = {
  title: string
  description: string
}

const moreFeatureData: FeatureDataType[] = [
  {
    title: 'Affordable Pricing',
    description:
      'Flexible plans designed to make HR technology accessible for smaller businesses.',
  },
  {
    title: 'Data Security and Compliance',
    description:
      'CVs are stored as extracted text—not original files—so recruiters review a generated PDF while candidate data stays lean and controlled.',
  },
  {
    title: 'Bulk Recruitment ',
    description:
      'Support Manage hundreds of applicants simultaneously without losing quality.',
  },
]

const featureData: FeatureDataType[] = [
  {
    title: 'AI-Powered Talent Matching:',
    description:
      'Intelligent algorithms match you with the best candidates, reducing hiring risks.',
  },
  {
    title: 'Customisable Hiring',
    description:
      'Workflow Adapt AUXHR to your recruitment style, whether simple for SMEs or robust for enterprises.',
  },
  {
    title: 'Bulk Recruitment ',
    description:
      'Support Manage hundreds of applicants simultaneously without losing quality.',
  },
  {
    title: 'Interview Scheduling Integration:',
    description:
      'Save time with automated scheduling that syncs with your calendar.',
  },
  {
    title: 'Collaboration Tools ',
    description:
      'Allow team members to review, rate, and comment on candidates in real time.',
  },
  {
    title: 'Scalable Infrastructure ',
    description:
      'AUXHR adapts to your organisation’s size, from 5 people to more than 5,000.',
  },
]

export const Features = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <div className={styles.headingContainer}>
        <Text size="fs-5xl" color="hero" weight="bold">
          AuxHR is your all in one solution for HR and hiring
        </Text>
        <Text size="fs-2xl" weight="bold" className={styles.centered}>
          AuxHR brings every HR function together hiring, data management, and
          attendance tracking in one simple system of record.
        </Text>
        <div className={styles.ctas}>
          <LandingButton
            title="Try it free"
            variant="primary"
            onClick={() => navigate(paths.register)}
          />
          <LandingButton
            title="Get a Demo"
            variant="tertiary"
            onClick={() => {}}
          />
        </div>
      </div>
      <RecruitmentWorkflow
        variant="secondary"
        subTitle="Your Recruitment Workflow, Reinvented."
        data={featuresData}
      />
      <FeaturesSection data={featureData} header="Features" />

      <div className={styles.showcase}>
        <div className={styles.showcaseCopy}>
          <div className={styles.logo}>
            <img src={auxHrPink} alt="aux hr" />
          </div>
          <Text weight="bold" size="fs-2xl">
            Smart Recruitment Engine Post jobs, track applicants, and manage the
            hiring pipeline all in one platform.
          </Text>
        </div>
        <img src={cypress} alt="job oppurtunity" className={styles.pics} />
      </div>
      <FeaturesSection data={moreFeatureData} header="More Features" />
      <div className={`${styles.showcase} ${styles.showcaseCentered}`}>
        <img src={aiConfig} alt="job oppurtunity" className={styles.pics} />
        <Text weight="bold" size="fs-2xl">
          Smart Recruitment Engine Post jobs, track applicants, and manage the
          hiring pipeline all in one platform.
        </Text>
      </div>
    </div>
  )
}
