import React from 'react'
import { FaGreaterThan, FaLessThan } from 'react-icons/fa6'

import { Select } from '../../forms/Select/Select'
import { Button } from '../Button'
import styles from './Pagination.module.scss'

const ELLIPSIS = 'ellipsis' as const

/** First, last and the pages around the current one, with gaps marked so long lists fit. */
export const pageItems = (
  currentPage: number,
  totalPages: number,
): Array<number | typeof ELLIPSIS> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  const items: Array<number | typeof ELLIPSIS> = [1]
  if (start > 2) items.push(ELLIPSIS)
  for (let page = start; page <= end; page++) items.push(page)
  if (end < totalPages - 1) items.push(ELLIPSIS)
  items.push(totalPages)
  return items
}

export type PaginationProps = {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  /** When provided (with `onItemsPerPageChange`), renders a page-size selector next to the results text. */
  itemsPerPageOptions?: number[]
  onItemsPerPageChange?: (itemsPerPage: number) => void
  /** `simple`: "Showing 1–7 of 12" with Previous and Next only. */
  variant?: 'pages' | 'simple'
}

export const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  itemsPerPageOptions,
  onItemsPerPageChange,
  variant = 'pages',
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems)

  if (variant === 'simple') {
    return (
      <div className={styles.simple}>
        <span className={styles.summary}>
          Showing {rangeStart}–{rangeEnd} of {totalItems}
        </span>
        <div className={styles.pages}>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={handlePrevious}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        {totalItems > 0 && (
          <span>
            Showing {rangeStart} to {rangeEnd} of {totalItems} results
          </span>
        )}
        {itemsPerPageOptions && onItemsPerPageChange && (
          <Select
            options={itemsPerPageOptions.map((size) => ({
              label: `${size} / page`,
              value: String(size),
            }))}
            value={String(itemsPerPage)}
            onChange={(value) => onItemsPerPageChange(Number(value))}
          />
        )}
      </div>
      <div className={styles.pages}>
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={styles.navButton}>
          <FaLessThan size={14} aria-hidden />
          <span className={styles.navLabel}>Previous</span>
        </button>

        <div className={styles.pageList}>
          {pageItems(currentPage, totalPages).map((page, index) =>
            page === ELLIPSIS ? (
              <span key={`gap-${index}`} className={styles.gap} aria-hidden>
                …
              </span>
            ) : (
              <button
                type="button"
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={
                  page === currentPage ? styles.pageActive : styles.page
                }>
                {page}
              </button>
            ),
          )}
        </div>
        <span className={styles.pageOf}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className={styles.navButton}>
          <span className={styles.navLabel}>Next</span>
          <FaGreaterThan size={14} aria-hidden />
        </button>
      </div>
    </div>
  )
}
