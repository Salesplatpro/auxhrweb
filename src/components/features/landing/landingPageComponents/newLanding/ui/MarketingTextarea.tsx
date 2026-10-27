import { useField } from 'formik'
import React, { TextareaHTMLAttributes } from 'react'

import { FieldShell } from './FieldShell'
import styles from './FormField.module.scss'

type MarketingTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string
  label: string
}

export const MarketingTextarea = ({
  label,
  ...props
}: MarketingTextareaProps) => {
  const [field, meta] = useField(props.name)
  const error = meta.touched ? meta.error : undefined
  const id = props.id ?? props.name

  return (
    <FieldShell id={id} label={label} error={error}>
      <textarea
        rows={5}
        {...props}
        {...field}
        id={id}
        className={[styles.control, styles.textarea].join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldShell>
  )
}
