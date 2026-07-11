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

    // Time Tracking Report + Settings (Admin/HR/Teamleiter)
    timeTrackingReport: (locale: string) =>
      `/${locale}/admin/time-tracking-report`,
    timeTrackingReportEmployee: (locale: string, id: string) =>
      `/${locale}/admin/time-tracking-report/${id}`,
    timeTrackingSettings: (locale: string) =>
      `/${locale}/admin/time-tracking-settings`,

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
    teamsDetail: (locale: string, id: string) => `/${locale}/admin/teams/${id}`,

    // Projects (project management / boards)
    projects: (locale: string) => `/${locale}/admin/projects`,
    projectsBoard: (locale: string, id: string) =>
      `/${locale}/admin/projects/${id}`,
    projectTemplates: (locale: string) => `/${locale}/admin/projects/templates`,
    myTasks: (locale: string) => `/${locale}/admin/my-tasks`,

    // Chats
    chats: (locale: string) => `/${locale}/admin/chats`,
    chat: (locale: string, id: string) => `/${locale}/admin/chats/${id}`,

    // Meeting protocols
    protocols: (locale: string) => `/${locale}/admin/protocols`,
    protocolEditor: (locale: string, id: string) =>
      `/${locale}/admin/protocols/${id}`,

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
    recordKeepingHeatmap: (locale: string) =>
      `/${locale}/admin/record-keeping/heatmap`,
    recordKeepingAttention: (locale: string) =>
      `/${locale}/admin/record-keeping/attention`,
    recordKeepingStudents: (locale: string) =>
      `/${locale}/admin/record-keeping/students`,
    recordKeepingStudent: (locale: string, studentId: string) =>
      `/${locale}/admin/record-keeping/students/${studentId}`,

    // Admission Stages
    admissionStages: (locale: string) =>
      `/${locale}/admin/settings/admission-stages`,

    // Admissions Kanban
    admissions: (locale: string) => `/${locale}/admin/admissions`,
    admissionsKanban: (locale: string) => `/${locale}/admin/admissions/kanban`,
    admissionsReminders: (locale: string) =>
      `/${locale}/admin/admissions/reminders`,
    admissionsRejected: (locale: string) =>
      `/${locale}/admin/admissions/rejected`,
    admissionsEmailTemplates: (locale: string) =>
      `/${locale}/admin/admissions/email-templates`,

    // Absence Categories (HR)
    absenceCategories: (locale: string) =>
      `/${locale}/admin/absence-categories`,
    absenceCategoriesCreate: (locale: string) =>
      `/${locale}/admin/absence-categories/edit`,
    absenceCategoriesEdit: (locale: string, id: string) =>
      `/${locale}/admin/absence-categories/edit/${id}`,

    // Country Input Templates
    countryTemplates: (locale: string) =>
      `/${locale}/admin/settings/country-templates`,
    countryTemplatesDetail: (locale: string, countryCode: string) =>
      `/${locale}/admin/settings/country-templates/${countryCode.toUpperCase()}`,

    // Roles
    roles: (locale: string) => `/${locale}/admin/roles`,

    // Data protection center (DSGVO / revDSG)
    dataProtection: (locale: string) => `/${locale}/admin/data-protection`,

    // Forbidden landing for persona-blocked admin routes
    dashboard: (locale: string) => `/${locale}/admin`,
    forbidden: (locale: string) => `/${locale}/admin/forbidden`,

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
