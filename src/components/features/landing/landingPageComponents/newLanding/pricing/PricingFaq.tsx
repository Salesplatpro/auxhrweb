import React from 'react'

import { SectionHeading } from '../ui'
import { PricingFaqItem } from './pricingData'
import styles from './PricingFaq.module.scss'

export const PricingFaq = ({ items }: { items: PricingFaqItem[] }) => (
  <section className={styles.section}>
    <SectionHeading title="Pricing FAQs" />
    <div className={styles.grid}>
      {items.map((item) => (
        <div key={item.question} className={styles.item}>
          <h3 className={styles.question}>{item.question}</h3>
          <p className={styles.answer}>{item.answer}</p>
        </div>
      ))}
    </div>
  </section>
)
