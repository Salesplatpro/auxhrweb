import * as Yup from 'yup'

import type { IdKind } from './types'

export const CONSENT_VERSION = '2026-11-v2'
export const ID_NUMBER_LENGTH = 11

export const ID_KIND_OPTIONS: { value: IdKind; label: string }[] = [
  { value: 'nin', label: 'NIN' },
  { value: 'bvn', label: 'BVN' },
]

export type ConsentFormValues = {
  idKind: IdKind
  idNumber: string
  agreed: boolean
}

export const INITIAL_CONSENT: ConsentFormValues = {
  idKind: 'nin',
  idNumber: '',
  agreed: false,
}

export const digitsOnly = (value: string) =>
  value.replace(/\D/g, '').slice(0, ID_NUMBER_LENGTH)

export const consentSchema = Yup.object({
  idKind: Yup.string().oneOf(['nin', 'bvn']).required(),
  idNumber: Yup.string()
    .required('Enter your NIN or BVN')
    .matches(/^\d{11}$/, `Enter exactly ${ID_NUMBER_LENGTH} digits`),
  agreed: Yup.boolean().oneOf([true], 'Tick the box to agree to these checks'),
})
