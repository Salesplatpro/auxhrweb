import React from 'react'

import { InfoCard, PageHero, SectionHeading } from '../ui'
import { contactChannels, RESPONSE_TIME } from './contactData'
import { ContactForm } from './ContactForm'
import styles from './ContactPage.module.scss'
import { SupportPanel } from './SupportPanel'

export const ContactPage = () => (
  <>
    <PageHero
      eyebrow="Get in touch"
      title="Contact Us"
      subtitle={`Questions about hiring, your profile or a demo for your team? Send us a message and the right person will get back to you within ${RESPONSE_TIME}.`}
    />

    <section className={styles.main}>
      <div className={styles.grid}>
        <ContactForm />
        <SupportPanel />
      </div>
    </section>

    <section className={styles.channels}>
      <SectionHeading
        title="Other ways to reach us"
        subtitle="Pick whatever works best for you."
      />
      <div className={styles.cards}>
        {contactChannels.map(({ icon: Icon, ...channel }) => (
          <InfoCard key={channel.title} icon={<Icon />} {...channel} />
        ))}
      </div>
    </section>
  </>
)
