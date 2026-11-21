export type ConsentState = 'not_requested' | 'requested' | 'agreed' | 'declined'

export type IdKind = 'nin' | 'bvn'

export type Consent = {
  applicationId: string
  state: ConsentState
  version: string | null
  requestedAt: string | null
  agreedAt: string | null
  declinedAt: string | null
  idKind: IdKind | null
  idNumberLast4: string | null
}

export type Envelope<T> = {
  success: boolean
  data: T
}

export type CheckType = 'identity' | 'employment' | 'education' | 'criminal'
export type CheckStatus = 'pending' | 'passed' | 'flagged' | 'failed'
export type OverallStatus =
  | 'none'
  | 'pending'
  | 'flagged'
  | 'failed'
  | 'verified'

export type CheckEventKind =
  | 'ordered'
  | 'result_saved'
  | 'viewed'
  | 'id_number_viewed'

export type OpenCheck = {
  id: string
  applicationId: string
  type: CheckType
  restricted: false
  status: CheckStatus
  resultText: string | null
  confirmedBy: string | null
  confirmedOn: string | null
  note: string | null
  nameOnId: string | null
  nameGiven: string | null
  completedAt: string | null
  orderedById: string
  createdAt: string
  updatedAt: string
}

export type RestrictedCheck = {
  id: string
  applicationId: string
  type: CheckType
  restricted: true
}

export type ApplicationCheck = OpenCheck | RestrictedCheck

export type ChecksOverview = {
  applicationId: string
  candidateName: string
  consent: ConsentState
  overallStatus: OverallStatus
  criminalAvailable: boolean
  ownerName: string
  checks: ApplicationCheck[]
}

export type CheckResultInput = {
  confirmedOn: string
  confirmedBy?: string
  result?: 'verified' | 'flagged' | 'failed'
  nameOnId?: string
  note?: string
}

export type CheckEvent = {
  id: string
  kind: CheckEventKind
  detail: string | null
  actorName: string | null
  createdAt: string
}

export type CheckHistory = {
  checkId: string
  type: CheckType
  events: CheckEvent[]
}
