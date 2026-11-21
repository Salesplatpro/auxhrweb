import { describe, expect, it } from 'vitest'

import type { StaffDocument } from '../types'
import {
  DOCUMENT_STATUS,
  DOCUMENT_TEMPLATES,
  documentHistory,
  TEMPLATES_WITH_PAY,
} from './documentStatus'

const doc = (overrides: Partial<StaffDocument> = {}): StaffDocument => ({
  id: 'd-1',
  template: 'offer_letter',
  title: 'Offer letter',
  status: 'signed',
  displayStatus: 'signed',
  fields: null,
  createdAt: '2026-11-03T08:00:00Z',
  sentAt: '2026-11-05T09:15:00Z',
  openedAt: '2026-11-05T14:20:00Z',
  signedAt: '2026-11-05T14:32:00Z',
  declinedAt: null,
  signerName: 'Ada Obi',
  sentByName: 'Tunde Bakare',
  linkExpiresAt: null,
  needsNotarization: false,
  notarizedAt: null,
  notarizedScanName: null,
  notarizedByName: null,
  checkCode: null,
  copyStatus: 'done',
  ...overrides,
})

describe('document statuses', () => {
  it('names all six statuses the way the table shows them', () => {
    expect(
      Object.values(DOCUMENT_STATUS).map((status) => status.label),
    ).toEqual([
      'Draft',
      'Sent',
      'Signed',
      'Declined',
      'To notarize',
      'Notarized',
    ])
  })

  it('offers the four templates, with the NDA by its full name', () => {
    expect(DOCUMENT_TEMPLATES.map((template) => template.label)).toEqual([
      'Offer letter',
      'Non-disclosure agreement',
      'Work-ownership agreement',
      'Pay agreement',
    ])
    expect(TEMPLATES_WITH_PAY).toEqual(['offer_letter', 'pay_agreement'])
  })
})

describe('document history', () => {
  it('lists sent, opened and signed in order with who did each', () => {
    expect(documentHistory(doc(), 'Ada', 'ada@kosanatech.ng')).toEqual([
      {
        key: 'sent',
        label: 'Sent',
        at: '2026-11-05T09:15:00Z',
        text: 'Tunde Bakare sent it to ada@kosanatech.ng',
      },
      {
        key: 'opened',
        label: 'Opened',
        at: '2026-11-05T14:20:00Z',
        text: 'Ada opened the link',
      },
      {
        key: 'signed',
        label: 'Signed',
        at: '2026-11-05T14:32:00Z',
        text: 'Ada signed. A signed copy was emailed to both of you',
      },
    ])
  })

  it('shows a decline and leaves out what has not happened', () => {
    const events = documentHistory(
      doc({
        status: 'declined',
        signedAt: null,
        openedAt: null,
        declinedAt: '2026-11-06T10:00:00Z',
      }),
      'Ada',
      'ada@kosanatech.ng',
    )
    expect(events.map((event) => event.key)).toEqual(['sent', 'declined'])
    expect(
      documentHistory(
        doc({ status: 'draft', sentAt: null, openedAt: null, signedAt: null }),
        'Ada',
        'a@b.c',
      ),
    ).toEqual([])
  })
})
