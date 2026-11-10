import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { ProfileUser } from '@/features/profile/types'

const roleLabel = (role: string | undefined, profile?: ProfileUser | null) => {
  if (role === 'recruiter') {
    const ownsCompany =
      !!profile?.id && profile.activeOrganization?.ownerId === profile.id
    return ownsCompany ? 'Recruiter · Owner' : 'Recruiter'
  }
  if (role === 'talent') return profile?.userRoles?.[0]?.name ?? 'Talent'
  if (role === 'admin') return 'Admin'
  return ''
}

export const useUserIdentity = () => {
  const user = useAuthStore((state) => state.user)
  const { profile, isLoading, error } = useProfile()

  const role = user?.userRole
  const firstName = profile?.firstName || user?.firstName || ''
  const lastName = profile?.lastName || user?.lastName || ''

  return {
    role,
    profile,
    isLoading,
    error,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || 'Account',
    email: profile?.email || user?.email || '',
    imageUrl: profile?.profileImageUrl,
    roleLabel: roleLabel(role, profile),
  }
}
