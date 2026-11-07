import type { ReferenceStatus } from './referenceRules'

export const canResend = (status: ReferenceStatus) => status !== 'answered'

export const answeredSummary = (references: { status: ReferenceStatus }[]) => {
  if (references.length === 0) return null
  const answered = references.filter(
    (item) => item.status === 'answered',
  ).length
  return `${answered} of ${references.length} answered`
}
