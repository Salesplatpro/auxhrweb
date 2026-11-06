import React, { useState } from 'react'
import { BsBuilding } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'

import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Typography'
import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { Organization } from '@/features/organizations/types'
import { getOrganizationStatusBadge } from '@/features/organizations/utils/getOrganizationStatusBadge'

import styles from './ActiveCompanyCard.module.scss'

const CompanyLogo: React.FC<{ organization: Organization }> = ({
  organization,
}) => {
  const [failed, setFailed] = useState(false)

  if (!organization.logoUrl || failed) {
    return (
      <div className={styles.logoFallback}>
        <BsBuilding size={20} />
      </div>
    )
  }

  return (
    <img
      src={organization.logoUrl}
      alt={`${organization.name} logo`}
      onError={() => setFailed(true)}
      className={styles.logo}
    />
  )
}

interface ActiveCompanyCardProps {
  organization?: Organization | null
}

const ActiveCompanyCard: React.FC<ActiveCompanyCardProps> = ({
  organization,
}) => {
  const navigate = useNavigate()

  if (!organization) {
    return (
      <Card className={styles.card}>
        <Text size="fs-sm" color="secondary">
          You don&apos;t have an active company yet.
        </Text>
        <Button onClick={() => navigate(ONBOARDING_PATHS.company)}>
          Create company
        </Button>
      </Card>
    )
  }

  return (
    <Card className={styles.card}>
      <div className={styles.info}>
        <CompanyLogo organization={organization} />
        <div>
          <Text size="fs-xs" color="secondary">
            Active company
          </Text>
          <div className={styles.nameRow}>
            <Text size="fs-md" weight="bolder">
              {organization.name}
            </Text>
            <StatusBadge
              status={organization.status}
              {...getOrganizationStatusBadge(organization.status)}
            />
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={() => navigate('/recruiterDashboard/company')}>
        Switch company
      </Button>
    </Card>
  )
}

export default ActiveCompanyCard
