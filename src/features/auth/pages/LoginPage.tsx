import React from 'react'
import { LuShieldCheck } from 'react-icons/lu'
import { Navigate, useSearchParams } from 'react-router-dom'

import { Pill } from '@/components/ui/Pill'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { destinationAfterAuth } from '@/features/auth/utils/dashboardPath'

import { AuthScreen } from '../components/AuthScreen'
import { AuthShell } from '../components/AuthShell'
import { LoginForm } from '../components/LoginForm'

export const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)
  const nextPath = searchParams.get('next')

  if (isLoggedIn) {
    const destination = destinationAfterAuth(userRole, nextPath)
    return <Navigate to={destination} replace />
  }

  return (
    <AuthShell>
      <AuthScreen
        eyebrow={<Pill icon={<LuShieldCheck />}>Secure login</Pill>}
        title="Welcome back"
        subtitle="Log in to your AuxHR account. One login for recruiters and talent.">
        <LoginForm />
      </AuthScreen>
    </AuthShell>
  )
}
