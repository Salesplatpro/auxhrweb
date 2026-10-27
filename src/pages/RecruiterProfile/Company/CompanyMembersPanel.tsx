import React, { useState } from 'react'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PagePanel } from '@/components/layout/PagePanel'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { MAX_COMPANY_TEAMMATES } from '@/features/organizations/constants/team'
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizationMembers'
import { useSetMemberCanManagePeople } from '@/features/organizations/hooks/useSetMemberCanManagePeople'
import {
  Organization,
  OrganizationMember,
} from '@/features/organizations/types'

import styles from './CompanyMembersPanel.module.scss'

interface CompanyMembersPanelProps {
  organization: Organization
}

const roleLabel = (role: string) => (role === 'owner' ? 'Creator' : 'Recruiter')

export const CompanyMembersPanel: React.FC<CompanyMembersPanelProps> = ({
  organization,
}) => {
  const { members, isLoading } = useOrganizationMembers(organization.id)
  const { setCanManagePeople, pendingMemberId } = useSetMemberCanManagePeople(
    organization.id,
  )
  const [toEnable, setToEnable] = useState<OrganizationMember | null>(null)

  const handleToggle = (member: OrganizationMember, next: boolean) => {
    if (next) {
      setToEnable(member)
      return
    }
    void setCanManagePeople(member, false)
  }

  const confirmEnable = async () => {
    if (!toEnable) return
    await setCanManagePeople(toEnable, true)
    setToEnable(null)
  }

  if (isLoading) {
    return (
      <PagePanel
        title="Team"
        hint={`People who belong to ${organization.name}.`}>
        <Spinner />
      </PagePanel>
    )
  }

  return (
    <PagePanel
      title="Team"
      hint={`The creator plus up to ${MAX_COMPANY_TEAMMATES} recruiters in ${organization.name}.`}>
      {members.length === 0 ? (
        <p className={styles.empty}>
          No one is on this company yet. Invite a recruiter to add them here.
        </p>
      ) : (
        <div className={styles.list}>
          {members.map((member) => {
            const fullName =
              `${member.user.firstName} ${member.user.lastName}`.trim()
            return (
              <article key={member.id} className={styles.card}>
                <div>
                  <div className={styles.nameRow}>
                    <p className={styles.name}>{fullName || 'Recruiter'}</p>
                    <span
                      className={
                        member.role === 'owner'
                          ? styles.ownerChip
                          : styles.memberChip
                      }>
                      {roleLabel(member.role)}
                    </span>
                  </div>
                  <p className={styles.meta}>
                    {member.user.email}
                    {member.workEmail && member.workEmail !== member.user.email
                      ? ` · Work email ${member.workEmail}`
                      : ''}
                  </p>
                </div>
                {member.role === 'owner' ? (
                  <span className={styles.alwaysOn}>Can manage people</span>
                ) : (
                  <Switch
                    label="Can manage people"
                    checked={member.canManagePeople}
                    disabled={pendingMemberId === member.id}
                    onChange={(next) => handleToggle(member, next)}
                  />
                )}
              </article>
            )
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!toEnable}
        title="Let this person manage people?"
        message="This person will see everyone's pay, contracts and performance."
        confirmLabel="Allow access"
        isConfirming={!!toEnable && pendingMemberId === toEnable.id}
        onConfirm={() => void confirmEnable()}
        onCancel={() => setToEnable(null)}
      />
    </PagePanel>
  )
}
