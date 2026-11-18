import React, { useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { LuUserPlus } from 'react-icons/lu'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { TextInput } from '@/components/forms'
import { PagePanel } from '@/components/layout/PagePanel'
import { Avatar, Button } from '@/components/ui'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { Pill } from '@/components/ui/Pill'
import { Switch } from '@/components/ui/Switch'
import { useSetMemberTitle } from '@/features/organizations/hooks/useCompanyDetails'
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizationMembers'
import { useSetMemberCanManagePeople } from '@/features/organizations/hooks/useSetMemberCanManagePeople'
import {
  Organization,
  OrganizationMember,
} from '@/features/organizations/types'

import { AssignableTeammate, AssignPeopleDrawer } from './AssignPeopleDrawer'
import styles from './CompanyMembersPanel.module.scss'

interface CompanyMembersPanelProps {
  organization: Organization
  seats?: { used: number; limit: number | null } | null
  onInvite: () => void
}

const MAX_TITLE_LENGTH = 60

const fullNameOf = (member: OrganizationMember) =>
  `${member.user.firstName} ${member.user.lastName}`.trim() || 'Recruiter'

const isOwner = (member: OrganizationMember) => member.role === 'owner'

export const CompanyMembersPanel: React.FC<CompanyMembersPanelProps> = ({
  organization,
  seats,
  onInvite,
}) => {
  const { members, isLoading } = useOrganizationMembers(organization.id)
  const { setCanManagePeople, pendingMemberId } = useSetMemberCanManagePeople(
    organization.id,
  )
  const { setTitle, isSaving: isSavingTitle } = useSetMemberTitle(
    organization.id,
  )
  const [toEnable, setToEnable] = useState<OrganizationMember | null>(null)
  const [assigning, setAssigning] = useState<AssignableTeammate | null>(null)
  const [titling, setTitling] = useState<OrganizationMember | null>(null)
  const [titleDraft, setTitleDraft] = useState('')

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

  const openTitle = (member: OrganizationMember) => {
    setTitleDraft(member.title ?? '')
    setTitling(member)
  }

  const saveTitle = async () => {
    if (!titling) return
    if (await setTitle(titling, titleDraft)) setTitling(null)
  }

  const columns: ColumnDef<OrganizationMember>[] = [
    {
      key: 'member',
      header: 'Member',
      render: (member) => (
        <div className={styles.memberCell}>
          <Avatar
            firstName={member.user.firstName}
            lastName={member.user.lastName}
            size="sm"
          />
          <div>
            <p className={styles.name}>{fullNameOf(member)}</p>
            <p className={styles.meta}>
              {member.workEmail || member.user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (member) =>
        isOwner(member) ? (
          <Pill size="sm">Owner</Pill>
        ) : (
          <Pill size="sm" tone="neutral">
            {member.title || 'Member'}
          </Pill>
        ),
    },
    {
      key: 'canManagePeople',
      header: 'Can manage people',
      render: (member) =>
        isOwner(member) ? (
          <Switch label="Always on" checked disabled onChange={() => {}} />
        ) : (
          <Switch
            label={`Can manage people: ${fullNameOf(member)}`}
            hideLabel
            checked={member.canManagePeople}
            disabled={pendingMemberId === member.id}
            onChange={(next) => handleToggle(member, next)}
          />
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (member) => (
        <TableActions>
          <Dropdown
            trigger={
              <BsThreeDotsVertical
                aria-label={`Actions for ${fullNameOf(member)}`}
              />
            }
            items={[
              {
                label: 'Set job title',
                onClick: () => openTitle(member),
              },
              {
                label: 'Choose who they manage',
                onClick: () =>
                  setAssigning({
                    userId: member.userId,
                    name: fullNameOf(member),
                  }),
              },
            ]}
          />
        </TableActions>
      ),
    },
  ]

  const seatsText = seats
    ? `${seats.used} of ${seats.limit ?? 'unlimited'} seats used · `
    : ''

  return (
    <PagePanel
      title="Members"
      hint={`${seatsText}Only the owner can change people access`}
      flush
      action={
        <Button variant="outline" size="sm" onClick={onInvite}>
          <LuUserPlus aria-hidden />
          Invite member
        </Button>
      }>
      <DataTable
        variant="plain"
        allowOverflow
        columns={columns}
        data={members}
        pageSize={10}
        isLoading={isLoading}
        getRowKey={(member) => member.id}
        ariaLabel="Company members"
        emptyState={
          <p className={styles.empty}>
            No one is on this company yet. Invite a recruiter to add them here.
          </p>
        }
      />
      <ConfirmDialog
        open={!!toEnable}
        title={`Let ${
          toEnable ? fullNameOf(toEnable) : 'this person'
        } manage people?`}
        description="They'll be able to add, edit and end employees and see everyone's performance. Pay, benefits and contracts stay with the company's owner. You can turn this off at any time."
        confirmLabel="Turn on"
        variant="ink"
        isConfirming={!!toEnable && pendingMemberId === toEnable.id}
        onConfirm={() => void confirmEnable()}
        onCancel={() => setToEnable(null)}
      />
      <ConfirmDialog
        open={!!titling}
        title={`Job title for ${titling ? fullNameOf(titling) : 'this person'}`}
        description="Shown in the Role column, for example HR lead or Recruiter."
        confirmLabel="Save"
        variant="ink"
        isConfirming={isSavingTitle}
        onConfirm={() => void saveTitle()}
        onCancel={() => setTitling(null)}>
        <TextInput
          name="memberTitle"
          label="memberTitle"
          title="Job title"
          value={titleDraft}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => setTitleDraft(event.target.value)}
        />
      </ConfirmDialog>
      <AssignPeopleDrawer
        organizationId={organization.id}
        teammate={assigning}
        onClose={() => setAssigning(null)}
      />
    </PagePanel>
  )
}
