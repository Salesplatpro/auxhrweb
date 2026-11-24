import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { IoIosArrowDown, IoIosClose } from 'react-icons/io'

import { useFieldRequired } from '../useFieldRequired'
import styles from './Select.module.scss'
import { MultiSelectProps } from './types'

const MAX_VISIBLE_TAGS = 2

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  onCreateOption,
  isLoading,
  placeholder = 'Select options',
  label,
  name,
  error,
  required,
  disabled,
  height,
  searchable,
}) => {
  const isRequired = useFieldRequired(name, required)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOptions = value.map(
    (selected) =>
      options.find((option) => option.value === selected) ?? {
        value: selected,
        label: selected,
      },
  )
  const visibleOptions = selectedOptions.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = selectedOptions.length - visibleOptions.length

  const filteredOptions =
    searchable && search
      ? options.filter((option) =>
          option.label.toLowerCase().includes(search.trim().toLowerCase()),
        )
      : options

  const trimmedSearch = search.trim()
  const showCreateOption =
    !!onCreateOption &&
    !!trimmedSearch &&
    !options.some(
      (option) => option.label.toLowerCase() === trimmedSearch.toLowerCase(),
    )

  const toggleDropdown = () => {
    if (disabled) return
    setIsOpen((prev) => !prev)
  }

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((selected) => selected !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const removeOption = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onChange(value.filter((selected) => selected !== optionValue))
  }

  const handleCreate = () => {
    onCreateOption?.(trimmedSearch)
    setSearch('')
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <div className={styles.label}>
          {label}
          {isRequired && (
            <span className={styles.required} aria-hidden>
              *
            </span>
          )}
        </div>
      )}
      <div
        id={name}
        data-field={name}
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-describedby={error && name ? `${name}-error` : undefined}
        className={cn(
          styles.trigger,
          styles.multiTrigger,
          error && styles.error,
          disabled && styles.disabled,
        )}
        style={height ? { height } : undefined}
        onClick={toggleDropdown}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggleDropdown()
          }
        }}>
        {selectedOptions.length > 0 ? (
          <div className={styles.tags}>
            {visibleOptions.map((option) => (
              <span key={option.value} className={styles.tag}>
                <span className={styles.tagLabel}>{option.label}</span>
                <button
                  type="button"
                  className={styles.tagRemove}
                  onClick={(event) => removeOption(option.value, event)}
                  aria-label={`Remove ${option.label}`}>
                  <IoIosClose size={16} />
                </button>
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className={styles.tagMore}>+{hiddenCount} more</span>
            )}
          </div>
        ) : (
          <span className={styles.placeholder}>
            {isLoading ? 'Loading...' : placeholder}
          </span>
        )}
        <span className={styles.arrow}>
          <IoIosArrowDown size={18} />
        </span>
      </div>
      {isOpen && !disabled && (
        <div className={styles.options}>
          {searchable && (
            <input
              type="text"
              className={styles.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && showCreateOption) {
                  event.preventDefault()
                  handleCreate()
                }
              }}
              placeholder="Search..."
            />
          )}
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                styles.option,
                value.includes(option.value) && styles.selectedOption,
              )}
              onClick={() => toggleOption(option.value)}>
              {option.label}
            </div>
          ))}
          {showCreateOption && (
            <div className={styles.option} onClick={handleCreate}>
              Create &quot;{trimmedSearch}&quot;
            </div>
          )}
          {filteredOptions.length === 0 && !showCreateOption && (
            <div className={styles.empty}>No options found</div>
          )}
        </div>
      )}
      {error && (
        <div
          id={name ? `${name}-error` : undefined}
          className={styles.errorText}
          role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
