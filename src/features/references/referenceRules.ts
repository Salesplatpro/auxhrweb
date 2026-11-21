import * as Yup from 'yup'

export type ReferenceStatus = 'not_sent' | 'sent' | 'answered' | 'expired'

export const MAX_REFEREES = 3

export const REFERENCE_STATUS_LABEL: Record<ReferenceStatus, string> = {
  not_sent: 'Not sent',
  sent: 'Sent',
  answered: 'Answered',
  expired: 'Link expired',
}

export const REFEREE_RELATIONSHIPS = [
  { value: 'manager', label: 'Manager' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'client', label: 'Client' },
  { value: 'other', label: 'Other' },
]

export const relationshipLabel = (value: string) =>
  REFEREE_RELATIONSHIPS.find((item) => item.value === value)?.label ?? value

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
    .required('Choose how you know them')
    .oneOf(
      REFEREE_RELATIONSHIPS.map((item) => item.value),
      'Choose how you know them',
    ),
})

export const refereesSchema = (maxNew: number) =>
  Yup.object({
    referees: Yup.array()
      .of(refereeSchema)
      .min(1, 'Add at least one referee')
      .max(maxNew, `You can name at most ${MAX_REFEREES} referees`)
      .test(
        'unique-emails',
        'Each referee needs a different email address',
        (rows) => {
          const emails = (rows ?? []).map((row) =>
            (row?.email ?? '').trim().toLowerCase(),
          )
          return new Set(emails).size === emails.length
        },
      ),
  })
