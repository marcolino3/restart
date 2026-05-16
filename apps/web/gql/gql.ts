/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation ArchiveContactPerson($id: ID!) {\n    archiveContactPerson(id: $id)\n  }\n": typeof types.ArchiveContactPersonDocument,
    "\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createAddress(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateAddressDocument,
    "\n  mutation CreateContactPerson($input: CreateContactPersonInput!) {\n    createContactPerson(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateContactPersonDocument,
    "\n  query GetContactPersonsSharingAddress(\n    $addressId: ID!\n    $excludeContactPersonId: ID!\n  ) {\n    contactPersonsSharingAddress(\n      addressId: $addressId\n      excludeContactPersonId: $excludeContactPersonId\n    ) {\n      id\n      firstName\n      lastName\n      roles\n    }\n  }\n": typeof types.GetContactPersonsSharingAddressDocument,
    "\n  query GetContactPersonById($id: ID!) {\n    contactPersonById(id: $id) {\n      id\n      salutation\n      title\n      firstName\n      middleName\n      lastName\n      email\n      phone\n      mobile\n      dateOfBirth\n      socialSecurityNumber\n      nationalities\n      preferredLanguages\n      roles\n      occupation\n      notes\n      addressId\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n    }\n  }\n": typeof types.GetContactPersonByIdDocument,
    "\n  query GetContactPersons {\n    contactPersonsByOrgId {\n      id\n      firstName\n      lastName\n      email\n      phone\n      mobile\n      occupation\n      isArchived\n    }\n  }\n": typeof types.GetContactPersonsDocument,
    "\n  query GetRelatedAddresses($contactPersonId: ID!) {\n    relatedAddressesForContactPerson(contactPersonId: $contactPersonId) {\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n      contactPersonName\n      relationshipType\n      studentName\n    }\n  }\n": typeof types.GetRelatedAddressesDocument,
    "\n  query GetContactPersonsByStudentId($studentId: ID!) {\n    contactPersonsByStudentId(studentId: $studentId) {\n      id\n      relationshipType\n      isPrimaryContact\n      hasCustody\n      isPickupAuthorized\n      emergencyPriority\n      livesWithStudent\n      notes\n      contactPerson {\n        id\n        firstName\n        lastName\n        email\n        phone\n        mobile\n      }\n    }\n  }\n": typeof types.GetContactPersonsByStudentIdDocument,
    "\n  mutation LinkContactPersonToStudent($input: LinkContactPersonInput!) {\n    linkContactPersonToStudent(input: $input) {\n      id\n    }\n  }\n": typeof types.LinkContactPersonToStudentDocument,
    "\n  mutation UnlinkContactPersonFromStudent($id: ID!) {\n    unlinkContactPersonFromStudent(id: $id)\n  }\n": typeof types.UnlinkContactPersonFromStudentDocument,
    "\n  mutation UpdateAddress($input: UpdateAddressInput!) {\n    updateAddress(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateAddressDocument,
    "\n  mutation UpdateContactPerson($input: UpdateContactPersonInput!) {\n    updateContactPerson(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateContactPersonDocument,
    "\n  mutation UpdateStudentContactPersonLink(\n    $input: UpdateStudentContactPersonInput!\n  ) {\n    updateStudentContactPersonLink(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateStudentContactPersonLinkDocument,
    "\n  mutation ArchiveCurriculumNode($id: ID!) {\n    archiveCurriculumNode(id: $id)\n  }\n": typeof types.ArchiveCurriculumNodeDocument,
    "\n  mutation ArchiveCurriculum($id: ID!) {\n    archiveCurriculum(id: $id)\n  }\n": typeof types.ArchiveCurriculumDocument,
    "\n  mutation CreateCurriculum($input: CreateCurriculumInput!) {\n    createCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.CreateCurriculumDocument,
    "\n  query GetCurricula($includeArchived: Boolean) {\n    curricula(includeArchived: $includeArchived) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.GetCurriculaDocument,
    "\n  query GetCurriculumById($id: ID!) {\n    curriculumById(id: $id) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.GetCurriculumByIdDocument,
    "\n  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {\n    curriculumLevels(\n      curriculumId: $curriculumId\n      includeArchived: $includeArchived\n    ) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": typeof types.GetCurriculumLevelsDocument,
    "\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n": typeof types.GetCurriculumNodesDocument,
    "\n  mutation HardDeleteCurriculum($id: ID!) {\n    hardDeleteCurriculum(id: $id)\n  }\n": typeof types.HardDeleteCurriculumDocument,
    "\n  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {\n    importCurriculumFromPlan(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.ImportCurriculumFromPlanDocument,
    "\n  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {\n    reorderCurriculumNodes(input: $input) {\n      id\n      parentId\n      position\n    }\n  }\n": typeof types.ReorderCurriculumNodesDocument,
    "\n  mutation UnarchiveCurriculumNode($id: ID!) {\n    unarchiveCurriculumNode(id: $id)\n  }\n": typeof types.UnarchiveCurriculumNodeDocument,
    "\n  mutation UnarchiveCurriculum($id: ID!) {\n    unarchiveCurriculum(id: $id) {\n      id\n      isArchived\n    }\n  }\n": typeof types.UnarchiveCurriculumDocument,
    "\n  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {\n    updateCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.UpdateCurriculumDocument,
    "\n  mutation UpsertCurriculumLevelTranslation(\n    $input: UpsertCurriculumLevelTranslationInput!\n  ) {\n    upsertCurriculumLevelTranslation(input: $input) {\n      locale\n      name\n    }\n  }\n": typeof types.UpsertCurriculumLevelTranslationDocument,
    "\n  mutation UpsertCurriculumNodeTranslation(\n    $input: UpsertCurriculumNodeTranslationInput!\n  ) {\n    upsertCurriculumNodeTranslation(input: $input) {\n      locale\n      name\n      notes\n    }\n  }\n": typeof types.UpsertCurriculumNodeTranslationDocument,
    "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeAbsenceNoticeDocument,
    "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n": typeof types.GetEmployeeAbsenceCategoriesByOrgIdDocument,
    "\n  mutation CreateEmployeeNote(\n    $createEmployeeNoteInput: CreateEmployeeNoteInput!\n  ) {\n    createEmployeeNote(createEmployeeNoteInput: $createEmployeeNoteInput) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeNoteDocument,
    "\n  query GetEmployeeNotesByEmployeeId($employeeId: ID!) {\n    employeeNotesByEmployeeId(employeeId: $employeeId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeeNotesByEmployeeIdDocument,
    "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeDocument,
    "\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      isActive\n    }\n  }\n": typeof types.EmployeeContractsByEmployeeIdDocument,
    "\n  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {\n    createEmployeeContract(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeContractDocument,
    "\n  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {\n    updateEmployeeContract(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeeContractDocument,
    "\n  mutation DeleteEmployeeContract($id: ID!) {\n    deleteEmployeeContract(id: $id)\n  }\n": typeof types.DeleteEmployeeContractDocument,
    "\n  query GetEmployeeAuditLog($employeeId: ID!) {\n    employeeAuditLog(employeeId: $employeeId) {\n      id\n      createdAt\n      entityType\n      fieldName\n      oldValue\n      newValue\n      actorMembershipId\n      actorMembership {\n        id\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeeAuditLogDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      timeTrackingEnabled\n      membership {\n        id\n        persona\n        contactPhone\n        user {\n          id\n          title\n          firstName\n          lastName\n          dateOfBirth\n          socialSecurityNumber\n          street\n          houseNumber\n          addressLine2\n          postalCode\n          city\n          country\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        organization {\n          id\n          name\n        }\n        roles {\n          id\n          name\n          systemCode\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeeByIdDocument,
    "\n  query GetEmployeeEmergencyProfile($employeeId: ID!) {\n    employeeEmergencyProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      contact1Name\n      contact1Relationship\n      contact1Phone\n      contact1Email\n      contact2Name\n      contact2Relationship\n      contact2Phone\n      contact2Email\n      bloodType\n      allergies\n      chronicConditions\n      emergencyMedications\n      primaryDoctorName\n      primaryDoctorPhone\n      pharmacyName\n    }\n  }\n": typeof types.GetEmployeeEmergencyProfileDocument,
    "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgProvider\n      bvgInsuranceNumber\n      uvgProvider\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n": typeof types.GetEmployeeHrProfileDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n      }\n    }\n  }\n": typeof types.GetEmployeesDocument,
    "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeeDocument,
    "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeeEmergencyProfileDocument,
    "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeeHrProfileDocument,
    "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.CreateGradeLevelDocument,
    "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n": typeof types.DeleteGradeLevelDocument,
    "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.GetGradeLevelsDocument,
    "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.ReorderGradeLevelsDocument,
    "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.UpdateGradeLevelDocument,
    "\n  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {\n    createOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": typeof types.CreateOrganizationSettingDocument,
    "\n  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {\n    deleteOrganizationSetting(organizationId: $organizationId, key: $key)\n  }\n": typeof types.DeleteOrganizationSettingDocument,
    "\n  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {\n    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      value\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetOrganizationSettingDocument,
    "\n  query GetOrganizationSettings($organizationId: ID!) {\n    organizationSettings(organizationId: $organizationId) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetOrganizationSettingsDocument,
    "\n  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {\n    updateOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": typeof types.UpdateOrganizationSettingDocument,
    "\n  query IsOrganizationDomainAvailable($domain: String!) {\n    isOrganizationDomainAvailable(domain: $domain)\n  }\n": typeof types.IsOrganizationDomainAvailableDocument,
    "\n  query IsOrganizationSubdomainAvailable($subdomain: String!) {\n    isOrganizationSubdomainAvailable(subdomain: $subdomain)\n  }\n": typeof types.IsOrganizationSubdomainAvailableDocument,
    "\n  mutation CreateOrganization {\n    createOrganization {\n      id\n    }\n  }\n": typeof types.CreateOrganizationDocument,
    "\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.OrganizationDocument,
    "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      subdomain\n      domain\n      isActive\n    }\n  }\n": typeof types.GetOrganizationsDocument,
    "\n  mutation RemoveOrganization($id: String!) {\n    removeOrganization(id: $id) {\n      id\n    }\n  }\n": typeof types.RemoveOrganizationDocument,
    "\n  mutation UpdateOrganization(\n    $updateOrganizationInput: UpdateOrganizationInput!\n  ) {\n    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {\n      id\n      name\n      subdomain\n    }\n  }\n": typeof types.UpdateOrganizationDocument,
    "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n": typeof types.GetPermissionsDocument,
    "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n": typeof types.GetRolesByOrgIdDocument,
    "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n": typeof types.UpdateRolePermissionsDocument,
    "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateSchoolClassDocument,
    "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n": typeof types.DeleteSchoolClassDocument,
    "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetSchoolClassByIdDocument,
    "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetSchoolClassesDocument,
    "\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateSchoolClassDocument,
    "\n  mutation CreateEnrollment($input: CreateSchoolClassEnrollmentInput!) {\n    createEnrollment(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEnrollmentDocument,
    "\n  mutation CreateStudent($input: CreateStudentInput!) {\n    createStudent(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateStudentDocument,
    "\n  mutation DeleteStudent($id: ID!) {\n    deleteStudent(id: $id)\n  }\n": typeof types.DeleteStudentDocument,
    "\n  query GetStudentById($id: ID!) {\n    studentById(id: $id) {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      notes\n      isActive\n    }\n  }\n": typeof types.GetStudentByIdDocument,
    "\n  query GetEnrollmentsByStudentId($studentId: ID!) {\n    enrollmentsByStudentId(studentId: $studentId) {\n      id\n      enrolledAt\n      leftAt\n      schoolClass {\n        id\n        name\n        gradeLevels {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetEnrollmentsByStudentIdDocument,
    "\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      isActive\n    }\n  }\n": typeof types.GetStudentsDocument,
    "\n  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {\n    updateEnrollment(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEnrollmentDocument,
    "\n  mutation UpdateStudent($input: UpdateStudentInput!) {\n    updateStudent(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateStudentDocument,
    "\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n    }\n  }\n": typeof types.AddTeamMemberDocument,
    "\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.CreateTeamDocument,
    "\n  mutation DeleteTeam($id: ID!) {\n    deleteTeam(id: $id)\n  }\n": typeof types.DeleteTeamDocument,
    "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.GetTeamByIdDocument,
    "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetTeamMembersDocument,
    "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.GetTeamsDocument,
    "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n": typeof types.RemoveTeamMemberDocument,
    "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.ReorderTeamsDocument,
    "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.UpdateTeamDocument,
    "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n": typeof types.AddUserEmailDocument,
    "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n": typeof types.GetAuthContextDocument,
    "\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n": typeof types.RolesByOrganizationIdDocument,
    "\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetUserByIdDocument,
    "\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetUsersDocument,
    "\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n": typeof types.RemoveUserEmailDocument,
    "\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n": typeof types.SetPrimaryUserEmailDocument,
    "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n": typeof types.UpdateUserDocument,
};
const documents: Documents = {
    "\n  mutation ArchiveContactPerson($id: ID!) {\n    archiveContactPerson(id: $id)\n  }\n": types.ArchiveContactPersonDocument,
    "\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createAddress(input: $input) {\n      id\n    }\n  }\n": types.CreateAddressDocument,
    "\n  mutation CreateContactPerson($input: CreateContactPersonInput!) {\n    createContactPerson(input: $input) {\n      id\n    }\n  }\n": types.CreateContactPersonDocument,
    "\n  query GetContactPersonsSharingAddress(\n    $addressId: ID!\n    $excludeContactPersonId: ID!\n  ) {\n    contactPersonsSharingAddress(\n      addressId: $addressId\n      excludeContactPersonId: $excludeContactPersonId\n    ) {\n      id\n      firstName\n      lastName\n      roles\n    }\n  }\n": types.GetContactPersonsSharingAddressDocument,
    "\n  query GetContactPersonById($id: ID!) {\n    contactPersonById(id: $id) {\n      id\n      salutation\n      title\n      firstName\n      middleName\n      lastName\n      email\n      phone\n      mobile\n      dateOfBirth\n      socialSecurityNumber\n      nationalities\n      preferredLanguages\n      roles\n      occupation\n      notes\n      addressId\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n    }\n  }\n": types.GetContactPersonByIdDocument,
    "\n  query GetContactPersons {\n    contactPersonsByOrgId {\n      id\n      firstName\n      lastName\n      email\n      phone\n      mobile\n      occupation\n      isArchived\n    }\n  }\n": types.GetContactPersonsDocument,
    "\n  query GetRelatedAddresses($contactPersonId: ID!) {\n    relatedAddressesForContactPerson(contactPersonId: $contactPersonId) {\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n      contactPersonName\n      relationshipType\n      studentName\n    }\n  }\n": types.GetRelatedAddressesDocument,
    "\n  query GetContactPersonsByStudentId($studentId: ID!) {\n    contactPersonsByStudentId(studentId: $studentId) {\n      id\n      relationshipType\n      isPrimaryContact\n      hasCustody\n      isPickupAuthorized\n      emergencyPriority\n      livesWithStudent\n      notes\n      contactPerson {\n        id\n        firstName\n        lastName\n        email\n        phone\n        mobile\n      }\n    }\n  }\n": types.GetContactPersonsByStudentIdDocument,
    "\n  mutation LinkContactPersonToStudent($input: LinkContactPersonInput!) {\n    linkContactPersonToStudent(input: $input) {\n      id\n    }\n  }\n": types.LinkContactPersonToStudentDocument,
    "\n  mutation UnlinkContactPersonFromStudent($id: ID!) {\n    unlinkContactPersonFromStudent(id: $id)\n  }\n": types.UnlinkContactPersonFromStudentDocument,
    "\n  mutation UpdateAddress($input: UpdateAddressInput!) {\n    updateAddress(input: $input) {\n      id\n    }\n  }\n": types.UpdateAddressDocument,
    "\n  mutation UpdateContactPerson($input: UpdateContactPersonInput!) {\n    updateContactPerson(input: $input) {\n      id\n    }\n  }\n": types.UpdateContactPersonDocument,
    "\n  mutation UpdateStudentContactPersonLink(\n    $input: UpdateStudentContactPersonInput!\n  ) {\n    updateStudentContactPersonLink(input: $input) {\n      id\n    }\n  }\n": types.UpdateStudentContactPersonLinkDocument,
    "\n  mutation ArchiveCurriculumNode($id: ID!) {\n    archiveCurriculumNode(id: $id)\n  }\n": types.ArchiveCurriculumNodeDocument,
    "\n  mutation ArchiveCurriculum($id: ID!) {\n    archiveCurriculum(id: $id)\n  }\n": types.ArchiveCurriculumDocument,
    "\n  mutation CreateCurriculum($input: CreateCurriculumInput!) {\n    createCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.CreateCurriculumDocument,
    "\n  query GetCurricula($includeArchived: Boolean) {\n    curricula(includeArchived: $includeArchived) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.GetCurriculaDocument,
    "\n  query GetCurriculumById($id: ID!) {\n    curriculumById(id: $id) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.GetCurriculumByIdDocument,
    "\n  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {\n    curriculumLevels(\n      curriculumId: $curriculumId\n      includeArchived: $includeArchived\n    ) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": types.GetCurriculumLevelsDocument,
    "\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n": types.GetCurriculumNodesDocument,
    "\n  mutation HardDeleteCurriculum($id: ID!) {\n    hardDeleteCurriculum(id: $id)\n  }\n": types.HardDeleteCurriculumDocument,
    "\n  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {\n    importCurriculumFromPlan(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.ImportCurriculumFromPlanDocument,
    "\n  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {\n    reorderCurriculumNodes(input: $input) {\n      id\n      parentId\n      position\n    }\n  }\n": types.ReorderCurriculumNodesDocument,
    "\n  mutation UnarchiveCurriculumNode($id: ID!) {\n    unarchiveCurriculumNode(id: $id)\n  }\n": types.UnarchiveCurriculumNodeDocument,
    "\n  mutation UnarchiveCurriculum($id: ID!) {\n    unarchiveCurriculum(id: $id) {\n      id\n      isArchived\n    }\n  }\n": types.UnarchiveCurriculumDocument,
    "\n  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {\n    updateCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.UpdateCurriculumDocument,
    "\n  mutation UpsertCurriculumLevelTranslation(\n    $input: UpsertCurriculumLevelTranslationInput!\n  ) {\n    upsertCurriculumLevelTranslation(input: $input) {\n      locale\n      name\n    }\n  }\n": types.UpsertCurriculumLevelTranslationDocument,
    "\n  mutation UpsertCurriculumNodeTranslation(\n    $input: UpsertCurriculumNodeTranslationInput!\n  ) {\n    upsertCurriculumNodeTranslation(input: $input) {\n      locale\n      name\n      notes\n    }\n  }\n": types.UpsertCurriculumNodeTranslationDocument,
    "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n": types.CreateEmployeeAbsenceNoticeDocument,
    "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n": types.GetEmployeeAbsenceCategoriesByOrgIdDocument,
    "\n  mutation CreateEmployeeNote(\n    $createEmployeeNoteInput: CreateEmployeeNoteInput!\n  ) {\n    createEmployeeNote(createEmployeeNoteInput: $createEmployeeNoteInput) {\n      id\n    }\n  }\n": types.CreateEmployeeNoteDocument,
    "\n  query GetEmployeeNotesByEmployeeId($employeeId: ID!) {\n    employeeNotesByEmployeeId(employeeId: $employeeId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.GetEmployeeNotesByEmployeeIdDocument,
    "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n": types.CreateEmployeeDocument,
    "\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      isActive\n    }\n  }\n": types.EmployeeContractsByEmployeeIdDocument,
    "\n  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {\n    createEmployeeContract(input: $input) {\n      id\n    }\n  }\n": types.CreateEmployeeContractDocument,
    "\n  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {\n    updateEmployeeContract(input: $input) {\n      id\n    }\n  }\n": types.UpdateEmployeeContractDocument,
    "\n  mutation DeleteEmployeeContract($id: ID!) {\n    deleteEmployeeContract(id: $id)\n  }\n": types.DeleteEmployeeContractDocument,
    "\n  query GetEmployeeAuditLog($employeeId: ID!) {\n    employeeAuditLog(employeeId: $employeeId) {\n      id\n      createdAt\n      entityType\n      fieldName\n      oldValue\n      newValue\n      actorMembershipId\n      actorMembership {\n        id\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.GetEmployeeAuditLogDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      timeTrackingEnabled\n      membership {\n        id\n        persona\n        contactPhone\n        user {\n          id\n          title\n          firstName\n          lastName\n          dateOfBirth\n          socialSecurityNumber\n          street\n          houseNumber\n          addressLine2\n          postalCode\n          city\n          country\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        organization {\n          id\n          name\n        }\n        roles {\n          id\n          name\n          systemCode\n        }\n      }\n    }\n  }\n": types.GetEmployeeByIdDocument,
    "\n  query GetEmployeeEmergencyProfile($employeeId: ID!) {\n    employeeEmergencyProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      contact1Name\n      contact1Relationship\n      contact1Phone\n      contact1Email\n      contact2Name\n      contact2Relationship\n      contact2Phone\n      contact2Email\n      bloodType\n      allergies\n      chronicConditions\n      emergencyMedications\n      primaryDoctorName\n      primaryDoctorPhone\n      pharmacyName\n    }\n  }\n": types.GetEmployeeEmergencyProfileDocument,
    "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgProvider\n      bvgInsuranceNumber\n      uvgProvider\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n": types.GetEmployeeHrProfileDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n      }\n    }\n  }\n": types.GetEmployeesDocument,
    "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n": types.UpdateEmployeeDocument,
    "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeeEmergencyProfileDocument,
    "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeeHrProfileDocument,
    "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.CreateGradeLevelDocument,
    "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n": types.DeleteGradeLevelDocument,
    "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.GetGradeLevelsDocument,
    "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.ReorderGradeLevelsDocument,
    "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.UpdateGradeLevelDocument,
    "\n  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {\n    createOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": types.CreateOrganizationSettingDocument,
    "\n  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {\n    deleteOrganizationSetting(organizationId: $organizationId, key: $key)\n  }\n": types.DeleteOrganizationSettingDocument,
    "\n  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {\n    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      value\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetOrganizationSettingDocument,
    "\n  query GetOrganizationSettings($organizationId: ID!) {\n    organizationSettings(organizationId: $organizationId) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetOrganizationSettingsDocument,
    "\n  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {\n    updateOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": types.UpdateOrganizationSettingDocument,
    "\n  query IsOrganizationDomainAvailable($domain: String!) {\n    isOrganizationDomainAvailable(domain: $domain)\n  }\n": types.IsOrganizationDomainAvailableDocument,
    "\n  query IsOrganizationSubdomainAvailable($subdomain: String!) {\n    isOrganizationSubdomainAvailable(subdomain: $subdomain)\n  }\n": types.IsOrganizationSubdomainAvailableDocument,
    "\n  mutation CreateOrganization {\n    createOrganization {\n      id\n    }\n  }\n": types.CreateOrganizationDocument,
    "\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n": types.OrganizationDocument,
    "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      subdomain\n      domain\n      isActive\n    }\n  }\n": types.GetOrganizationsDocument,
    "\n  mutation RemoveOrganization($id: String!) {\n    removeOrganization(id: $id) {\n      id\n    }\n  }\n": types.RemoveOrganizationDocument,
    "\n  mutation UpdateOrganization(\n    $updateOrganizationInput: UpdateOrganizationInput!\n  ) {\n    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {\n      id\n      name\n      subdomain\n    }\n  }\n": types.UpdateOrganizationDocument,
    "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n": types.GetPermissionsDocument,
    "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n": types.GetRolesByOrgIdDocument,
    "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n": types.UpdateRolePermissionsDocument,
    "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n": types.CreateSchoolClassDocument,
    "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n": types.DeleteSchoolClassDocument,
    "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetSchoolClassByIdDocument,
    "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetSchoolClassesDocument,
    "\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n": types.UpdateSchoolClassDocument,
    "\n  mutation CreateEnrollment($input: CreateSchoolClassEnrollmentInput!) {\n    createEnrollment(input: $input) {\n      id\n    }\n  }\n": types.CreateEnrollmentDocument,
    "\n  mutation CreateStudent($input: CreateStudentInput!) {\n    createStudent(input: $input) {\n      id\n    }\n  }\n": types.CreateStudentDocument,
    "\n  mutation DeleteStudent($id: ID!) {\n    deleteStudent(id: $id)\n  }\n": types.DeleteStudentDocument,
    "\n  query GetStudentById($id: ID!) {\n    studentById(id: $id) {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      notes\n      isActive\n    }\n  }\n": types.GetStudentByIdDocument,
    "\n  query GetEnrollmentsByStudentId($studentId: ID!) {\n    enrollmentsByStudentId(studentId: $studentId) {\n      id\n      enrolledAt\n      leftAt\n      schoolClass {\n        id\n        name\n        gradeLevels {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetEnrollmentsByStudentIdDocument,
    "\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      isActive\n    }\n  }\n": types.GetStudentsDocument,
    "\n  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {\n    updateEnrollment(input: $input) {\n      id\n    }\n  }\n": types.UpdateEnrollmentDocument,
    "\n  mutation UpdateStudent($input: UpdateStudentInput!) {\n    updateStudent(input: $input) {\n      id\n    }\n  }\n": types.UpdateStudentDocument,
    "\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n    }\n  }\n": types.AddTeamMemberDocument,
    "\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.CreateTeamDocument,
    "\n  mutation DeleteTeam($id: ID!) {\n    deleteTeam(id: $id)\n  }\n": types.DeleteTeamDocument,
    "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n": types.GetTeamByIdDocument,
    "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetTeamMembersDocument,
    "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.GetTeamsDocument,
    "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n": types.RemoveTeamMemberDocument,
    "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.ReorderTeamsDocument,
    "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n": types.UpdateTeamDocument,
    "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n": types.AddUserEmailDocument,
    "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n": types.CreateUserDocument,
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n": types.GetAuthContextDocument,
    "\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n": types.RolesByOrganizationIdDocument,
    "\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetUserByIdDocument,
    "\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetUsersDocument,
    "\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n": types.RemoveUserEmailDocument,
    "\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n": types.SetPrimaryUserEmailDocument,
    "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n": types.UpdateUserDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveContactPerson($id: ID!) {\n    archiveContactPerson(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveContactPerson($id: ID!) {\n    archiveContactPerson(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createAddress(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createAddress(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateContactPerson($input: CreateContactPersonInput!) {\n    createContactPerson(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContactPerson($input: CreateContactPersonInput!) {\n    createContactPerson(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetContactPersonsSharingAddress(\n    $addressId: ID!\n    $excludeContactPersonId: ID!\n  ) {\n    contactPersonsSharingAddress(\n      addressId: $addressId\n      excludeContactPersonId: $excludeContactPersonId\n    ) {\n      id\n      firstName\n      lastName\n      roles\n    }\n  }\n"): (typeof documents)["\n  query GetContactPersonsSharingAddress(\n    $addressId: ID!\n    $excludeContactPersonId: ID!\n  ) {\n    contactPersonsSharingAddress(\n      addressId: $addressId\n      excludeContactPersonId: $excludeContactPersonId\n    ) {\n      id\n      firstName\n      lastName\n      roles\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetContactPersonById($id: ID!) {\n    contactPersonById(id: $id) {\n      id\n      salutation\n      title\n      firstName\n      middleName\n      lastName\n      email\n      phone\n      mobile\n      dateOfBirth\n      socialSecurityNumber\n      nationalities\n      preferredLanguages\n      roles\n      occupation\n      notes\n      addressId\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetContactPersonById($id: ID!) {\n    contactPersonById(id: $id) {\n      id\n      salutation\n      title\n      firstName\n      middleName\n      lastName\n      email\n      phone\n      mobile\n      dateOfBirth\n      socialSecurityNumber\n      nationalities\n      preferredLanguages\n      roles\n      occupation\n      notes\n      addressId\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetContactPersons {\n    contactPersonsByOrgId {\n      id\n      firstName\n      lastName\n      email\n      phone\n      mobile\n      occupation\n      isArchived\n    }\n  }\n"): (typeof documents)["\n  query GetContactPersons {\n    contactPersonsByOrgId {\n      id\n      firstName\n      lastName\n      email\n      phone\n      mobile\n      occupation\n      isArchived\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRelatedAddresses($contactPersonId: ID!) {\n    relatedAddressesForContactPerson(contactPersonId: $contactPersonId) {\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n      contactPersonName\n      relationshipType\n      studentName\n    }\n  }\n"): (typeof documents)["\n  query GetRelatedAddresses($contactPersonId: ID!) {\n    relatedAddressesForContactPerson(contactPersonId: $contactPersonId) {\n      address {\n        id\n        street\n        houseNumber\n        addressLine2\n        postalCode\n        city\n        state\n        country {\n          id\n          isoCode\n        }\n      }\n      contactPersonName\n      relationshipType\n      studentName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetContactPersonsByStudentId($studentId: ID!) {\n    contactPersonsByStudentId(studentId: $studentId) {\n      id\n      relationshipType\n      isPrimaryContact\n      hasCustody\n      isPickupAuthorized\n      emergencyPriority\n      livesWithStudent\n      notes\n      contactPerson {\n        id\n        firstName\n        lastName\n        email\n        phone\n        mobile\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetContactPersonsByStudentId($studentId: ID!) {\n    contactPersonsByStudentId(studentId: $studentId) {\n      id\n      relationshipType\n      isPrimaryContact\n      hasCustody\n      isPickupAuthorized\n      emergencyPriority\n      livesWithStudent\n      notes\n      contactPerson {\n        id\n        firstName\n        lastName\n        email\n        phone\n        mobile\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LinkContactPersonToStudent($input: LinkContactPersonInput!) {\n    linkContactPersonToStudent(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation LinkContactPersonToStudent($input: LinkContactPersonInput!) {\n    linkContactPersonToStudent(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnlinkContactPersonFromStudent($id: ID!) {\n    unlinkContactPersonFromStudent(id: $id)\n  }\n"): (typeof documents)["\n  mutation UnlinkContactPersonFromStudent($id: ID!) {\n    unlinkContactPersonFromStudent(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAddress($input: UpdateAddressInput!) {\n    updateAddress(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAddress($input: UpdateAddressInput!) {\n    updateAddress(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateContactPerson($input: UpdateContactPersonInput!) {\n    updateContactPerson(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateContactPerson($input: UpdateContactPersonInput!) {\n    updateContactPerson(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateStudentContactPersonLink(\n    $input: UpdateStudentContactPersonInput!\n  ) {\n    updateStudentContactPersonLink(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateStudentContactPersonLink(\n    $input: UpdateStudentContactPersonInput!\n  ) {\n    updateStudentContactPersonLink(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveCurriculumNode($id: ID!) {\n    archiveCurriculumNode(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveCurriculumNode($id: ID!) {\n    archiveCurriculumNode(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveCurriculum($id: ID!) {\n    archiveCurriculum(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveCurriculum($id: ID!) {\n    archiveCurriculum(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCurriculum($input: CreateCurriculumInput!) {\n    createCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCurriculum($input: CreateCurriculumInput!) {\n    createCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurricula($includeArchived: Boolean) {\n    curricula(includeArchived: $includeArchived) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurricula($includeArchived: Boolean) {\n    curricula(includeArchived: $includeArchived) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurriculumById($id: ID!) {\n    curriculumById(id: $id) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurriculumById($id: ID!) {\n    curriculumById(id: $id) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {\n    curriculumLevels(\n      curriculumId: $curriculumId\n      includeArchived: $includeArchived\n    ) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {\n    curriculumLevels(\n      curriculumId: $curriculumId\n      includeArchived: $includeArchived\n    ) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation HardDeleteCurriculum($id: ID!) {\n    hardDeleteCurriculum(id: $id)\n  }\n"): (typeof documents)["\n  mutation HardDeleteCurriculum($id: ID!) {\n    hardDeleteCurriculum(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {\n    importCurriculumFromPlan(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {\n    importCurriculumFromPlan(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {\n    reorderCurriculumNodes(input: $input) {\n      id\n      parentId\n      position\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {\n    reorderCurriculumNodes(input: $input) {\n      id\n      parentId\n      position\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnarchiveCurriculumNode($id: ID!) {\n    unarchiveCurriculumNode(id: $id)\n  }\n"): (typeof documents)["\n  mutation UnarchiveCurriculumNode($id: ID!) {\n    unarchiveCurriculumNode(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnarchiveCurriculum($id: ID!) {\n    unarchiveCurriculum(id: $id) {\n      id\n      isArchived\n    }\n  }\n"): (typeof documents)["\n  mutation UnarchiveCurriculum($id: ID!) {\n    unarchiveCurriculum(id: $id) {\n      id\n      isArchived\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {\n    updateCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {\n    updateCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertCurriculumLevelTranslation(\n    $input: UpsertCurriculumLevelTranslationInput!\n  ) {\n    upsertCurriculumLevelTranslation(input: $input) {\n      locale\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertCurriculumLevelTranslation(\n    $input: UpsertCurriculumLevelTranslationInput!\n  ) {\n    upsertCurriculumLevelTranslation(input: $input) {\n      locale\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertCurriculumNodeTranslation(\n    $input: UpsertCurriculumNodeTranslationInput!\n  ) {\n    upsertCurriculumNodeTranslation(input: $input) {\n      locale\n      name\n      notes\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertCurriculumNodeTranslation(\n    $input: UpsertCurriculumNodeTranslationInput!\n  ) {\n    upsertCurriculumNodeTranslation(input: $input) {\n      locale\n      name\n      notes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployeeNote(\n    $createEmployeeNoteInput: CreateEmployeeNoteInput!\n  ) {\n    createEmployeeNote(createEmployeeNoteInput: $createEmployeeNoteInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployeeNote(\n    $createEmployeeNoteInput: CreateEmployeeNoteInput!\n  ) {\n    createEmployeeNote(createEmployeeNoteInput: $createEmployeeNoteInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeNotesByEmployeeId($employeeId: ID!) {\n    employeeNotesByEmployeeId(employeeId: $employeeId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeNotesByEmployeeId($employeeId: ID!) {\n    employeeNotesByEmployeeId(employeeId: $employeeId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {\n    createEmployeeContract(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {\n    createEmployeeContract(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {\n    updateEmployeeContract(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {\n    updateEmployeeContract(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmployeeContract($id: ID!) {\n    deleteEmployeeContract(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmployeeContract($id: ID!) {\n    deleteEmployeeContract(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeAuditLog($employeeId: ID!) {\n    employeeAuditLog(employeeId: $employeeId) {\n      id\n      createdAt\n      entityType\n      fieldName\n      oldValue\n      newValue\n      actorMembershipId\n      actorMembership {\n        id\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeAuditLog($employeeId: ID!) {\n    employeeAuditLog(employeeId: $employeeId) {\n      id\n      createdAt\n      entityType\n      fieldName\n      oldValue\n      newValue\n      actorMembershipId\n      actorMembership {\n        id\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      timeTrackingEnabled\n      membership {\n        id\n        persona\n        contactPhone\n        user {\n          id\n          title\n          firstName\n          lastName\n          dateOfBirth\n          socialSecurityNumber\n          street\n          houseNumber\n          addressLine2\n          postalCode\n          city\n          country\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        organization {\n          id\n          name\n        }\n        roles {\n          id\n          name\n          systemCode\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      timeTrackingEnabled\n      membership {\n        id\n        persona\n        contactPhone\n        user {\n          id\n          title\n          firstName\n          lastName\n          dateOfBirth\n          socialSecurityNumber\n          street\n          houseNumber\n          addressLine2\n          postalCode\n          city\n          country\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        organization {\n          id\n          name\n        }\n        roles {\n          id\n          name\n          systemCode\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeEmergencyProfile($employeeId: ID!) {\n    employeeEmergencyProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      contact1Name\n      contact1Relationship\n      contact1Phone\n      contact1Email\n      contact2Name\n      contact2Relationship\n      contact2Phone\n      contact2Email\n      bloodType\n      allergies\n      chronicConditions\n      emergencyMedications\n      primaryDoctorName\n      primaryDoctorPhone\n      pharmacyName\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeEmergencyProfile($employeeId: ID!) {\n    employeeEmergencyProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      contact1Name\n      contact1Relationship\n      contact1Phone\n      contact1Email\n      contact2Name\n      contact2Relationship\n      contact2Phone\n      contact2Email\n      bloodType\n      allergies\n      chronicConditions\n      emergencyMedications\n      primaryDoctorName\n      primaryDoctorPhone\n      pharmacyName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgProvider\n      bvgInsuranceNumber\n      uvgProvider\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgProvider\n      bvgInsuranceNumber\n      uvgProvider\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {\n    createOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {\n    createOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {\n    deleteOrganizationSetting(organizationId: $organizationId, key: $key)\n  }\n"): (typeof documents)["\n  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {\n    deleteOrganizationSetting(organizationId: $organizationId, key: $key)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {\n    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      value\n      version\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {\n    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      value\n      version\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrganizationSettings($organizationId: ID!) {\n    organizationSettings(organizationId: $organizationId) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      version\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetOrganizationSettings($organizationId: ID!) {\n    organizationSettings(organizationId: $organizationId) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      version\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {\n    updateOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {\n    updateOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IsOrganizationDomainAvailable($domain: String!) {\n    isOrganizationDomainAvailable(domain: $domain)\n  }\n"): (typeof documents)["\n  query IsOrganizationDomainAvailable($domain: String!) {\n    isOrganizationDomainAvailable(domain: $domain)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IsOrganizationSubdomainAvailable($subdomain: String!) {\n    isOrganizationSubdomainAvailable(subdomain: $subdomain)\n  }\n"): (typeof documents)["\n  query IsOrganizationSubdomainAvailable($subdomain: String!) {\n    isOrganizationSubdomainAvailable(subdomain: $subdomain)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOrganization {\n    createOrganization {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOrganization {\n    createOrganization {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      subdomain\n      domain\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      subdomain\n      domain\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveOrganization($id: String!) {\n    removeOrganization(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveOrganization($id: String!) {\n    removeOrganization(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOrganization(\n    $updateOrganizationInput: UpdateOrganizationInput!\n  ) {\n    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {\n      id\n      name\n      subdomain\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateOrganization(\n    $updateOrganizationInput: UpdateOrganizationInput!\n  ) {\n    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {\n      id\n      name\n      subdomain\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n"): (typeof documents)["\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEnrollment($input: CreateSchoolClassEnrollmentInput!) {\n    createEnrollment(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEnrollment($input: CreateSchoolClassEnrollmentInput!) {\n    createEnrollment(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateStudent($input: CreateStudentInput!) {\n    createStudent(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateStudent($input: CreateStudentInput!) {\n    createStudent(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteStudent($id: ID!) {\n    deleteStudent(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteStudent($id: ID!) {\n    deleteStudent(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetStudentById($id: ID!) {\n    studentById(id: $id) {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      notes\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetStudentById($id: ID!) {\n    studentById(id: $id) {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      notes\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEnrollmentsByStudentId($studentId: ID!) {\n    enrollmentsByStudentId(studentId: $studentId) {\n      id\n      enrolledAt\n      leftAt\n      schoolClass {\n        id\n        name\n        gradeLevels {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEnrollmentsByStudentId($studentId: ID!) {\n    enrollmentsByStudentId(studentId: $studentId) {\n      id\n      enrolledAt\n      leftAt\n      schoolClass {\n        id\n        name\n        gradeLevels {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {\n    updateEnrollment(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {\n    updateEnrollment(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateStudent($input: UpdateStudentInput!) {\n    updateStudent(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateStudent($input: UpdateStudentInput!) {\n    updateStudent(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTeam($id: ID!) {\n    deleteTeam(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTeam($id: ID!) {\n    deleteTeam(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n"): (typeof documents)["\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n"): (typeof documents)["\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n"): (typeof documents)["\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n"): (typeof documents)["\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n"): (typeof documents)["\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;