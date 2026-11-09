import { useCallback, useMemo, useRef } from 'react'

import {
  CompanyFormValues,
  EMPTY_COMPANY_FORM,
} from '@/features/organizations/companyForm/companyFormSchema'

import { COMPANY_DRAFT_PREFIX } from './draftStorage'

const draftKey = (userId?: string | null) =>
  userId ? `${COMPANY_DRAFT_PREFIX}${userId}` : null

export const isCompanyDraftEmpty = (values: CompanyFormValues) =>
  Object.values(values).every((value) => !value.trim())

export const readCompanyDraft = (
  userId?: string | null,
): CompanyFormValues | null => {
  const key = draftKey(userId)
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    return Object.fromEntries(
      Object.keys(EMPTY_COMPANY_FORM).map((field) => [
        field,
        typeof parsed[field] === 'string' ? parsed[field] : '',
      ]),
    ) as unknown as CompanyFormValues
  } catch {
    return null
  }
}

export const useCompanyDraft = (userId?: string | null) => {
  const key = draftKey(userId)
  const initialValues = useMemo(
    () => ({ ...EMPTY_COMPANY_FORM, ...readCompanyDraft(userId) }),
    [userId],
  )
  const cleared = useRef(false)

  const clear = useCallback(() => {
    cleared.current = true
    if (!key) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      return
    }
  }, [key])

  return { key, initialValues, cleared, clear }
}
