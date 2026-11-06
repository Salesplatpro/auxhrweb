import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_COMPANY_FORM } from '@/features/organizations/companyForm'

import {
  readCompanyDraft,
  useCompanyDraft,
  useDraftAutosave,
} from './companyDraft'
import { clearAllCompanyDrafts } from './draftStorage'

const KEY = 'auxhr:company-draft:user-1'

describe('company draft', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('saves after a pause and reloads into the form', () => {
    const { result: draft } = renderHook(() => useCompanyDraft('user-1'))
    const values = { ...EMPTY_COMPANY_FORM, name: 'Acme Ltd' }
    const { result } = renderHook(() =>
      useDraftAutosave(draft.current.key, values, draft.current.cleared),
    )

    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(600))
    expect(result.current).toBe(true)
    expect(readCompanyDraft('user-1')?.name).toBe('Acme Ltd')

    const { result: reloaded } = renderHook(() => useCompanyDraft('user-1'))
    expect(reloaded.current.initialValues.name).toBe('Acme Ltd')
  })

  it('keeps drafts apart per user', () => {
    localStorage.setItem(KEY, JSON.stringify({ name: 'Acme Ltd' }))
    expect(readCompanyDraft('user-2')).toBeNull()
  })

  it('does not save after the draft was cleared', () => {
    const { result: draft } = renderHook(() => useCompanyDraft('user-1'))
    renderHook(() =>
      useDraftAutosave(
        draft.current.key,
        { ...EMPTY_COMPANY_FORM, name: 'Acme Ltd' },
        draft.current.cleared,
      ),
    )
    act(() => draft.current.clear())
    act(() => vi.advanceTimersByTime(600))
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('ignores a broken draft', () => {
    localStorage.setItem(KEY, '{not json')
    expect(readCompanyDraft('user-1')).toBeNull()
    localStorage.setItem(KEY, JSON.stringify({ name: 42, email: 'a@b.co' }))
    expect(readCompanyDraft('user-1')).toMatchObject({
      name: '',
      email: 'a@b.co',
    })
  })

  it('removes every company draft on logout', () => {
    localStorage.setItem(KEY, '{}')
    localStorage.setItem('auxhr:company-draft:user-2', '{}')
    localStorage.setItem('unrelated', 'keep')
    clearAllCompanyDrafts()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorage.getItem('auxhr:company-draft:user-2')).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('stores nothing without a user id', () => {
    const { result: draft } = renderHook(() => useCompanyDraft(undefined))
    renderHook(() =>
      useDraftAutosave(
        draft.current.key,
        { ...EMPTY_COMPANY_FORM, name: 'Acme Ltd' },
        draft.current.cleared,
      ),
    )
    act(() => vi.advanceTimersByTime(600))
    expect(localStorage.length).toBe(0)
  })
})
