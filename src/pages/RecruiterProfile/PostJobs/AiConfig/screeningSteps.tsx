import React from 'react'
import {
  HiOutlineChatBubbleLeft,
  HiOutlineDocumentText,
  HiOutlineHeart,
  HiOutlineVideoCamera,
} from 'react-icons/hi2'
import { LuBrain, LuPuzzle, LuSquareCheck } from 'react-icons/lu'

import { IconBadgeTone } from '@/components/ui/IconBadge'

export type ScreeningStepKey =
  | 'skillsTest'
  | 'cvMatch'
  | 'tailored'
  | 'problemSolving'
  | 'cultureFit'
  | 'personality'
  | 'aiInterview'

export const SCREENING_STEP_ICON: Record<
  ScreeningStepKey,
  { icon: React.ReactNode; tone: IconBadgeTone }
> = {
  skillsTest: { icon: <LuSquareCheck />, tone: 'success' },
  cvMatch: { icon: <HiOutlineDocumentText />, tone: 'brand' },
  tailored: { icon: <HiOutlineChatBubbleLeft />, tone: 'danger' },
  problemSolving: { icon: <LuPuzzle />, tone: 'warning' },
  cultureFit: { icon: <HiOutlineHeart />, tone: 'danger' },
  personality: { icon: <LuBrain />, tone: 'violet' },
  aiInterview: { icon: <HiOutlineVideoCamera />, tone: 'violet' },
}

/** Steps shown with a "New" badge. */
export const NEW_SCREENING_STEPS: ScreeningStepKey[] = ['aiInterview']
