import React, { ReactNode } from 'react'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineHeart,
  HiOutlinePuzzlePiece,
  HiOutlineUser,
} from 'react-icons/hi2'

import { TestKind } from '@/features/talent-applications/steps'
import { PipelineStepKey } from '@/features/talent-applications/types'

export interface TestKindConfig {
  label: string
  step: PipelineStepKey
  icon: ReactNode
  choice: boolean
}

export const TEST_KINDS: Record<TestKind, TestKindConfig> = {
  'problem-solving': {
    label: 'Problem-solving test',
    step: 'problem_solving',
    icon: <HiOutlinePuzzlePiece />,
    choice: true,
  },
  'culture-fit': {
    label: 'Culture-fit test',
    step: 'culture_fit',
    icon: <HiOutlineHeart />,
    choice: true,
  },
  tailored: {
    label: 'Tailored questions',
    step: 'tailored',
    icon: <HiOutlineChatBubbleLeftRight />,
    choice: false,
  },
  personality: {
    label: 'Personality check',
    step: 'personality',
    icon: <HiOutlineUser />,
    choice: false,
  },
}

export const isTestKind = (value: string | undefined): value is TestKind =>
  !!value && value in TEST_KINDS
