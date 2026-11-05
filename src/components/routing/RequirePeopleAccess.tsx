import React from 'react'
import { Outlet } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { NoPeopleAccess } from '@/features/people/components/NoPeopleAccess'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'

interface RequirePeopleAccessProps {
  /**
   * any: an assigned teammate is enough.
   * manage: company-wide tasks, for "Can manage people" and the creator.
   * creator: pay, benefits, contracts and the access log.
   */
  level?: 'any' | 'manage' | 'creator'
}

const RequirePeopleAccess: React.FC<RequirePeopleAccessProps> = ({
  level = 'any',
}) => {
  const { isLoading, isOwner, canManagePeople, hasPeopleAccess } =
    usePeopleAccess()

  if (isLoading) {
    return <Spinner fullPage />
  }

  const allowed = {
    any: hasPeopleAccess,
    manage: canManagePeople,
    creator: isOwner,
  }[level]

  return allowed ? <Outlet /> : <NoPeopleAccess />
}

export default RequirePeopleAccess
