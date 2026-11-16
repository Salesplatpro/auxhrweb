import { ReactNode } from 'react'

import { STEP_ICON } from '@/features/talent-applications/stepIcons'
import { TestKind } from '@/features/talent-applications/steps'
import { PipelineStepKey } from '@/features/talent-applications/types'

export interface TestKindConfig {
  label: string
  step: PipelineStepKey
  icon: ReactNode
}

export const TEST_KINDS: Record<TestKind, TestKindConfig> = {
  'problem-solving': {
    label: 'Problem-solving test',
    step: 'problem_solving',
    icon: STEP_ICON.problem_solving,
  },
  'culture-fit': {
    label: 'Culture-fit test',
    step: 'culture_fit',
    icon: STEP_ICON.culture_fit,
  },
  tailored: {
    label: 'Tailored questions',
    step: 'tailored',
    icon: STEP_ICON.tailored,
  },
  personality: {
    label: 'Personality check',
    step: 'personality',
    icon: STEP_ICON.personality,
  },
}

export const isTestKind = (value: string | undefined): value is TestKind =>
  !!value && value in TEST_KINDS
