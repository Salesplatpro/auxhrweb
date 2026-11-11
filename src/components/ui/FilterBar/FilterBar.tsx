import React, { useEffect, useRef, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { IoClose, IoRefresh } from 'react-icons/io5'
import { LuChevronDown, LuChevronUp, LuSlidersHorizontal } from 'react-icons/lu'

import { Select } from '@/components/forms/Select'
import { DateRangePicker } from '@/components/ui/DateRangePicker'

import { FilterFieldConfig, hasActiveFilters } from '../FilterPanel/FilterPanel'
import styles from './FilterBar.module.scss'

interface FilterBarProps<TFilters extends object> {
  fields: FilterFieldConfig<TFilters>[]
  filters: TFilters
  defaultFilters: TFilters
  onChange: (filters: TFilters) => void
  ariaLabel?: string
  /** Just the "Filters" button, with the panel as a popover; no chips or Reset. */
  compact?: boolean
}

const startOfDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const daysAgo = (days: number) => {
  const date = startOfDay(new Date())
  date.setDate(date.getDate() - days)
  return date
}

export function FilterBar<TFilters extends object>({
  fields,
  filters,
  defaultFilters,
  onChange,
  ariaLabel = 'Filters',
  compact = false,
}: FilterBarProps<TFilters>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const setField = (key: keyof TFilters, value: unknown) => {
    onChange({ ...filters, [key]: value })
  }

  const resetAll = () => onChange(defaultFilters)

  const active = hasActiveFilters(filters, defaultFilters)

  // Build chip list from active non-default filter values
  const chips: { key: string; label: string; remove: () => void }[] = []

  for (const field of fields) {
    const value = filters[field.key]

    if (field.type === 'search') {
      const str = (value as string) ?? ''
      if (str.trim()) {
        chips.push({
          key: String(field.key),
          label: `${field.label}: "${str.trim()}"`,
          remove: () => setField(field.key, ''),
        })
      }
    } else if (field.type === 'select') {
      const str = (value as string) ?? field.offValue
      if (str !== field.offValue) {
        const optionLabel =
          field.options.find((o) => o.value === str)?.label ?? str
        chips.push({
          key: String(field.key),
          label: optionLabel,
          remove: () => setField(field.key, field.offValue),
        })
      }
    } else if (field.type === 'dateRange') {
      const range = value as DateRange | undefined
      if (range?.from) {
        const from = range.from.toLocaleDateString()
        const to = range.to ? range.to.toLocaleDateString() : '…'
        chips.push({
          key: String(field.key),
          label: `${field.label}: ${from} – ${to}`,
          remove: () => setField(field.key, undefined),
        })
      }
    }
  }

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''}`}
      ref={containerRef}
      aria-label={ariaLabel}>
      {/* Toggle bar */}
      <div className={styles.bar}>
        <button
          type="button"
          className={`${styles.toggle} ${
            isOpen || (compact && active) ? styles.toggleOpen : ''
          }`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}>
          <LuSlidersHorizontal className={styles.toggleIcon} />
          <span>Filters</span>
          {!compact &&
            (isOpen ? (
              <LuChevronUp className={styles.chevron} />
            ) : (
              <LuChevronDown className={styles.chevron} />
            ))}
        </button>

        {/* Active filter chips — only visible when collapsed */}
        {!compact && !isOpen && chips.length > 0 && (
          <div className={styles.chips}>
            {chips.map((chip) => (
              <span key={chip.key} className={styles.chip}>
                {chip.label}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={(e) => {
                    e.stopPropagation()
                    chip.remove()
                  }}
                  aria-label={`Remove ${chip.label} filter`}>
                  <IoClose />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Reset — always visible when there are active filters */}
        {!compact && (
          <button
            type="button"
            className={styles.resetBtn}
            disabled={!active}
            onClick={resetAll}>
            <IoRefresh />
            Reset
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {isOpen && (
        <div className={styles.dropdown}>
          {fields.map((field) => {
            if (field.type === 'search') {
              const value = (filters[field.key] as string) ?? ''
              return (
                <div className={styles.field} key={String(field.key)}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor={`filterbar-${String(field.key)}`}>
                    {field.label}
                  </label>
                  <input
                    id={`filterbar-${String(field.key)}`}
                    className={styles.searchInput}
                    type="text"
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                </div>
              )
            }

            if (field.type === 'select') {
              const value = (filters[field.key] as string) ?? field.offValue
              return (
                <div className={styles.field} key={String(field.key)}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <Select
                    options={field.options}
                    value={value}
                    onChange={(next) => setField(field.key, next)}
                  />
                  {field.pills && (
                    <div className={styles.pillRow}>
                      {field.pills.map((pill) => {
                        const isActive = value === pill.value
                        return (
                          <button
                            key={pill.value}
                            type="button"
                            className={
                              isActive ? styles.pillActive : styles.pill
                            }
                            onClick={() =>
                              setField(
                                field.key,
                                isActive ? field.offValue : pill.value,
                              )
                            }>
                            {pill.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // dateRange
            const value = filters[field.key] as DateRange | undefined
            const isQuickActive = (days: number) =>
              value?.from?.getTime() === daysAgo(days).getTime()

            return (
              <div className={styles.field} key={String(field.key)}>
                <span className={styles.fieldLabel}>{field.label}</span>
                <DateRangePicker
                  value={value}
                  onChange={(next) => setField(field.key, next)}
                />
                {field.quickRanges && (
                  <div className={styles.pillRow}>
                    {field.quickRanges.map((range) => (
                      <button
                        key={range.label}
                        type="button"
                        className={
                          isQuickActive(range.days)
                            ? styles.pillActive
                            : styles.pill
                        }
                        onClick={() => {
                          const from = daysAgo(range.days)
                          const active = isQuickActive(range.days)
                          setField(
                            field.key,
                            active ? undefined : { from, to: new Date() },
                          )
                        }}>
                        {range.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
