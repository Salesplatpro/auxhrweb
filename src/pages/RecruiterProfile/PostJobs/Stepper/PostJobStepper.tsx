import React from 'react'

import {
  type StepDef,
  Stepper,
} from '../../../../components/ui/Stepper/Stepper'

export type PostJobStepId = 'details' | 'screening' | 'review'

const STEPS: StepDef<PostJobStepId>[] = [
  { id: 'details', title: 'Job details' },
  { id: 'screening', title: 'AI Configuration' },
  { id: 'review', title: 'Review & publish' },
]

type PostJobStepperProps = {
  current: PostJobStepId
  /** Steps the recruiter may jump to; anything else renders as plain text. */
  onSelect?: (step: PostJobStepId) => void
  selectable?: PostJobStepId[]
}

export const PostJobStepper = ({
  current,
  onSelect,
  selectable = [],
}: PostJobStepperProps) => (
  <Stepper
    connected
    steps={STEPS}
    current={current}
    ariaLabel="Post a job progress"
    selectable={selectable}
    onSelect={onSelect}
  />
)
