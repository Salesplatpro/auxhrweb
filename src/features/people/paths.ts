export const peoplePaths = {
  employees: '/recruiterDashboard/people/employees',
  employee: (staffId: string) =>
    `/recruiterDashboard/people/employees/${staffId}`,
  accessLog: '/recruiterDashboard/people/access-log',
  benefits: '/recruiterDashboard/people/benefits',
  commissionPlans: '/recruiterDashboard/people/commission-plans',
  headcountCost: '/recruiterDashboard/people/headcount-cost',
  companyProfile: '/recruiterDashboard/people/company-profile',
}

export const myWorkPath = '/talentDashboard/my-work'

export const myWorkDocumentPath = (documentId: string) =>
  `${myWorkPath}/documents/${documentId}`

export const joinStaffPath = (token: string) => `/join-staff/${token}`
