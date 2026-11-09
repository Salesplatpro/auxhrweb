export const VERIFY_EMAIL_PATH = '/verify-email'
export const JOIN_TEAM_PATH = '/join-team'

export const dashboardPathForRole = (userRole?: string | null): string => {
  if (userRole === 'recruiter') return '/recruiterDashboard/dashboard'
  if (userRole === 'talent') return '/talentDashboard'
  if (userRole === 'admin') return '/adminDashboard'
  return '/'
}

/** Talents and recruiters write to support; the admin answers it, so has no page here. */
export const supportPathForRole = (
  userRole?: string | null,
): string | undefined => {
  if (userRole === 'recruiter') return '/recruiterDashboard/support'
  if (userRole === 'talent') return '/talentDashboard/support'
  return undefined
}

export const changePasswordPathForRole = (
  userRole?: string | null,
): string | undefined => {
  if (userRole === 'recruiter') return '/recruiterDashboard/change-password'
  if (userRole === 'talent') return '/talentDashboard/change-password'
  return undefined
}

export const safeInternalPath = (value: string | null): string | null => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

const isAllowedResumePath = (
  userRole: string | null | undefined,
  path: string,
): boolean => {
  if (userRole === 'talent') {
    return (
      path.startsWith('/apply/') ||
      path.startsWith('/join-staff/') ||
      path.startsWith('/talentDashboard') ||
      path.startsWith('/onboarding/profile')
    )
  }
  if (userRole === 'recruiter') {
    return (
      path.startsWith('/recruiterDashboard') ||
      path === JOIN_TEAM_PATH ||
      path.startsWith('/payment/') ||
      path.startsWith('/join-company/') ||
      path.startsWith('/onboarding/company')
    )
  }
  if (userRole === 'admin') {
    return path.startsWith('/adminDashboard')
  }
  return false
}

export type SessionUser = {
  userRole?: string | null
  emailVerifiedAt?: string | null
}

const FLOW_PATH_PREFIXES = ['/apply/', '/join-staff/', '/join-company/']

const needsEmailVerification = (user?: SessionUser | null): boolean =>
  (user?.userRole === 'talent' || user?.userRole === 'recruiter') &&
  !user.emailVerifiedAt

/**
 * Post-login / already-logged-in destination. Apply and join flows keep their place
 * because they verify the email themselves; anyone else unverified goes to the inbox
 * screen. `next` is honored only when it is a safe path for that role.
 */
export const destinationAfterAuth = (
  user: SessionUser | null | undefined,
  nextPath: string | null,
): string => {
  const userRole = user?.userRole
  const next = safeInternalPath(nextPath)
  const allowedNext = next && isAllowedResumePath(userRole, next) ? next : null
  if (
    allowedNext &&
    FLOW_PATH_PREFIXES.some((prefix) => allowedNext.startsWith(prefix))
  ) {
    return allowedNext
  }
  if (needsEmailVerification(user)) return VERIFY_EMAIL_PATH
  return allowedNext ?? dashboardPathForRole(userRole)
}

export const loginPathWithNext = (next?: string | null): string => {
  const safe = safeInternalPath(next ?? null)
  if (!safe) return '/login'
  return `/login?next=${encodeURIComponent(safe)}`
}
