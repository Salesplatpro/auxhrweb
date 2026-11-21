import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Select } from '@/components/forms/Select'
import { TextInput } from '@/components/forms/TextInput'
import { Button } from '@/components/ui'
import { CheckList } from '@/components/ui/CheckList'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { peoplePaths } from '@/features/people/paths'
import { previewStaffDocument } from '@/features/people/services/peopleService'
import {
  DocumentPreview,
  DocumentTemplate,
  StaffDocument,
  StaffMember,
} from '@/features/people/types'
import {
  DOCUMENT_TEMPLATES,
  TEMPLATES_WITH_PAY,
} from '@/features/people/utils/documentStatus'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './NewDocumentDrawer.module.scss'

type Fields = { startDate: string; jobTitle: string; managerName: string }

type NewDocumentDrawerProps = {
  staff: StaffMember
  organizationId: string
  open: boolean
  draft: StaffDocument | null
  onClose: () => void
}

const fieldsFrom = (
  preview: DocumentPreview,
  draft: StaffDocument | null,
): Fields => ({
  startDate: draft?.fields?.startDate ?? preview.facts.startDate,
  jobTitle: draft?.fields?.jobTitle ?? preview.facts.jobTitle,
  managerName: draft?.fields?.managerName ?? preview.facts.managerName ?? '',
})

export const NewDocumentDrawer = ({
  staff,
  organizationId,
  open,
  draft,
  onClose,
}: NewDocumentDrawerProps) => {
  const navigate = useNavigate()
  const { saveDraft, isSaving } = useStaffActions(organizationId)
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [preview, setPreview] = useState<DocumentPreview | null>(null)
  const [fields, setFields] = useState<Fields | null>(null)

  useEffect(() => {
    if (!open) {
      setTemplate(null)
      setPreview(null)
      setFields(null)
      return
    }
    setTemplate(draft?.template ?? null)
  }, [open, draft])

  useEffect(() => {
    if (!template) return
    let isCurrent = true
    setPreview(null)
    previewStaffDocument(organizationId, staff.id, template)
      .then((result) => {
        if (!isCurrent) return
        setPreview(result)
        setFields(
          fieldsFrom(result, draft?.template === template ? draft : null),
        )
      })
      .catch((error) => {
        if (isCurrent) {
          notify(
            'error',
            getErrorMessage(error, 'Could not load the preview. Try again.'),
          )
        }
      })
    return () => {
      isCurrent = false
    }
  }, [organizationId, staff.id, template, draft])

  const set = (key: keyof Fields, value: string) =>
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev))

  const needsPay = !!template && TEMPLATES_WITH_PAY.includes(template)
  const payMissing = needsPay && (preview?.missing.includes('pay') ?? false)
  const label = DOCUMENT_TEMPLATES.find(
    (item) => item.value === template,
  )?.label

  const handlePreview = async () => {
    if (!template || !fields) return
    const saved = await saveDraft(staff, template, {
      startDate: fields.startDate || undefined,
      jobTitle: fields.jobTitle.trim() || undefined,
      managerName: fields.managerName.trim() || undefined,
    })
    if (saved) {
      onClose()
      navigate(peoplePaths.employeeDocument(staff.id, saved.document.id))
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New document"
      subtitle={`Choose a template for ${staff.fullName}`}
      footer={
        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ink"
            pill
            loading={isSaving}
            disabled={!template || !fields || !fields.startDate}
            onClick={() => void handlePreview()}>
            Preview
          </Button>
        </div>
      }>
      <div className={styles.fields}>
        <Select
          label="Template"
          name="template"
          placeholder="Choose a template"
          options={DOCUMENT_TEMPLATES}
          value={template}
          disabled={!!draft}
          onChange={(value) => setTemplate(value as DocumentTemplate)}
        />
        {fields && (
          <>
            <div className={styles.pair}>
              <TextInput
                title="Start date"
                name="startDate"
                label="Start date"
                type="date"
                value={fields.startDate}
                onChange={(event) => set('startDate', event.target.value)}
              />
              <TextInput
                title="Job title"
                name="jobTitle"
                label="Job title"
                maxLength={120}
                value={fields.jobTitle}
                onChange={(event) => set('jobTitle', event.target.value)}
              />
            </div>
            <div className={styles.pair}>
              <TextInput
                title="Monthly pay"
                name="monthlyPay"
                label="Monthly pay"
                value={preview?.facts.monthlyPay ?? 'Not set up'}
                disabled
              />
              <TextInput
                title="Manager"
                name="managerName"
                label="Manager"
                maxLength={120}
                value={fields.managerName}
                onChange={(event) => set('managerName', event.target.value)}
              />
            </div>
            {payMissing && (
              <p className={styles.hint}>
                No pay set up yet. Set up pay first, then the pay paragraph
                fills in.
              </p>
            )}
            <section className={styles.preview} aria-label="Preview summary">
              <h3>PREVIEW</h3>
              <CheckList
                variant="summary"
                items={[
                  {
                    label: `${label} for ${staff.fullName}, ${fields.jobTitle}`,
                  },
                  {
                    label: `Starts ${formatDateOnly(fields.startDate)}${
                      fields.managerName
                        ? `, reports to ${fields.managerName}`
                        : ''
                    }`,
                  },
                  ...(needsPay
                    ? [
                        {
                          label: payMissing
                            ? 'Pay paragraph: no pay set up yet'
                            : `Pay paragraph: ${preview?.facts.monthlyPay} a month`,
                          done: !payMissing,
                        },
                      ]
                    : []),
                ]}
              />
            </section>
          </>
        )}
      </div>
    </Drawer>
  )
}
