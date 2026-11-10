import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { HiOutlineMagnifyingGlass, HiPlus } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { LoggedInUserBadge } from '@/pages/LoggedInUserBadge'

import styles from './DashboardHeader.module.scss'

export type DashboardAudience = 'recruiter' | 'talent'

export const SEARCH_MAX_LENGTH = 100

const SEARCH_PATH: Record<DashboardAudience, string> = {
  recruiter: '/recruiterDashboard/talent-search',
  talent: '/talentDashboard/job',
}

const SEARCH_PLACEHOLDER: Record<DashboardAudience, string> = {
  recruiter: 'Search candidates by role or skills',
  talent: 'Search jobs or companies',
}

const POST_JOB_PATH = '/recruiterDashboard/postjob'

const isMac = () =>
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

type DashboardHeaderProps = {
  audience: DashboardAudience
}

export const DashboardHeader = ({ audience }: DashboardHeaderProps) => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const keyword = query.trim()
    if (!keyword) return
    navigate(`${SEARCH_PATH[audience]}?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <div className={styles.header}>
      <form className={styles.search} role="search" onSubmit={submit}>
        <HiOutlineMagnifyingGlass
          className={styles.searchIcon}
          size={18}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          maxLength={SEARCH_MAX_LENGTH}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER[audience]}
          aria-label={SEARCH_PLACEHOLDER[audience]}
          className={styles.searchInput}
        />
        <kbd className={styles.shortcut}>{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
      </form>

      <div className={styles.actions}>
        {audience === 'recruiter' && (
          <Button
            variant="ink"
            size="sm"
            pill
            icon={<HiPlus size={16} />}
            data-tour="nav-post-job"
            aria-label="Post a job"
            onClick={() => navigate(POST_JOB_PATH)}>
            <span className={styles.postJobLabel}>Post A Job</span>
          </Button>
        )}
        <LoggedInUserBadge />
      </div>
    </div>
  )
}
