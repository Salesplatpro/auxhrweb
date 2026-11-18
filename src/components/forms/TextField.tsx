import { ErrorMessage, Field, FieldProps } from 'formik'
import React from 'react'
import { IoIosInformationCircle } from 'react-icons/io'
import { Tooltip as ReactTooltip } from 'react-tooltip'

import RichTextEditor from './RichTextEditor'
import styles from './TextField.module.scss'
import { useFieldRequired } from './useFieldRequired'

interface TextFieldProps {
  label: string
  name: string
  /** Defaults to whether the form's Yup schema marks this field required. */
  required?: boolean
  placeholder?: string
  type?: string
  MAX_WORDS?: number
  disabled?: boolean
  hint?: string
  tooltip?: string
  prefix?: string
  suffix?: string
}

const TextField = ({
  label,
  name,
  placeholder,
  required,
  type,
  MAX_WORDS,
  disabled,
  hint,
  tooltip,
  prefix,
  suffix,
}: TextFieldProps) => {
  const isRequired = useFieldRequired(name, required)
  const tooltipId = `${name}-field-tooltip`
  const errorId = `${name}-error`
  const hintId = `${name}-hint`

  return (
    <div className={styles.field} data-field={name}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {isRequired && (
          <span className={styles.required} aria-hidden>
            *
          </span>
        )}
        {tooltip && (
          <span
            className={styles.tooltipTrigger}
            data-tooltip-id={tooltipId}
            aria-label={tooltip}>
            <IoIosInformationCircle aria-hidden />
          </span>
        )}
      </label>
      {tooltip && (
        <ReactTooltip
          id={tooltipId}
          content={tooltip}
          place="top"
          variant="info"
        />
      )}
      {type === 'textarea' ? (
        <Field name={name}>
          {({ field, meta }: FieldProps<string>) => (
            <RichTextEditor
              id={name}
              value={field.value}
              onChange={(value: string) => {
                field.onChange({ target: { name, value } })
              }}
              placeholder={placeholder}
              maxLength={MAX_WORDS}
              invalid={meta.touched && !!meta.error}
            />
          )}
        </Field>
      ) : (
        <Field name={name}>
          {({ field, meta }: FieldProps<string>) => {
            const hasError = meta.touched && !!meta.error
            const input = (
              <input
                {...field}
                type={type || 'text'}
                id={name}
                name={name}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={hasError || undefined}
                aria-required={isRequired || undefined}
                aria-describedby={
                  [hasError ? errorId : null, hint ? hintId : null]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                className={[
                  styles.input,
                  disabled ? styles.disabled : '',
                  hasError ? styles.invalid : '',
                  prefix ? styles.withPrefix : '',
                  suffix ? styles.withSuffix : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            )
            if (!prefix && !suffix) return input
            return (
              <div className={styles.affixed}>
                {prefix && (
                  <span className={styles.prefix} aria-hidden>
                    {prefix}
                  </span>
                )}
                {input}
                {suffix && <span className={styles.suffix}>{suffix}</span>}
              </div>
            )
          }}
        </Field>
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <ErrorMessage name={name}>
        {(message) => (
          <div id={errorId} className={styles.error} role="alert">
            {message}
          </div>
        )}
      </ErrorMessage>
    </div>
  )
}

export default TextField
