export type CheckType = 'identity' | 'employment' | 'education' | 'criminal'

export type CheckStatus = 'pending' | 'passed' | 'flagged' | 'failed'

export type OverallCheckStatus =
  | 'failed'
  | 'flagged'
  | 'pending'
  | 'verified'
  | 'none'

export type CheckConsent = {
  applicationId: string
  consented: boolean
  version: string | null
  agreedAt: string | null
}

export type ApplicationCheck = {
  id: string
  type: CheckType
  status: CheckStatus
  resultText: string | null
  orderedById: string
  createdAt: string
  updatedAt: string
}

export type ApplicationChecks = {
  applicationId: string
  overallStatus: OverallCheckStatus
  checks: ApplicationCheck[]
}
