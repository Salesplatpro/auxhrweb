import React, { ReactNode } from 'react'
import {
  LuArrowRight,
  LuBuilding2,
  LuCheck,
  LuFileText,
  LuMail,
  LuShieldCheck,
  LuUser,
} from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Pill, PillTone } from '@/components/ui/Pill'
import { AuthPrompt, AuthScreen } from '@/features/auth/components/AuthScreen'
import {
  dashboardPathForRole,
  JOIN_TEAM_PATH,
} from '@/features/auth/utils/dashboardPath'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { ProfileUser } from '@/features/profile/types'

import styles from './EmailVerifiedScreen.module.scss'

type Row = { icon: ReactNode; label: string; status: string; tone: PillTone }

type Plan = {
  lead: string
  third: Row
  cta: { label: string; to: string }
  offerAccessCode: boolean
}

const planFor = (profile: ProfileUser, joinedCompanyName?: string): Plan => {
  const firstName = profile.firstName?.trim() || 'there'
  const dashboard = {
    label: 'Go to dashboard',
    to: dashboardPathForRole(profile.userRole),
  }

  if (profile.userRole === 'recruiter') {
    const companyName = joinedCompanyName ?? profile.activeOrganization?.name
    if (joinedCompanyName || profile.activeOrganizationId || companyName) {
      return {
        lead: joinedCompanyName
          ? `Welcome to AuxHR, ${firstName}. You joined ${joinedCompanyName}, so you can start hiring with your team.`
          : `Welcome to AuxHR, ${firstName}. Your account is active.`,
        third: {
          icon: <LuBuilding2 />,
          label: companyName ?? 'Company',
          status: joinedCompanyName ? 'Joined' : 'Set up',
          tone: 'success',
        },
        cta: dashboard,
        offerAccessCode: false,
      }
    }
    return {
      lead: `Welcome to AuxHR, ${firstName}. Your account is active. Next, set up your company so you can post your first job.`,
      third: {
        icon: <LuBuilding2 />,
        label: 'Company',
        status: 'Not set up yet',
        tone: 'warning',
      },
      cta: { label: 'Set up your company', to: ONBOARDING_PATHS.company },
      offerAccessCode: true,
    }
  }

  const completion = profile.profileCompletion
  if (completion?.isProfileComplete) {
    return {
      lead: `Welcome to AuxHR, ${firstName}. Your account is active.`,
      third: {
        icon: <LuFileText />,
        label: 'Profile',
        status: 'Complete',
        tone: 'success',
      },
      cta: dashboard,
      offerAccessCode: false,
    }
  }
  return {
    lead: `Welcome to AuxHR, ${firstName}. Your account is active. Next, build your profile so recruiters can find you.`,
    third: {
      icon: <LuFileText />,
      label: 'Profile',
      status: completion?.canProceedToPlatform
        ? `${completion.percentage}% done`
        : 'Not set up yet',
      tone: completion?.canProceedToPlatform ? 'neutral' : 'warning',
    },
    cta: { label: 'Build your profile', to: ONBOARDING_PATHS.profile },
    offerAccessCode: false,
  }
}

type EmailVerifiedScreenProps = {
  profile: ProfileUser
  joinedCompanyName?: string
}

export const EmailVerifiedScreen = ({
  profile,
  joinedCompanyName,
}: EmailVerifiedScreenProps) => {
  const navigate = useNavigate()
  const plan = planFor(profile, joinedCompanyName)
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ')
  const roleLabel = profile.userRole === 'recruiter' ? 'Recruiter' : 'Talent'

  const rows: Row[] = [
    {
      icon: <LuUser />,
      label: fullName || 'Your account',
      status: roleLabel,
      tone: 'brand',
    },
    {
      icon: <LuMail />,
      label: profile.email ?? 'Your email',
      status: 'Verified',
      tone: 'success',
    },
    plan.third,
  ]

  return (
    <AuthScreen
      icon={{ icon: <LuCheck />, tone: 'success' }}
      eyebrow={
        <span className={styles.eyebrow}>
          <Pill icon={<LuShieldCheck />}>Account active</Pill>
        </span>
      }
      title="Email verified"
      subtitle={plan.lead}>
      <ul className={styles.summary}>
        {rows.map((row) => (
          <li key={row.label + row.status} className={styles.row}>
            <span className={styles.rowIcon} aria-hidden>
              {row.icon}
            </span>
            <span className={styles.rowLabel}>{row.label}</span>
            <Pill tone={row.tone} size="sm">
              {row.status}
            </Pill>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ink"
        size="xl"
        pill
        stretch
        iconEnd={<LuArrowRight />}
        onClick={() => navigate(plan.cta.to, { replace: true })}>
        {plan.cta.label}
      </Button>
      {plan.offerAccessCode && (
        <AuthPrompt
          text="Joining your team instead?"
          linkLabel="Use an access code"
          to={JOIN_TEAM_PATH}
        />
      )}
    </AuthScreen>
  )
}
