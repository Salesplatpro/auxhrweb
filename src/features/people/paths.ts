export const peoplePaths = {
  employees: '/recruiterDashboard/people/employees',
  employee: (staffId: string) =>
    `/recruiterDashboard/people/employees/${staffId}`,
  accessLog: '/recruiterDashboard/people/access-log',
}

export const joinStaffPath = (token: string) => `/join-staff/${token}`
