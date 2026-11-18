import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ShareGrant, StaffMember } from '@/features/people/types'

import { ShareOptionsCard } from './ShareOptionsCard'

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    addGrant: vi.fn(),
    removeGrant: vi.fn(),
    isSaving: false,
  }),
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  status: 'active',
} as StaffMember

const grant: ShareGrant = {
  id: 'g-1',
  shares: 10000,
  grantedOn: '2026-05-01',
  cliffMonths: 6,
  vestingMonths: 48,
  strikePrice: 50,
  currency: 'NGN',
  createdByName: 'Philip Kosana',
  createdAt: '2026-05-02T10:00:00.000Z',
}

const renderCard = (grants: ShareGrant[]) =>
  render(
    <MemoryRouter>
      <ShareOptionsCard organizationId="org-1" staff={staff} grants={grants} />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ShareOptionsCard', () => {
  it('shows an empty state with no grants', () => {
    renderCard([])
    expect(screen.getByText('No share options yet')).toBeTruthy()
  })

  it('shows a vesting grant with who added it and the next lot', () => {
    vi.setSystemTime(new Date('2026-11-18T12:00:00Z'))
    renderCard([grant])

    expect(screen.getByText('Grant 1 · 10,000 shares')).toBeTruthy()
    expect(
      screen.getByText('Added by Philip Kosana on 2 May 2026'),
    ).toBeTruthy()
    expect(screen.getByText('Vesting')).toBeTruthy()
    expect(
      screen.getByText("1,250 of 10,000 shares are now Ada's."),
    ).toBeTruthy()
    expect(screen.getByText('Next 208 shares on 1 Dec 2026')).toBeTruthy()
    expect(screen.getByText('₦50 per share')).toBeTruthy()
  })

  it('tells how long until the cliff before it, and hides the added-by line for old grants', () => {
    vi.setSystemTime(new Date('2026-10-04T12:00:00Z'))
    renderCard([{ ...grant, createdByName: null }])

    expect(screen.getByText('Before cliff')).toBeTruthy()
    expect(
      screen.getByText(
        "No shares are Ada's yet. 1,250 become Ada's at the cliff on 1 Nov 2026.",
      ),
    ).toBeTruthy()
    expect(screen.getByText('Cliff in 4 weeks')).toBeTruthy()
    expect(screen.queryByText(/Added by/)).toBeNull()
  })

  it('previews the schedule in the Add grant drawer', () => {
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'))
    renderCard([])
    fireEvent.click(screen.getByRole('button', { name: 'Add grant' }))
    fireEvent.change(screen.getByLabelText(/Number of shares/), {
      target: { value: '10000', name: 'shares' },
    })
    fireEvent.change(screen.getByLabelText(/Cliff/), {
      target: { value: '6', name: 'cliffMonths' },
    })
    fireEvent.change(screen.getByLabelText(/Strike price/), {
      target: { value: '50', name: 'strikePrice' },
    })

    return screen
      .findByText("1,250 shares become Ada's on 1 Nov 2026 (after the cliff)")
      .then(() => {
        expect(
          screen.getByText('Then about 208 shares each month'),
        ).toBeTruthy()
        expect(
          screen.getByText("All 10,000 shares are Ada's on 1 May 2030"),
        ).toBeTruthy()
      })
  })
})
