import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/store/useAuthStore'

import { AccountChip } from './AccountChip'

describe('AccountChip', () => {
  const logout = vi.fn()

  beforeEach(() => {
    logout.mockReset()
    useAuthStore.setState({ user: { userRole: 'recruiter' }, logout })
  })

  const renderChip = () =>
    render(
      <MemoryRouter>
        <AccountChip firstName="Ada" lastName="Obi" subtitle="Recruiter" />
      </MemoryRouter>,
    )

  it('opens the menu and closes it with Escape', () => {
    renderChip()
    fireEvent.click(screen.getByRole('button', { name: /Ada Obi/ }))
    expect(screen.getByRole('menu')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes when clicking outside', () => {
    renderChip()
    fireEvent.click(screen.getByRole('button', { name: /Ada Obi/ }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('logs out from the menu', () => {
    renderChip()
    fireEvent.click(screen.getByRole('button', { name: /Ada Obi/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Log out/ }))
    expect(logout).toHaveBeenCalled()
  })
})
