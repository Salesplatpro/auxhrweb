import { ErrorMessage, Field } from 'formik'
import React from 'react'

import styles from './Performance.module.scss'

interface TextAreaFieldProps {
  name: string
  label: string
  rows?: number
  placeholder?: string
}

/** Plain text only. TextField's textarea is a rich text editor, and this text must never hold markup. */
export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  name,
  label,
  rows = 3,
  placeholder,
}) => (
  <label className={styles.field} data-field={name}>
    <span>{label}</span>
    <Field as="textarea" name={name} rows={rows} placeholder={placeholder} />
    <ErrorMessage name={name}>
      {(message) => (
        <span className={styles.error} role="alert">
          {message}
        </span>
      )}
    </ErrorMessage>
  </label>
)
