export const ROUTES = {
  admin: {
    // Organizations
    organizations: (locale: string) => `/${locale}/admin/organizations`,
    organizationsCreate: (locale: string) =>
      `/${locale}/admin/organizations/edit`,
    organizationsEdit: (locale: string, id: string) =>
      `/${locale}/admin/organizations/edit/${id}`,

    // Users
    employees: (locale: string) => `/${locale}/admin/employees`,
    employeesCreate: (locale: string) => `/${locale}/admin/employees/edit`,
    employeesEdit: (locale: string, id: string) =>
      `/${locale}/admin/employees/edit/${id}`,

    // My Time Tracking
    myTimeTracking: (locale: string) => `/${locale}/admin/my-time-tracking`,
    myTimeTrackingCreate: (locale: string) =>
      `/${locale}/admin/my-time-tracking/edit`,
    myTimeTrackingEdit: (locale: string, id: string) =>
      `/${locale}/admin/my-time-tracking/edit/${id}`,

    // Roles
    roles: (locale: string) => `/${locale}/admin/roles`,

    // Users
    users: (locale: string) => `/${locale}/admin/users`,
    usersCreate: (locale: string) => `/${locale}/admin/users/edit`,
    usersEdit: (locale: string, id: string) =>
      `/${locale}/admin/users/edit/${id}`,
  },
  public: {
    signIn: (locale: string) => `/${locale}/sign-in`,
  },
};
