import React from 'react'

import { useGetRoleQuery } from '@/redux/api/talent'
import { Role } from '@/utils/types'

import { MultiSelect } from '../Select'

interface RoleMultiSelectProps {
  name?: string
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  error?: string
  required?: boolean
  label?: string
  height?: string
  creatable?: boolean
}

export const RoleMultiSelect: React.FC<RoleMultiSelectProps> = ({
  name,
  value,
  onChange,
  disabled,
  error,
  required,
  label,
  height,
  creatable = false,
}) => {
  const { data, isLoading } = useGetRoleQuery({})

  const roles: Role[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.roles)
    ? data.data.roles
    : []

  const options = roles.map((role: Role) => ({
    value: String(role.id),
    label: role.name || '',
  }))

  return (
    <MultiSelect
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      onCreateOption={
        creatable
          ? (typed) => {
              const taken = [...value, ...options.map((option) => option.label)]
              if (
                taken.some((item) => item.toLowerCase() === typed.toLowerCase())
              )
                return
              onChange([...value, typed])
            }
          : undefined
      }
      isLoading={isLoading}
      placeholder="Select roles..."
      searchable
      disabled={disabled}
      error={error}
      required={required}
      label={label}
      height={height}
    />
  )
}
