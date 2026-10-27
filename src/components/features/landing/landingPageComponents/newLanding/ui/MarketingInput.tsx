import { useField } from 'formik'
import React, { InputHTMLAttributes } from 'react'

import { FieldShell } from './FieldShell'
import styles from './FormField.module.scss'

type MarketingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string
  label: string
}

export const MarketingInput = ({ label, ...props }: MarketingInputProps) => {
  const [field, meta] = useField(props.name)
  const error = meta.touched ? meta.error : undefined
  const id = props.id ?? props.name

  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        {...props}
        {...field}
        id={id}
        className={styles.control}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldShell>
  )
}
