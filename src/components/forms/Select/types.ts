import { ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  options: SelectOption[]
  value?: string | null
  onChange: (value: string) => void
  /** Enables creatable mode: called when the typed text matches no option. */
  onCreateOption?: (inputValue: string) => void
  isLoading?: boolean
  placeholder?: string
  label?: string
  name?: string
  error?: string
  required?: boolean
  disabled?: boolean
  height?: string
  /** Adds a text filter input above the option list. */
  searchable?: boolean
  /** Renders the option list open immediately on mount instead of requiring a click to expand. */
  defaultOpen?: boolean
  icon?: ReactNode
}

export interface MultiSelectProps {
  options: SelectOption[]
  value?: string[]
  onChange: (value: string[]) => void
  /** Enables creatable mode: called when the typed text matches no option. */
  onCreateOption?: (inputValue: string) => void
  isLoading?: boolean
  placeholder?: string
  label?: string
  name?: string
  error?: string
  required?: boolean
  disabled?: boolean
  height?: string
  /** Adds a text filter input above the option list. */
  searchable?: boolean
}
