import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VerifyDocument } from './VerifyDocument'

const { codeMock, fileMock } = vi.hoisted(() => ({
  codeMock: vi.fn(),
  fileMock: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  checkSignedDocumentCode: codeMock,
  checkSignedDocumentFile: fileMock,
}))

const check = {
  result: 'verified',
  companyName: 'Acme Ltd',
  title: 'Offer letter',
  signerName: 'Ada Obi',
  signedAt: '2026-11-03T10:00:00Z',
}

const submitCode = () => {
  fireEvent.change(screen.getByLabelText('Document ID'), {
    target: { value: ' d-1 ' },
  })
  fireEvent.change(screen.getByLabelText('Check code'), {
    target: { value: ' abc ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Check code' }))
}

describe('VerifyDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    render(<VerifyDocument />)
  })

  it('confirms a matching code and trims what was typed', async () => {
    codeMock.mockResolvedValue(check)
    submitCode()

    expect(
      await screen.findByText('This matches the document that was signed.'),
    ).toBeTruthy()
    expect(codeMock).toHaveBeenCalledWith('d-1', 'abc')
    expect(screen.getByText('Ada Obi')).toBeTruthy()
  })

  it('warns when the record has changed and explains an older document', async () => {
    codeMock.mockResolvedValueOnce({ ...check, result: 'changed' })
    submitCode()
    expect(
      await screen.findByText(/has changed since it was signed/),
    ).toBeTruthy()

    codeMock.mockResolvedValueOnce({ ...check, result: 'limited' })
    submitCode()
    expect(await screen.findByText(/This is an older document/)).toBeTruthy()
    expect(screen.queryByText(/has changed since it was signed/)).toBeNull()
  })

  it("shows the server's message when nothing matches", async () => {
    codeMock.mockRejectedValue({
      response: { data: { error: { message: "We couldn't match this" } } },
    })
    submitCode()
    expect(await screen.findByText("We couldn't match this")).toBeTruthy()
  })

  it('refuses a file over 5 MB without uploading it', async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.pdf')
    fireEvent.change(screen.getByLabelText('Or upload the signed PDF'), {
      target: { files: [file] },
    })
    expect(
      await screen.findByText('The file must be 5 MB or smaller.'),
    ).toBeTruthy()
    expect(fileMock).not.toHaveBeenCalled()
  })

  it('checks an uploaded file', async () => {
    fileMock.mockResolvedValue(check)
    const file = new File(['%PDF'], 'signed.pdf')
    fireEvent.change(screen.getByLabelText('Or upload the signed PDF'), {
      target: { files: [file] },
    })
    await waitFor(() => expect(fileMock).toHaveBeenCalledWith(file))
    expect(
      await screen.findByText('This matches the document that was signed.'),
    ).toBeTruthy()
  })
})
