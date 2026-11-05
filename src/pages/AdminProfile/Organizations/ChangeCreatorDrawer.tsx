import React, { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { changeAdminOrganizationOwner } from '@/features/admin/services/adminService'
import { AdminOrganization } from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './OrganizationDetail.module.scss'

const MIN_REASON = 3
const MAX_REASON = 500

export const ChangeCreatorDrawer: React.FC<{
  organization: AdminOrganization
  onClose: () => void
  onChanged: () => void
}> = ({ organization, onClose, onChanged }) => {
  const [pickedUserId, setPickedUserId] = useState('')
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const teammates = (organization.members ?? []).filter(
    (member) => member.userId !== organization.owner?.id,
  )
  const picked = teammates.find((member) => member.userId === pickedUserId)
  const subscription = organization.activeSubscription
  const trimmedReason = reason.trim()

  const save = async () => {
    setIsSaving(true)
    try {
      await changeAdminOrganizationOwner(organization.id, {
        newOwnerUserId: pickedUserId,
        reason: trimmedReason,
      })
      notify('success', 'Company creator changed')
      onChanged()
      onClose()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not change the creator'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Change company creator"
      subtitle={organization.name}
      actions={
        <Button
          type="button"
          loading={isSaving}
          disabled={!picked || trimmedReason.length < MIN_REASON}
          onClick={() => void save()}>
          Change creator
        </Button>
      }>
      <div className={styles.creatorForm}>
        <p className={styles.creatorNote}>
          The new creator sees every employee&apos;s pay, benefits and
          contracts, and manages the team and plan. The current creator stays on
          the team without those rights.
        </p>

        {teammates.length === 0 ? (
          <p className={styles.creatorNote}>
            This company has no other teammates. Someone has to join the team
            before they can become its creator.
          </p>
        ) : (
          <fieldset className={styles.creatorChoices}>
            <legend>New creator</legend>
            {teammates.map((member) => {
              const name =
                `${member.user.firstName} ${member.user.lastName}`.trim()
              return (
                <label key={member.id} className={styles.creatorChoice}>
                  <input
                    type="radio"
                    name="newCreator"
                    aria-label={name || member.user.email}
                    value={member.userId}
                    checked={pickedUserId === member.userId}
                    onChange={() => setPickedUserId(member.userId)}
                  />
                  <span>
                    <span className={styles.memberName}>
                      {name || 'Recruiter'}
                    </span>
                    <span className={styles.memberEmail}>
                      {member.user.email}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        )}

        <p className={styles.creatorNote}>
          Employees on the People page use talent accounts, so they can&apos;t
          be picked until they have a recruiter account on this team.
        </p>

        <label className={styles.creatorReason}>
          <span>Why is the creator changing?</span>
          <textarea
            rows={3}
            maxLength={MAX_REASON}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        {subscription && (
          <p className={styles.creatorWarning} role="alert">
            {subscription.planName ?? 'The current plan'} stays on the previous
            creator&apos;s card
            {subscription.nextPaymentDate
              ? `, next charged on ${new Date(
                  subscription.nextPaymentDate,
                ).toLocaleDateString()}`
              : ''}
            . It moves to their card when the new creator buys the plan.
          </p>
        )}
      </div>
    </Drawer>
  )
}
