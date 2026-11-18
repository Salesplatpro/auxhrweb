import type { StaffInvitePreview } from '@/features/people/types'

export type JoinStaffScreen =
  | 'loading'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'login'
  | 'password'
  | 'accept'
  | 'wrong-role'
  | 'wrong-email'
  | 'joined'

export interface JoinStaffSession {
  token: string | null
  userRole?: string
  email?: string
}

interface JoinStaffState {
  invite: StaffInvitePreview | null
  isLoading: boolean
  isInvalid: boolean
  session: JoinStaffSession
  hasJoined: boolean
  accountExists: boolean
}

export const joinStaffScreen = ({
  invite,
  isLoading,
  isInvalid,
  session,
  hasJoined,
  accountExists,
}: JoinStaffState): JoinStaffScreen => {
  if (hasJoined) return 'joined'
  if (isLoading) return 'loading'
  if (isInvalid || !invite) return 'invalid'
  if (invite.status === 'expired') return 'expired'

  const signedIn = !!session.token
  if (invite.status === 'accepted') {
    return signedIn && session.userRole === 'talent' ? 'accept' : 'used'
  }

  if (!signedIn) {
    return invite.inviteeExists || accountExists ? 'login' : 'password'
  }
  if (session.userRole !== 'talent') return 'wrong-role'
  if (session.email?.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
    return 'wrong-email'
  }
  return 'accept'
}
