export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#fff4e2', color: '#fbb241' }
    case 'not-proceeding':
      return { backgroundColor: '#fff0ef', color: '#ff6f6d' }
    case 'retake_assessment':
      return { backgroundColor: '#f1f6fe', color: '#5d93e3' }
    case 'awaiting-decision':
    case 'awaiting_decision':
      return { backgroundColor: '#fff4e2', color: '#c17600' }
    case 'shortlisted':
      return { backgroundColor: '#edfeee', color: '#7cc88f' }
    case 'rejected':
      return { backgroundColor: '#af0303', color: '#f1f1ec' }
    case 'draft':
      return { backgroundColor: '#fff8e1', color: '#c99a06' }
    case 'active':
      return { backgroundColor: '#edfeee', color: '#2e9e4f' }
    case 'suspended':
    case 'pending_payment':
      return { backgroundColor: '#fff4e2', color: '#c17600' }
    case 'closed':
      return { backgroundColor: '#f3f4f6', color: '#6b7280' }
    default:
      return { backgroundColor: '#edfeee', color: '#76c8bc' }
  }
}

export const JOB_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
]

export const statusSavedMessage = (status: string) =>
  status === 'pending_payment'
    ? 'Saved. Pay for this job to put it live.'
    : 'Job status updated'

export const getStatusLabel = (status: string) =>
  status === 'pending_payment'
    ? 'Awaiting payment'
    : JOB_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
      status
