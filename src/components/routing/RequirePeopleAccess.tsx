import React from 'react'
import { Outlet } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { NoPeopleAccess } from '@/features/people/components/NoPeopleAccess'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'

interface RequirePeopleAccessProps {
  /** For pages only the company owner may open, such as the access log. */
  ownerOnly?: boolean
}

const RequirePeopleAccess: React.FC<RequirePeopleAccessProps> = ({
  ownerOnly = false,
}) => {
  const { isLoading, isOwner, canManagePeople } = usePeopleAccess()

  if (isLoading) {
    return <Spinner fullPage />
  }

  return (ownerOnly ? isOwner : canManagePeople) ? (
    <Outlet />
  ) : (
    <NoPeopleAccess />
  )
}

export default RequirePeopleAccess
