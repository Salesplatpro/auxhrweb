import { describe, expect, it } from 'vitest'

import {
  createCompanySchema,
  EMPTY_COMPANY_FORM,
  fieldForServerError,
  stepForField,
  toCreatePayload,
  toUpdatePayload,
} from './companyFormSchema'

const valid = {
  ...EMPTY_COMPANY_FORM,
  name: 'Acme Ltd',
  domain: 'acmeltd.com',
  industry: 'Technology',
  address: '12 Admiralty Way, Lekki Phase 1, Lagos',
  email: 'hiring@acmeltd.com',
  phone: '+2348058272524',
  website: 'https://acmeltd.com',
}

describe('createCompanySchema', () => {
  it('accepts a complete company', async () => {
    await expect(createCompanySchema.validate(valid)).resolves.toBeTruthy()
  })

  it('asks to drop the leading zero after the dial code', async () => {
    await expect(
      createCompanySchema.validateAt('phone', {
        ...valid,
        phone: '+23408058272524',
      }),
    ).rejects.toThrow(
      'Remove the first 0. After +234 it should read 805 827 2524.',
    )
  })

  it('catches an email that no longer matches a changed domain', async () => {
    await expect(
      createCompanySchema.validateAt('email', {
        ...valid,
        domain: 'acme.ng',
      }),
    ).rejects.toThrow('Use an email on acme.ng, since you added that domain.')
  })

  it('requires LinkedIn only when there is no domain', async () => {
    await expect(
      createCompanySchema.validateAt('linkedin', { ...valid, domain: '' }),
    ).rejects.toThrow(/LinkedIn URL is required/)
    await expect(
      createCompanySchema.validateAt('linkedin', valid),
    ).resolves.toBe('')
  })
})

describe('payloads', () => {
  it('leaves out a blank phone the server would reject', () => {
    expect(toCreatePayload({ ...valid, phone: '' })).not.toHaveProperty(
      'phone',
      '',
    )
    expect(toCreatePayload({ ...valid, phone: '' }).phone).toBeUndefined()
    expect(toUpdatePayload({ ...valid, phone: ' ' }).phone).toBeUndefined()
  })

  it('trims what it sends', () => {
    expect(toCreatePayload({ ...valid, name: ' Acme Ltd ' }).name).toBe(
      'Acme Ltd',
    )
  })
})

describe('server errors', () => {
  it('maps a conflict message to its field and step', () => {
    const field = fieldForServerError(
      'Organization already registered with this phone number',
    )
    expect(field).toBe('phone')
    expect(stepForField(field!)).toBe(1)
  })

  it('maps an email and website mismatch to the email step', () => {
    expect(
      fieldForServerError(
        'Contact email domain must match your website domain (@acme.com).',
      ),
    ).toBe('email')
  })

  it('prefers validation field keys over the message', () => {
    expect(fieldForServerError('Bad input', { address: 'Required' })).toBe(
      'address',
    )
  })
})
