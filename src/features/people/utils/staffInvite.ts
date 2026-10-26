import { StaffMember } from '../types'

export const canSendInvite = (staff: StaffMember): boolean =>
  staff.status !== 'ended' && !staff.hasAccount

export const inviteActionLabel = (staff: StaffMember): string => {
  if (staff.invite.state === 'pending') return 'Resend invite'
  if (staff.invite.state === 'expired') return 'Send a new invite'
  return 'Send invite'
}
