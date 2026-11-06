import cn from 'classnames'
import React, { ReactNode } from 'react'

import { useFieldError } from '../TextInput'
import { useFieldRequired } from '../useFieldRequired'
import styles from './TextArea.module.scss'

type TextAreaProps = {
  title: string
  name: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void
  maxLength?: number
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  error?: string
  footer?: ReactNode
}

export const TextArea = ({
  title,
  name,
  value,
  onChange,
  onBlur,
  maxLength,
  placeholder,
  rows = 3,
  required,
  disabled,
  error,
  footer,
}: TextAreaProps) => {
  const fieldError = useFieldError(name, error)
  const isRequired = useFieldRequired(name, required)
  const errorId = `${name}-error`
  const counterId = `${name}-counter`

  return (
    <div className={styles.container} data-field={name}>
      <div className={styles.label}>
        <label htmlFor={name}>{title}</label>
        {isRequired && (
          <span className={styles.required} aria-hidden>
            *
          </span>
        )}
        {maxLength !== undefined && (
          <span id={counterId} className={styles.counter}>
            {value.length} / {maxLength}
          </span>
        )}
      </div>
      <div
        className={cn(
          styles.box,
          fieldError && styles.invalid,
          disabled && styles.disabled,
        )}>
        <textarea
          id={name}
          name={name}
          value={value}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={fieldError ? true : undefined}
          aria-required={isRequired || undefined}
          aria-describedby={cn(fieldError && errorId, maxLength && counterId)}
          className={styles.textarea}
        />
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
      {fieldError && (
        <div id={errorId} className={styles.error} role="alert">
          {fieldError}
        </div>
      )}
    </div>
  )
}
