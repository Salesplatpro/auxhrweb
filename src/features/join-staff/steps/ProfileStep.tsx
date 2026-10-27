import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { joinStaffPath } from '@/features/people/paths'
import { ProfileCompletionForm } from '@/features/profile/components/ProfileCompletionForm'

import type { JoinStaffContext } from '../JoinStaffLayout'

const ProfileStep: React.FC = () => {
  const { token } = useOutletContext<JoinStaffContext>()
  const navigate = useNavigate()

  return (
    <ProfileCompletionForm
      continueLabel="Continue"
      onComplete={() =>
        navigate(`${joinStaffPath(token)}/join`, { replace: true })
      }
    />
  )
}

export default ProfileStep
