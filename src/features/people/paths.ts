export const peoplePaths = {
  employees: '/recruiterDashboard/people/employees',
  employee: (staffId: string) =>
    `/recruiterDashboard/people/employees/${staffId}`,
  accessLog: '/recruiterDashboard/people/access-log',
  benefits: '/recruiterDashboard/people/benefits',
  commissionPlans: '/recruiterDashboard/people/commission-plans',
  headcountCost: '/recruiterDashboard/people/headcount-cost',
}

export const joinStaffPath = (token: string) => `/join-staff/${token}`
