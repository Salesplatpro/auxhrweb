import React from 'react'
import { HiChevronDown } from 'react-icons/hi2'

import styles from './MyJobPosts.module.scss'

export const ToolbarTrigger = ({
  label,
  icon,
}: {
  label: string
  icon?: React.ReactNode
}) => (
  <span className={styles.trigger}>
    {icon}
    {label}
    <HiChevronDown size={14} aria-hidden />
  </span>
)
