import { CCollapse } from '@coreui/react'
import React, { useState } from 'react'
import { IoIosArrowDropdown, IoIosArrowDropup } from 'react-icons/io'

import styles from './Faq.module.scss'

type FaqData = {
  id: string
  question: string
  answer: string
}

type FaqsProp = {
  faqs: FaqData[]
}

const FaqItem: React.FC<FaqsProp> = ({ faqs }) => {
  const [visible, setVisible] = useState<string | null>(null)

  return (
    <div className={styles.list}>
      {faqs.map((faq) => {
        const isOpen = visible === faq.id
        return (
          <div key={faq.id} className={styles.item}>
            <button
              type="button"
              onClick={() => setVisible(isOpen ? null : faq.id)}
              className={styles.question}>
              <span className={styles.questionText}>{faq.question}</span>

              <span className={styles.toggleIcon}>
                {isOpen ? (
                  <IoIosArrowDropup size={20} />
                ) : (
                  <IoIosArrowDropdown size={20} />
                )}
              </span>
            </button>

            <CCollapse visible={isOpen}>
              <div className={styles.divider} />

              <div className={styles.answer}>{faq.answer}</div>
            </CCollapse>
          </div>
        )
      })}
    </div>
  )
}

export default FaqItem
