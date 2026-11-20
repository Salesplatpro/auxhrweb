export const ACCESS_FILTER_OPTIONS = [
  { label: 'What: Anything', value: '' },
  { label: 'Pay', value: 'pay' },
  { label: 'Contract', value: 'contract' },
  { label: 'Performance', value: 'performance' },
  { label: 'Share options', value: 'share_options' },
  { label: 'Details', value: 'details' },
]

const RESOURCE_LABELS: Record<string, string> = {
  pay: 'Pay',
  contract: 'Contract',
  performance: 'Performance',
  share_options: 'Share options',
  staff_record: 'Details',
  staff_activity: 'Details',
  headcount_cost: 'Headcount cost',
}

export const accessLabel = (resource: string) =>
  RESOURCE_LABELS[resource] ?? resource
