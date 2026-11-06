import cn from 'classnames'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'

import { useFieldError } from '../TextInput'
import { useFieldRequired } from '../useFieldRequired'
import {
  buildPhone,
  DEFAULT_PHONE_COUNTRY,
  dialFor,
  getDialCountries,
  parsePhone,
} from './phone'
import styles from './PhoneInput.module.scss'

type PhoneInputProps = {
  title: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  defaultCountry?: string
}

export const PhoneInput = ({
  title,
  name,
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  placeholder = '0805 827 2524',
  defaultCountry = DEFAULT_PHONE_COUNTRY,
}: PhoneInputProps) => {
  const fieldError = useFieldError(name, error)
  const isRequired = useFieldRequired(name, required)
  const countries = useMemo(getDialCountries, [])
  const [parts, setParts] = useState(() => parsePhone(value, defaultCountry))
  const partsRef = useRef(parts)
  partsRef.current = parts

  useEffect(() => {
    const current = partsRef.current
    const unchangedRaw = !value.startsWith('+') && value === current.national
    if (value === buildPhone(current.iso, current.national) || unchangedRaw) {
      return
    }
    setParts(parsePhone(value, current.iso))
  }, [value])

  const update = (next: { iso: string; national: string }) => {
    setParts(next)
    onChange(buildPhone(next.iso, next.national))
  }

  const country = countries.find((item) => item.iso === parts.iso)
  const errorId = `${name}-error`

  return (
    <div className={styles.container} data-field={name}>
      <div className={styles.label}>
        <label htmlFor={name}>{title}</label>
        {isRequired && (
          <span className={styles.required} aria-hidden>
            *
          </span>
        )}
      </div>
      <div
        className={cn(
          styles.box,
          fieldError && styles.invalid,
          disabled && styles.disabled,
        )}>
        <div className={styles.country}>
          <span className={styles.countryDisplay} aria-hidden>
            <span>{country?.flag}</span>
            <span>+{dialFor(parts.iso)}</span>
            <LuChevronDown />
          </span>
          <select
            className={styles.countrySelect}
            aria-label="Country code"
            value={parts.iso}
            disabled={disabled}
            onChange={(event) =>
              update({ iso: event.target.value, national: parts.national })
            }
            onBlur={onBlur}>
            {countries.map((item) => (
              <option key={item.iso} value={item.iso}>
                {item.flag} {item.name} (+{item.dial})
              </option>
            ))}
          </select>
        </div>
        <input
          id={name}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className={styles.number}
          value={parts.national}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) =>
            update({ iso: parts.iso, national: event.target.value })
          }
          onBlur={onBlur}
          aria-invalid={fieldError ? true : undefined}
          aria-required={isRequired || undefined}
          aria-describedby={fieldError ? errorId : undefined}
        />
      </div>
      {fieldError && (
        <div id={errorId} className={styles.error} role="alert">
          {fieldError}
        </div>
      )}
    </div>
  )
}
