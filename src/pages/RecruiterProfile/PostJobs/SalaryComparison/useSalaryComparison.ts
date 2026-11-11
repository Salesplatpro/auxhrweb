import { skipToken } from '@reduxjs/toolkit/query'

import { workModeNeedsLocation } from '@/components/features/jobs/WorkTypeCheckboxes'
import { salaryBounds } from '@/features/jobs/utils/jobSalary'
import { useSalaryComparisonQuery } from '@/redux/api/recruiter'
import { PostJobFormValues } from '@/utils/jobPostTypes'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SalaryVerdict = 'below' | 'around' | 'above'

export const VERDICT_LABEL: Record<SalaryVerdict, string> = {
  below: 'Below the middle',
  around: 'Around the middle',
  above: 'Above the middle',
}

/** Within 10% of the middle counts as around it. */
export const salaryVerdict = (pay: number, middle: number): SalaryVerdict =>
  pay < middle * 0.9 ? 'below' : pay > middle * 1.1 ? 'above' : 'around'

/** What similar AuxHR jobs pay, for a job being set up. Skipped until the role is a saved one. */
export const useSalaryComparison = (
  values: Pick<
    PostJobFormValues,
    | 'role'
    | 'experienceLevel'
    | 'currency'
    | 'compensationPeriod'
    | 'workMode'
    | 'location'
    | 'minSalary'
    | 'maxSalary'
  >,
  excludeJobId?: string,
) => {
  const located = workModeNeedsLocation(values.workMode)
  const ready =
    UUID.test(values.role) &&
    !!values.experienceLevel &&
    !!values.currency &&
    !!values.compensationPeriod
  const { data, isError } = useSalaryComparisonQuery(
    ready
      ? {
          roleId: values.role,
          experienceLevel: values.experienceLevel,
          currency: values.currency,
          compensationPeriod: values.compensationPeriod,
          ...(located && values.location.country.name
            ? { locationCountry: values.location.country.name }
            : {}),
          ...(located && values.location.state.name
            ? { locationState: values.location.state.name }
            : {}),
          ...(located && values.location.city.name
            ? { locationCity: values.location.city.name }
            : {}),
          ...(excludeJobId ? { excludeJobId } : {}),
        }
      : skipToken,
  )

  const comparison = ready && !isError ? data?.data ?? null : null
  const { min, max } = salaryBounds(values)
  const pay = min != null && max != null ? (min + max) / 2 : min ?? max
  const verdict =
    comparison?.available && pay != null
      ? salaryVerdict(pay, comparison.middle)
      : null

  return { comparison, verdict, min, max }
}
