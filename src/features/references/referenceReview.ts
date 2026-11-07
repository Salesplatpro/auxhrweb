import type { ReferenceStatus } from './referenceRules'

export const canResend = (status: ReferenceStatus) => status !== 'answered'

export const answeredSummary = (references: { status: ReferenceStatus }[]) => {
  if (references.length === 0) return null
  const answered = references.filter(
    (item) => item.status === 'answered',
  ).length
  return `${answered} of ${references.length} answered`
}

export const resendMessage = (status: ReferenceStatus, name: string) =>
  status === 'not_sent'
    ? `We couldn't email ${name}. Try resending in a moment.`
    : `A new link is on its way to ${name}`
