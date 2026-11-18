import React, { useState } from 'react'
import { FiSearch } from 'react-icons/fi'

import styles from './Faq.module.scss'
import { faqData } from './FaqData'
import FaqItem from './FaqItem'

const Faq = () => {
  const [search, setSearch] = useState('')

  const filteredFaq = faqData.filter((faq) => {
    const faqTerm = search.toLowerCase()
    const searchQuestionMatch = faq.question.toLowerCase().includes(faqTerm)
    const searchAnswerMatch = faq.answer.toLowerCase().includes(faqTerm)

    return searchQuestionMatch || searchAnswerMatch
  })

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Frequently Asked Questions (FAQs)</h1>
        <div className={styles.search}>
          <FiSearch fontSize={20} className={styles.searchIcon} />

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            placeholder="search"
            className={styles.searchInput}
          />
        </div>
        {filteredFaq.length > 0 ? (
          <FaqItem faqs={filteredFaq} />
        ) : (
          <p className={styles.empty}>Not Found</p>
        )}
      </div>
    </div>
  )
}

export default Faq
