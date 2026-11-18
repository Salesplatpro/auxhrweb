import featuresDisplay from '@/assets/featuresDisplay.png'
import grid5Image from '@/assets/grid5.png'

import styles from '../styles/RecruitmentWorkflow.module.scss'

export type HowItWorksType = Record<'text' | 'image' | 'alt' | 'style', string>

export const featuresData: HowItWorksType[] = [
  {
    text: 'AI-Powered Matching — Precision screening across thousands of profiles.',
    image: grid5Image,
    alt: 'Grid-one',
    style: styles.gridItem1,
  },
  {
    text: 'Role-Based Scoring — Dynamic fit scoring based on your unique role and company.',
    image: featuresDisplay,
    alt: 'Grid-two',
    style: styles.gridItem2,
  },
  {
    text: 'Secure CV Processing — Extract resume text on upload; recruiters view a generated PDF, not a stored file.',
    image: featuresDisplay,
    alt: 'Grid-three',
    style: styles.gridItem3,
  },
  {
    text: 'Collaborative Hiring — Tag, comment, and evaluate as a team.',
    image: featuresDisplay,
    alt: 'Grid-four',
    style: styles.gridItem4,
  },
  {
    text: 'Candidate CRM — Track and manage candidates across hiring stages.',
    image: featuresDisplay,
    alt: 'Grid-five',
    style: styles.gridItem5,
  },
]
