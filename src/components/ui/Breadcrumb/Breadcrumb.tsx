import React from 'react'
import { HiChevronRight } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import styles from './Breadcrumb.module.scss'

export type BreadcrumbItem = {
  label: string
  to?: string
}

export const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumb">
    <ol className={styles.list}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <li key={`${item.label}-${index}`} className={styles.item}>
            {item.to && !isLast ? (
              <Link to={item.to} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? styles.current : styles.link}
                aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <HiChevronRight className={styles.separator} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  </nav>
)
