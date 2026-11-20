import { ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
  /** A second, muted line under the label in the option list. */
  description?: string
}

export interface SelectFooterAction {
  label: string
  icon?: ReactNode
  onClick: () => void
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
  /** A row pinned under the option list, for an action such as creating a new option. */
  footerAction?: SelectFooterAction
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
