import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useSWR from 'swr'

import { useProfile } from '@/features/profile/hooks/useProfile'
import {
  fetchOnboarding,
  ONBOARDING_ENDPOINT,
} from '@/features/profile/services/profileService'

import { ProductTour, TourCloseReason } from './ProductTour'
import { pageTourFor, STAGE_TOURS, TOUR_STEPS, TourRole } from './tourSteps'
import { useTourStore } from './useTourStore'

const STAGE_POLL_MS = 5000
const SEEN_KEY = 'auxhr-page-tours-seen'

// localStorage can be unavailable (private mode, blocked storage).
const readSeen = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SEEN_KEY) ?? '[]',
    )
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

const writeSeen = (seen: string[]) => {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch {
    // Seeing a page tour again is harmless.
  }
}

type ProductTourHostProps = {
  audience: TourRole
  /** Holds the tour back, e.g. while the talent pre-assessment locks navigation. */
  blocked?: boolean
}

export const ProductTourHost = ({
  audience: role,
  blocked = false,
}: ProductTourHostProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const active = useTourStore((state) => state.active)
  const paused = useTourStore((state) => state.paused)
  const stop = useTourStore((state) => state.stop)
  const pause = useTourStore((state) => state.pause)

  const replaying = active?.role === role

  const [seen, setSeen] = useState(readSeen)

  const { data, error, mutate } = useSWR(
    profile?.id && profile.userRole === role
      ? [ONBOARDING_ENDPOINT, profile.id]
      : null,
    fetchOnboarding,
    { revalidateOnFocus: false },
  )

  const stage = data?.data.onboarding.stage
  const stageSteps = stage ? STAGE_TOURS[stage] : undefined
  const stageKey = `${role}:${stage}`
  const showStageTour =
    !replaying && !!stageSteps && !blocked && !paused.includes(stageKey)

  const pageTour = pageTourFor(role, location.pathname)
  const showPageTour =
    !replaying &&
    !stageSteps &&
    (!!data || !!error) &&
    !blocked &&
    !!pageTour &&
    !seen.includes(pageTour.id)

  useEffect(() => {
    if (!showStageTour) return
    const interval = window.setInterval(() => void mutate(), STAGE_POLL_MS)
    return () => window.clearInterval(interval)
  }, [showStageTour, mutate])

  useEffect(() => {
    if (stageSteps && !replaying) void mutate()
  }, [stageSteps, replaying, location.pathname, mutate])

  useEffect(() => () => stop(), [stop])

  if (replaying) {
    const replaySteps =
      active?.scope === 'page' && pageTour ? pageTour.steps : TOUR_STEPS[role]
    return <ProductTour steps={replaySteps} onClose={stop} />
  }

  if (showPageTour && pageTour) {
    const handlePageClose = () => {
      const next = [...seen, pageTour.id]
      setSeen(next)
      writeSeen(next)
    }
    return (
      <ProductTour
        key={pageTour.id}
        steps={pageTour.steps}
        onClose={handlePageClose}
      />
    )
  }

  if (!showStageTour || !stageSteps) return null

  const handleClose = (reason: TourCloseReason) => {
    if (reason !== 'skipped') pause(stageKey)
  }

  return (
    <ProductTour
      key={stageKey}
      steps={stageSteps}
      forced
      pathname={location.pathname}
      onNavigate={(path) => navigate(path)}
      onClose={handleClose}
    />
  )
}
