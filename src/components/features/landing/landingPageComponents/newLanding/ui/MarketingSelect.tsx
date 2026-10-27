import { useField } from 'formik'
import React from 'react'
import { HiChevronDown } from 'react-icons/hi2'

import { FieldShell } from './FieldShell'
import styles from './FormField.module.scss'

type MarketingSelectProps = {
  name: string
  label: string
  placeholder: string
  options: { value: string; label: string }[]
}

export const MarketingSelect = ({
  name,
  label,
  placeholder,
  options,
}: MarketingSelectProps) => {
  const [field, meta] = useField(name)
  const error = meta.touched ? meta.error : undefined

  return (
    <FieldShell id={name} label={label} error={error}>
      <div className={styles.selectWrap}>
        <select
          {...field}
          id={name}
          className={[styles.control, styles.select].join(' ')}
          data-empty={!field.value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <HiChevronDown className={styles.chevron} aria-hidden />
      </div>
    </FieldShell>
  )
}
