import * as Yup from 'yup'

export type ReferenceStatus = 'not_sent' | 'sent' | 'answered' | 'expired'

export const MAX_REFEREES = 3

export const REFERENCE_STATUS_LABEL: Record<ReferenceStatus, string> = {
  not_sent: 'Email not sent',
  sent: 'Waiting for reply',
  answered: 'Answered',
  expired: 'Link expired',
}

export const canNameAnotherReferee = (count: number) => count < MAX_REFEREES

export type RefereeFormValues = {
  name: string
  email: string
  relationship: string
}

export const EMPTY_REFEREE: RefereeFormValues = {
  name: '',
  email: '',
  relationship: '',
}

export const refereeSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Enter the referee's name")
    .max(120, 'Keep the name under 120 characters'),
  email: Yup.string()
    .trim()
    .required('Enter their email address')
    .email('Enter a valid email address'),
  relationship: Yup.string()
    .trim()
    .required('Tell us how you know them')
    .max(120, 'Keep it under 120 characters'),
})
