import React, { useState } from 'react'

import { ConfirmDialog } from '@/components/feedback'
import { Select } from '@/components/forms/Select'
import { TextArea } from '@/components/forms/TextArea'
import { TextInput } from '@/components/forms/TextInput'
import {
  type ResultFormValues,
  emptyResult,
  RESULT_OPTIONS,
  resultPayload,
  resultSchema,
} from '@/features/checks/checkRules'
import { saveCheckResult } from '@/features/checks/checksService'
import type { CheckType, OpenCheck } from '@/features/checks/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './VerificationTab.module.scss'

type ResultModalProps = {
  check: OpenCheck
  candidateName: string
  onCancel: () => void
  onSaved: () => void | Promise<void>
}

const TITLE: Record<CheckType, string> = {
  identity: 'Enter the ID name',
  employment: 'Enter the result',
  education: 'Enter the result',
  criminal: 'Enter the result',
}

export const ResultModal = ({
  check,
  candidateName,
  onCancel,
  onSaved,
}: ResultModalProps) => {
  const [values, setValues] = useState<ResultFormValues>(emptyResult)
  const [errors, setErrors] = useState<
    Partial<Record<keyof ResultFormValues, string>>
  >({})
  const [saving, setSaving] = useState(false)
  const set = (key: keyof ResultFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))
  const identity = check.type === 'identity'

  const save = async () => {
    try {
      await resultSchema(check.type).validate(values, { abortEarly: false })
    } catch (validation) {
      const found: Partial<Record<keyof ResultFormValues, string>> = {}
      for (const issue of (
        validation as { inner?: { path?: string; message: string }[] }
      ).inner ?? []) {
        const key = issue.path as keyof ResultFormValues
        if (key && !found[key]) found[key] = issue.message
      }
      setErrors(found)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await saveCheckResult(check.id, resultPayload(check.type, values))
      await onSaved()
    } catch (saveError) {
      notify(
        'error',
        getErrorMessage(saveError, "We couldn't save the result. Try again."),
        { autoClose: 4000 },
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfirmDialog
      open
      title={TITLE[check.type]}
      description={`${check.type[0]!.toUpperCase()}${check.type.slice(
        1,
      )} check for ${candidateName}`}
      confirmLabel="Save result"
      variant="ink"
      isConfirming={saving}
      onConfirm={() => void save()}
      onCancel={onCancel}>
      <div className={styles.modalFields}>
        {identity ? (
          <TextInput
            title="Name on the ID"
            name="nameOnId"
            label="Name on the ID"
            maxLength={200}
            value={values.nameOnId}
            error={errors.nameOnId}
            onChange={(event) => set('nameOnId', event.target.value)}
          />
        ) : (
          <>
            <TextInput
              title="Who confirmed it"
              name="confirmedBy"
              label="Who confirmed it"
              maxLength={160}
              value={values.confirmedBy}
              error={errors.confirmedBy}
              onChange={(event) => set('confirmedBy', event.target.value)}
            />
            <Select
              label="Result"
              name="result"
              placeholder="Choose a result"
              options={RESULT_OPTIONS}
              value={values.result}
              error={errors.result}
              onChange={(value) => set('result', value)}
            />
          </>
        )}
        <TextInput
          title="Date"
          name="confirmedOn"
          label="Date"
          type="date"
          value={values.confirmedOn}
          error={errors.confirmedOn}
          onChange={(event) => set('confirmedOn', event.target.value)}
        />
        <TextArea
          title="Note"
          name="note"
          value={values.note}
          error={errors.note}
          maxLength={2000}
          rows={3}
          onChange={(event) => set('note', event.target.value)}
        />
      </div>
    </ConfirmDialog>
  )
}
