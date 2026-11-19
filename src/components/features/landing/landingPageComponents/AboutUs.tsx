import React from 'react'
import { useNavigate } from 'react-router-dom'

import image from '@/assets/aboutUs.png'
import Jobs from '@/assets/Jobs.png'
import { Text } from '@/components/ui/Typography'

import { LandingButton } from './LandingButton'
import { StatCard } from './StatCard'
import styles from './styles/AboutUs.module.scss'

const stats = [
  {
    value: '60%',
    description: 'Reduction in time to hire',
  },
  {
    value: '70%',
    description: 'Fewer Unqualified Applicants',
  },
  {
    value: '3x',
    description: 'Faster screening and matching',
  },
  {
    value: '50%',
    description: 'Lower Cost per Hire',
  },
  {
    value: '90%',
    description: 'Hiring Team Satisfaction',
  },
]

export const AboutUs = () => {
  const navigate = useNavigate()

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.stack}>
          <Text size="fs-4xl" weight="bold" className={styles.heading}>
            We are AuxHR Creating exceptional HR software.
          </Text>
          <Text size="fs-2xl" className={styles.heading}>
            Hiring is tough for both SMEs and large enterprises, which is why we
            built a people first HR solution that makes recruitment faster,
            smarter
          </Text>
        </div>
        <div className={styles.imgContainer}>
          <div className={styles.box1} />
          <div className={styles.box2} />
          <img src={image} alt="About us" className={styles.img} />
        </div>
      </div>
      <div className={styles.whatwedo}>
        <img src={Jobs} alt="Jobs" className={styles.jobImg} />
        <div className={styles.stack}>
          <Text size="fs-3xl" weight="bold" className={styles.heading}>
            What We Do
          </Text>
          <Text size="fs-2xl" weight="normal" className={styles.heading}>
            AUXHR is more than just recruitment software it’s a complete
            solution designed to solve common hiring challenges. It simplifies
            the recruitment process from job posting to offer, aligns talent
            through smart matching based on skills, experience, and culture fit,
            and saves time by automating tasks like CV screening and interview
            scheduling. Scalable for both growing SMEs and large enterprises,
            AUXHR provides professional, accessible, and efficient recruitment
            tools that adapt to businesses of any size.
          </Text>
        </div>
      </div>
      <div className={styles.whowehelp}>
        <Text
          size="fs-3xl"
          weight="bold"
          color="white"
          className={styles.centeredHeading}>
          Who We Help
        </Text>
        <Text size="fs-2xl" color="white" className={styles.justified}>
          AUXHR is built to adapt to businesses of any size or stage. For micro
          and small teams, it acts as a ready-made recruitment partner, making
          early hires simple and affordable. For medium-sized companies, it
          streamlines growing complexities and ensures cultural fit. Large
          enterprises benefit from high-volume hiring support and workflow
          management, while startups and SMEs without HR teams can use AUXHR as
          a plug-and-play solution. Even established organisations gain faster,
          more efficient hiring cycles, allowing HR teams to focus on strategy
          over admin.
        </Text>
        <div className={styles.stats}>
          {stats.map((item) => (
            <StatCard
              key={item.value}
              percentage={item.value}
              description={item.description}
            />
          ))}
        </div>
      </div>
      <div className={styles.tryoutauxhr}>
        <Text size="fs-3xl" weight="bold" className={styles.centeredHeading}>
          Try Out AuxHR
        </Text>
        <Text size="fs-xl" className={styles.heading}>
          Explore our full platform with a 15-day free trial. No credit card
          required. Post jobs, hire faster, and manage your people effortlessly
          with our all-in-one platform.
        </Text>
        <div className={styles.ctas}>
          <LandingButton
            title="Get a Demo"
            variant="tertiary"
            onClick={() => {}}
          />
          <LandingButton
            title="Try it Free"
            variant="primary"
            onClick={() => navigate('/register')}
          />
        </div>
      </div>
    </div>
  )
}
