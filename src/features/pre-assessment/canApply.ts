import { Assessment } from './types'

/** A talent can apply to jobs once they hold a valid pre-assessment score. */
export const canApplyToJobs = (assessment: Assessment | null): boolean =>
  assessment?.hasValidScore ?? assessment?.status === 'completed'
