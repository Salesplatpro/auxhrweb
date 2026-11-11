import cn from 'classnames'
import { useField } from 'formik'
import React, { useId } from 'react'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2'

import { Switch } from '@/components/ui/Switch'

import styles from './AiConfig.module.scss'

type SwitchFieldProps = {
  name: string
  label: string
  disabled?: boolean
}

export const SwitchField = ({ name, label, disabled }: SwitchFieldProps) => {
  const [field, , helpers] = useField<string>(name)

  return (
    <span data-field={name}>
      <Switch
        label={label}
        hideLabel
        disabled={disabled}
        checked={field.value === 'true'}
        onChange={(checked) => helpers.setValue(checked ? 'true' : 'false')}
      />
    </span>
  )
}

export const scoreLevel = (score: number) =>
  score <= 50 ? 'Lenient' : score < 70 ? 'Typical' : 'Strict'

type NumberFieldProps = {
  name: string
  label: string
  min?: number
  max?: number
  onValueChange?: (value: string) => void
  value?: string | number
  hint?: string
  /** A label-left row with a stepper input and a hint beside it. */
  inline?: boolean
  suffix?: string
  step?: number
}

export const NumberField = ({
  name,
  label,
  min = 1,
  max,
  onValueChange,
  value,
  hint,
  inline = false,
  suffix,
  step = 1,
}: NumberFieldProps) => {
  const [field, meta, helpers] = useField<string | number>(name)
  const id = useId()
  const shown = value ?? field.value ?? ''
  const hasError = meta.touched && !!meta.error

  const change = (next: string) =>
    onValueChange ? onValueChange(next) : helpers.setValue(next)

  const bump = (delta: number) => {
    const current = shown === '' ? min - delta : Number(shown)
    const next = Math.min(max ?? Infinity, Math.max(min, current + delta))
    change(String(next))
    void helpers.setTouched(true, false)
  }

  const input = (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={shown}
      aria-invalid={hasError || undefined}
      className={inline ? styles.stepperInput : styles.numberInput}
      style={
        inline && suffix
          ? { width: `${Math.max(String(shown).length, 1) + 1}ch` }
          : undefined
      }
      onChange={(event) => change(event.target.value)}
      onBlur={() => helpers.setTouched(true)}
    />
  )

  if (!inline) {
    return (
      <div className={styles.fieldGroup} data-field={name}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {input}
        {hint && <p className={styles.hint}>{hint}</p>}
        {hasError && (
          <div className={styles.fieldError} role="alert">
            {meta.error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.controlRow} data-field={name}>
      <label htmlFor={id} className={styles.controlLabel}>
        {label}
      </label>
      <div className={cn(styles.stepper, hasError && styles.stepperError)}>
        {input}
        {suffix && <span className={styles.stepperSuffix}>{suffix}</span>}
        <span className={styles.stepperButtons}>
          <button
            type="button"
            aria-label={`Increase ${label.toLowerCase()}`}
            onClick={() => bump(step)}>
            <HiChevronUp aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${label.toLowerCase()}`}
            onClick={() => bump(-step)}>
            <HiChevronDown aria-hidden />
          </button>
        </span>
      </div>
      <span className={styles.controlHint}>{hint}</span>
      {hasError && (
        <div className={styles.controlError} role="alert">
          {meta.error}
        </div>
      )}
    </div>
  )
}
