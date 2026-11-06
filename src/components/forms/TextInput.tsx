import cn from 'classnames'
import { FormikContext, getIn } from 'formik'
import React, { ReactNode, useContext } from 'react'

import styles from './TextInput.module.scss'
import { useFieldRequired } from './useFieldRequired'

export type TextInputProps = {
  title: string
  name: string
  label: string
  autoComplete?: string
  isPassword?: boolean
  placeholder?: string
  /** Defaults to whether the form's Yup schema marks this field required. */
  required?: boolean
  value?: string | number
  disabled?: boolean
  error?: string
  type?: React.HTMLInputTypeAttribute
  maxLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  id?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  icon?: ReactNode
  endAdornment?: ReactNode
  endAdornmentSize?: 'sm' | 'md'
  hint?: ReactNode
  labelAside?: ReactNode
}

export const useFieldError = (
  name: string,
  explicit?: string,
): string | undefined => {
  const formik = useContext(FormikContext)
  if (explicit) return explicit
  if (!formik) return undefined
  const touched = getIn(formik.touched, name)
  const error = getIn(formik.errors, name)
  return touched && typeof error === 'string' ? error : undefined
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      title,
      name,
      autoComplete = 'off',
      value,
      placeholder,
      disabled,
      required,
      isPassword,
      error,
      type,
      maxLength,
      inputMode,
      id,
      onChange,
      onBlur,
      icon,
      endAdornment,
      endAdornmentSize = 'sm',
      hint,
      labelAside,
    },
    ref,
  ) => {
    const fieldError = useFieldError(name, error)
    const isRequired = useFieldRequired(name, required)
    const inputId = id || name || label
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const describedBy = fieldError ? errorId : hint ? hintId : undefined
    const inputType = isPassword ? 'password' : type || 'text'

    return (
      <div className={styles.container} data-field={name}>
        <div className={styles.label}>
          <label htmlFor={inputId}>{title}</label>
          {isRequired && (
            <span className={styles.required} aria-hidden>
              *
            </span>
          )}
          {labelAside && (
            <span className={styles.labelAside}>{labelAside}</span>
          )}
        </div>
        <div
          className={cn(
            styles.control,
            !!icon && styles.withIcon,
            !!endAdornment && styles[`withEnd-${endAdornmentSize}`],
          )}>
          {icon && (
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            id={inputId}
            name={name}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={value}
            maxLength={maxLength}
            inputMode={inputMode}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={describedBy}
            aria-required={isRequired || undefined}
            className={cn(styles.input, fieldError && styles.invalid)}
          />
          {endAdornment && (
            <span className={styles.endAdornment}>{endAdornment}</span>
          )}
        </div>
        {fieldError ? (
          <div id={errorId} className={styles.inputError} role="alert">
            {fieldError}
          </div>
        ) : (
          hint && (
            <div id={hintId} className={styles.hint}>
              {hint}
            </div>
          )
        )}
      </div>
    )
  },
)

TextInput.displayName = 'TextInput'
