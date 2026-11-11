import React from 'react'
import { FaGreaterThan, FaLessThan } from 'react-icons/fa6'

import { Select } from '../../../components/forms/Select/Select'
import { Button } from '../../../components/ui/Button'
import styles from './Pagination.module.scss'

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
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

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
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={styles.navButton}>
          <FaLessThan size={14} />
          <span>Previous</span>
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? styles.pageActive : styles.page}>
            {page}
          </button>
        ))}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={styles.navButton}>
          <span>Next</span>
          <FaGreaterThan size={14} />
        </button>
      </div>
    </div>
  )
}
