import React from 'react'

import officePhoto from '@/assets/aboutUs.png'

import { CandidateExperience } from '../CandidateExperience'
import { CtaBanner } from '../CtaBanner'
import { Hero } from '../Hero'
import { HowItWorks } from '../HowItWorks'
import { FeatureVisual, WorkflowFeatures } from '../WorkflowFeatures'
import {
  hiringPipeline,
  integrationGroups,
  platformFeatures,
  talentWorkflowFeatures,
} from './forTalentsData'
import styles from './ForTalentsPage.module.scss'

export const ForTalentsPage = () => (
  <>
    <Hero
      title={
        <>
          Everything you need to hire, <em>in one place.</em>
        </>
      }
      subcopy="From job post to signed offer, screening, scoring, shortlisting and tracking run on one platform, so nothing falls through the gaps."
      panel={<FeatureVisual visual={hiringPipeline} />}
    />
    <HowItWorks
      variant="features"
      eyebrow="Features"
      heading="One platform across the whole talent lifecycle"
      subcopy="Attraction, screening, assessment, hiring and appraisal without stitching four tools together. Use one platform across the whole talent lifecycle."
      steps={platformFeatures}
    />
    <WorkflowFeatures hideHeader features={talentWorkflowFeatures} />
    <CandidateExperience timelineOnly />

    <section className={styles.banner}>
      <img src={officePhoto} alt="" className={styles.photo} />
      <h2 className={styles.title}>Hire Smarter With AuxHR</h2>
      <p className={styles.text}>
        Set it up once, and let AuxHR run the whole pipeline with you.
      </p>
    </section>

    <section className={styles.integrations}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Plugs into where talent already is</h2>
        <p className={styles.text}>
          Pull candidates in from the job boards they already use, and push
          shortlists straight into the HR tools you already run.
        </p>
        <div className={styles.groups}>
          {integrationGroups.map((group) => (
            <div key={group.title}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <ul className={styles.chips}>
                {group.names.map((name) => (
                  <li key={name} className={styles.chip}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>

    <CtaBanner />
  </>
)
