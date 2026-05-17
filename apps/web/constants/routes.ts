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
    employeesView: (locale: string, id: string) =>
      `/${locale}/admin/employees/${id}`,
    employeesCreate: (locale: string) => `/${locale}/admin/employees/edit`,
    employeesEdit: (locale: string, id: string) =>
      `/${locale}/admin/employees/edit/${id}`,

    // My Time Tracking
    myTimeTracking: (locale: string) => `/${locale}/admin/my-time-tracking`,
    myTimeTrackingCreate: (locale: string) =>
      `/${locale}/admin/my-time-tracking/edit`,
    myTimeTrackingEdit: (locale: string, id: string) =>
      `/${locale}/admin/my-time-tracking/edit/${id}`,

    // School Classes
    schoolClasses: (locale: string) => `/${locale}/admin/school-classes`,
    schoolClassesCreate: (locale: string) =>
      `/${locale}/admin/school-classes/edit`,
    schoolClassesEdit: (locale: string, id: string) =>
      `/${locale}/admin/school-classes/edit/${id}`,

    // Grade Levels
    gradeLevels: (locale: string) => `/${locale}/admin/grade-levels`,

    // Teams
    teams: (locale: string) => `/${locale}/admin/teams`,
    teamsDetail: (locale: string, id: string) =>
      `/${locale}/admin/teams/${id}`,

    // Students
    students: (locale: string) => `/${locale}/admin/students`,
    studentsView: (locale: string, id: string) =>
      `/${locale}/admin/students/${id}`,
    studentsCreate: (locale: string) => `/${locale}/admin/students/edit`,
    studentsEdit: (locale: string, id: string) =>
      `/${locale}/admin/students/edit/${id}`,
    studentsKanban: (locale: string) => `/${locale}/admin/students/kanban`,

    // Contact Persons
    contactPersons: (locale: string) => `/${locale}/admin/contact-persons`,
    contactPersonsCreate: (locale: string) =>
      `/${locale}/admin/contact-persons/edit`,
    contactPersonsEdit: (locale: string, id: string) =>
      `/${locale}/admin/contact-persons/edit/${id}`,

    // Curricula
    curricula: (locale: string) => `/${locale}/admin/curricula`,
    curriculaCreate: (locale: string) => `/${locale}/admin/curricula/edit`,
    curriculaEdit: (locale: string, id: string) =>
      `/${locale}/admin/curricula/edit/${id}`,

    // Record Keeping
    recordKeeping: (locale: string) => `/${locale}/admin/record-keeping`,

    // Admission Stages
    admissionStages: (locale: string) =>
      `/${locale}/admin/settings/admission-stages`,

    // Country Input Templates
    countryTemplates: (locale: string) =>
      `/${locale}/admin/settings/country-templates`,
    countryTemplatesDetail: (locale: string, countryCode: string) =>
      `/${locale}/admin/settings/country-templates/${countryCode.toUpperCase()}`,

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
