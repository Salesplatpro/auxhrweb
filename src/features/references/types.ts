import type { ReferenceStatus } from './referenceRules'

export type Referee = {
  id: string
  name: string
  email: string
  relationship: string
  status: ReferenceStatus
  sentAt: string | null
  expiresAt: string
  answeredAt: string | null
}

export type RefereeList = {
  applicationId: string
  references: Referee[]
}

export type Envelope<T> = {
  success: boolean
  data: T
}

export type RefereeQuestion = {
  key: string
  question: string
  required: boolean
}

export type RefereeRequest = {
  refereeName: string
  candidateName: string
  jobTitle: string
  companyName: string | null
  expiresAt: string
  questions: RefereeQuestion[]
}
