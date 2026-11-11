import cn from 'classnames'
import React, {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { HiPlus } from 'react-icons/hi2'
import { IoClose } from 'react-icons/io5'

import { useFieldRequired } from '../useFieldRequired'
import styles from './TagInput.module.scss'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  name?: string
  /** Defaults to whether the form's Yup schema marks this field required. */
  required?: boolean
  placeholder?: string
  error?: string
  maxTags?: number
  maxLength?: number
  /** Shows the tags as chips with an "Add" chip that opens the input, instead of a boxed input. */
  addLabel?: string
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  label,
  name,
  required,
  placeholder = 'Type and press Enter to add',
  error,
  maxTags,
  maxLength = 250,
  addLabel,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const showInput = !addLabel || adding

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])
  const inputRef = useRef<HTMLInputElement>(null)
  const isRequired = useFieldRequired(name, required)

  const addTags = (raws: string[]) => {
    let next = value
    for (const raw of raws) {
      const tag = raw.trim()
      if (!tag) continue
      if (maxLength && tag.length > maxLength) continue
      if (maxTags && next.length >= maxTags) break
      if (next.includes(tag)) continue
      next = [...next, tag]
    }
    if (next !== value) onChange(next)
    setInputValue('')
  }

  const addTag = (raw: string) => {
    addTags([raw])
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (!text) return
    e.preventDefault()
    addTags(text.split(/[,;\n]+/))
  }

  const wrapperClass = cn(
    styles.inputWrapper,
    addLabel && styles.chipList,
    error && styles.hasError,
  )

  return (
    <div className={styles.container} data-field={name}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
          {isRequired && (
            <span className={styles.required} aria-hidden>
              *
            </span>
          )}
        </label>
      )}

      <div className={wrapperClass} role="group" aria-label={label}>
        {value.map((tag, index) => (
          <span key={index} className={styles.tag}>
            <span className={styles.tagLabel} title={tag}>
              {tag}
            </span>
            <button
              type="button"
              className={styles.tagRemove}
              onClick={(e) => {
                e.stopPropagation()
                removeTag(index)
              }}
              aria-label={`Remove ${tag}`}>
              <IoClose />
            </button>
          </span>
        ))}

        {showInput ? (
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={
              addLabel
                ? () => {
                    addTag(inputValue)
                    setAdding(false)
                  }
                : undefined
            }
            placeholder={value.length === 0 || addLabel ? placeholder : ''}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error && name ? `${name}-error` : undefined}
          />
        ) : (
          <button
            type="button"
            id={name}
            className={styles.addButton}
            onClick={() => setAdding(true)}>
            <HiPlus aria-hidden />
            {addLabel}
          </button>
        )}
      </div>

      {showInput && (
        <span className={styles.hint}>Press Enter to add each item</span>
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
