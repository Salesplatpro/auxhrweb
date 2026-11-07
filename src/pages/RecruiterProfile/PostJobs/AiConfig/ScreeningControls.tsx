import { useField } from 'formik'
import React, { useId } from 'react'

import styles from './AiConfig.module.scss'

type SwitchFieldProps = {
  name: string
  label: string
}

export const SwitchField = ({ name, label }: SwitchFieldProps) => {
  const [field, meta, helpers] = useField<string>(name)
  const labelId = useId()
  const checked = field.value === 'true'

  return (
    <div className={styles.switchRow}>
      <span id={labelId} className={styles.switchLabel}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        data-field={name}
        className={[styles.switchTrack, checked ? styles.switchOn : ''].join(
          ' ',
        )}
        onClick={() => helpers.setValue(checked ? 'false' : 'true')}>
        <span className={styles.switchThumb} />
      </button>
      {meta.touched && meta.error && (
        <div className={styles.fieldError}>{meta.error}</div>
      )}
    </div>
  )
}

interface RadioFieldProps {
  name: string
  legend: string
  options: { value: string; label: string }[]
}

export const RadioField = ({ name, legend, options }: RadioFieldProps) => {
  const [field, meta, helpers] = useField<string>(name)

  return (
    <fieldset className={styles.switchRow} data-field={name}>
      <legend className={styles.switchLabel}>{legend}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={field.value === option.value}
            onChange={() => helpers.setValue(option.value)}
          />{' '}
          {option.label}
        </label>
      ))}
      {meta.touched && meta.error && (
        <div className={styles.fieldError}>{meta.error}</div>
      )}
    </fieldset>
  )
}

export const scoreLevel = (score: number) =>
  score <= 50 ? 'Lenient' : score < 70 ? 'Typical' : 'Strict'

type ScoreSliderProps = {
  name: string
  label: string
}

export const ScoreSlider = ({ name, label }: ScoreSliderProps) => {
  const [field, meta, helpers] = useField<string | number>(name)
  const id = useId()
  const hasValue = field.value !== '' && field.value != null
  const numeric = hasValue ? Number(field.value) : 0
  const valueText = hasValue
    ? `${numeric}% — ${scoreLevel(numeric)}`
    : 'Not set'

  return (
    <div className={styles.fieldGroup} data-field={name}>
      <div className={styles.sliderHeader}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span className={styles.sliderValue} aria-hidden>
          {valueText}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={numeric}
        aria-valuetext={valueText}
        className={styles.slider}
        onChange={(event) => helpers.setValue(event.target.value)}
        onBlur={() => helpers.setTouched(true)}
      />
      <div className={styles.sliderScale} aria-hidden>
        <span>Lenient</span>
        <span>Typical</span>
        <span>Strict</span>
      </div>
      {meta.touched && meta.error && (
        <div className={styles.fieldError} role="alert">
          {meta.error}
        </div>
      )}
    </div>
  )
}

type NumberFieldProps = {
  name: string
  label: string
  min?: number
  max?: number
  onValueChange?: (value: string) => void
  value?: string | number
  hint?: string
}

export const NumberField = ({
  name,
  label,
  min = 1,
  max,
  onValueChange,
  value,
  hint,
}: NumberFieldProps) => {
  const [field, meta, helpers] = useField<string | number>(name)
  const id = useId()
  const shown = value ?? field.value ?? ''
  const hasError = meta.touched && !!meta.error

  return (
    <div className={styles.fieldGroup} data-field={name}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={shown}
        aria-invalid={hasError || undefined}
        className={styles.numberInput}
        onChange={(event) =>
          onValueChange
            ? onValueChange(event.target.value)
            : helpers.setValue(event.target.value)
        }
        onBlur={() => helpers.setTouched(true)}
      />
      {hint && <p className={styles.hint}>{hint}</p>}
      {hasError && (
        <div className={styles.fieldError} role="alert">
          {meta.error}
        </div>
      )}
    </div>
  )
}
