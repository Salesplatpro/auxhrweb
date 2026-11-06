import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'

import { AuthScreen } from '../components/AuthScreen'
import { AuthShell } from '../components/AuthShell'
import { SignupForm } from '../components/SignupForm'

export const SignupPage = () => {
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)

  if (isLoggedIn) {
    return <Navigate to={dashboardPathForRole(userRole)} replace />
  }

  const handleSuccess = (
    lastName: string,
    userType: 'talent' | 'recruiter',
  ) => {
    const dashboardPath =
      userType === 'recruiter'
        ? '/recruiterDashboard/dashboard'
        : '/talentDashboard'
    navigate(dashboardPath, {
      state: { showWelcomeModal: true, welcomeName: lastName },
    })
  }

  return (
    <AuthShell>
      <AuthScreen title="Create your account">
        <SignupForm onSuccess={handleSuccess} />
      </AuthScreen>
    </AuthShell>
  )
}
