import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizationMembers'
import {
  useHrAssignees,
  useSaveHrAssignments,
} from '@/features/people/hooks/useHrAssignments'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './DetailsTab.module.scss'

export const AssignedHrPanel: React.FC<{
  organizationId: string
  staffId: string
  isEnded: boolean
}> = ({ organizationId, staffId, isEnded }) => {
  const { assignees, isLoading, hasError } = useHrAssignees(
    organizationId,
    staffId,
  )
  const { members } = useOrganizationMembers(organizationId)
  const save = useSaveHrAssignments(organizationId)
  const [picked, setPicked] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const choices = members.filter(
    (member) =>
      !assignees.some((assignee) => assignee.userId === member.userId),
  )

  const change = async (input: {
    assigneeUserId: string
    add: string[]
    remove: string[]
  }) => {
    setIsSaving(true)
    try {
      await save(input)
      setPicked('')
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not save this change'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PagePanel
      title="Assigned HR"
      hint="They track this person's performance and activity. They can't see pay, benefits or contracts.">
      {isLoading ? (
        <Spinner />
      ) : hasError ? (
        <p>Couldn&apos;t load this. Refresh the page to try again.</p>
      ) : (
        <>
          {assignees.length === 0 ? (
            <p className={styles.muted}>No one is assigned yet.</p>
          ) : (
            <ul className={styles.assignees}>
              {assignees.map((assignee) => (
                <li key={assignee.userId}>
                  <span>
                    {assignee.fullName}
                    <span className={styles.muted}> · {assignee.email}</span>
                  </span>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() =>
                      void change({
                        assigneeUserId: assignee.userId,
                        add: [],
                        remove: [staffId],
                      })
                    }>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {!isEnded && choices.length > 0 && (
            <div className={styles.assignRow}>
              <select
                aria-label="Teammate to assign"
                value={picked}
                disabled={isSaving}
                onChange={(event) => setPicked(event.target.value)}>
                <option value="">Choose a teammate</option>
                {choices.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {`${member.user.firstName} ${member.user.lastName}`.trim()}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                type="button"
                loading={isSaving}
                disabled={!picked}
                onClick={() =>
                  void change({
                    assigneeUserId: picked,
                    add: [staffId],
                    remove: [],
                  })
                }>
                Assign
              </Button>
            </div>
          )}
        </>
      )}
    </PagePanel>
  )
}
