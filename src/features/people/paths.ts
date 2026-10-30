export const peoplePaths = {
  employees: '/recruiterDashboard/people/employees',
  employee: (staffId: string) =>
    `/recruiterDashboard/people/employees/${staffId}`,
  accessLog: '/recruiterDashboard/people/access-log',
  benefits: '/recruiterDashboard/people/benefits',
}

export const joinStaffPath = (token: string) => `/join-staff/${token}`
