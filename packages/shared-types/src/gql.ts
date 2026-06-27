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
    "\n  mutation ArchiveAdmissionApplication($id: ID!) {\n    archiveAdmissionApplication(id: $id)\n  }\n": typeof types.ArchiveAdmissionApplicationDocument,
    "\n  mutation RejectAdmissionApplication(\n    $input: RejectAdmissionApplicationInput!\n  ) {\n    rejectAdmissionApplication(input: $input) {\n      id\n      status\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n    }\n  }\n": typeof types.RejectAdmissionApplicationDocument,
    "\n  mutation DeleteAdmissionApplication($id: ID!) {\n    deleteAdmissionApplication(id: $id)\n  }\n": typeof types.DeleteAdmissionApplicationDocument,
    "\n  mutation RestoreAdmissionApplication($id: ID!) {\n    restoreAdmissionApplication(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.RestoreAdmissionApplicationDocument,
    "\n  mutation UpdateAdmissionBoardSettings(\n    $input: UpdateAdmissionBoardSettingsInput!\n  ) {\n    updateAdmissionBoardSettings(input: $input) {\n      tableColumns\n    }\n  }\n": typeof types.UpdateAdmissionBoardSettingsDocument,
    "\n  mutation CreateAdmissionActivity($input: CreateAdmissionActivityInput!) {\n    createAdmissionActivity(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateAdmissionActivityDocument,
    "\n  mutation CreateAdmissionApplication(\n    $input: CreateAdmissionApplicationInput!\n  ) {\n    createAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      familyId\n    }\n  }\n": typeof types.CreateAdmissionApplicationDocument,
    "\n  mutation DeleteAdmissionActivity($id: ID!) {\n    deleteAdmissionActivity(id: $id)\n  }\n": typeof types.DeleteAdmissionActivityDocument,
    "\n  mutation FinalizeAdmissionEnrollment($input: FinalizeEnrollmentInput!) {\n    finalizeAdmissionEnrollment(input: $input) {\n      application {\n        id\n        status\n        enrolledStudentId\n      }\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": typeof types.FinalizeAdmissionEnrollmentDocument,
    "\n  query AdmissionActivities($applicationId: ID!) {\n    admissionActivities(applicationId: $applicationId) {\n      id\n      applicationId\n      type\n      occurredAt\n      subject\n      body\n      direction\n      durationMinutes\n      location\n      createdAt\n      updatedAt\n      createdByMembershipId\n      createdByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.AdmissionActivitiesDocument,
    "\n  query AdmissionEmails($applicationId: ID!) {\n    admissionEmails(applicationId: $applicationId) {\n      id\n      toEmail\n      toName\n      subject\n      bodyHtml\n      status\n      errorMessage\n      sentAt\n      template {\n        id\n        name\n      }\n      sentByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.AdmissionEmailsDocument,
    "\n  query AdmissionReminders($applicationId: ID!) {\n    admissionReminders(applicationId: $applicationId) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      assignedToMembershipId\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n      completedAt\n      createdAt\n    }\n  }\n": typeof types.AdmissionRemindersDocument,
    "\n  query AdmissionsKanbanReminders {\n    orgAdmissionReminders(filter: OPEN) {\n      id\n      applicationId\n      dueAt\n    }\n  }\n": typeof types.AdmissionsKanbanRemindersDocument,
    "\n  query AdmissionsKanbanStages {\n    admissionStages {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      isArchived\n      cardFields\n    }\n  }\n": typeof types.AdmissionsKanbanStagesDocument,
    "\n  query AdmissionsBoardSettings {\n    admissionBoardSettings {\n      tableColumns\n    }\n  }\n": typeof types.AdmissionsBoardSettingsDocument,
    "\n  query AdmissionsKanbanRejectionReasons {\n    admissionRejectionReasons {\n      id\n      label\n      color\n      position\n    }\n  }\n": typeof types.AdmissionsKanbanRejectionReasonsDocument,
    "\n  query AdmissionsKanbanApplications {\n    admissionApplications {\n      id\n      admissionStageId\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      status\n      source\n      stageEnteredAt\n      familyId\n      enrolledStudentId\n      desiredGradeLevelId\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n      family {\n        id\n        name\n        contactPersons {\n          id\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n        }\n      }\n    }\n  }\n": typeof types.AdmissionsKanbanApplicationsDocument,
    "\n  query AdmissionApplicationDetail($id: ID!) {\n    admissionApplicationById(id: $id) {\n      id\n      organizationId\n      admissionStageId\n      status\n      source\n      stageEnteredAt\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      childNotes\n      desiredGradeLevelId\n      desiredSchoolClassId\n      desiredEnrollmentDate\n      enrolledStudentId\n      familyId\n      family {\n        id\n        name\n        notes\n        contactPersons {\n          id\n          salutation\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n          occupation\n        }\n      }\n      admissionStage {\n        id\n        name\n        stageType\n      }\n      desiredSchoolClass {\n        id\n        name\n      }\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n    }\n    admissionAuditLogs(applicationId: $id) {\n      id\n      action\n      createdAt\n      fieldName\n      oldValue\n      newValue\n      fromStage {\n        id\n        name\n      }\n      toStage {\n        id\n        name\n      }\n      actorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n    admissionApplicationsByFamily(\n      familyId: \"00000000-0000-0000-0000-000000000000\"\n    ) @skip(if: true) {\n      id\n    }\n  }\n": typeof types.AdmissionApplicationDetailDocument,
    "\n  query AdmissionApplicationSiblings($familyId: ID!) {\n    admissionApplicationsByFamily(familyId: $familyId) {\n      id\n      childFirstName\n      childLastName\n      childDateOfBirth\n      status\n      admissionStage {\n        id\n        name\n        color\n      }\n    }\n  }\n": typeof types.AdmissionApplicationSiblingsDocument,
    "\n  query OrgAdmissionReminders($filter: AdmissionReminderFilter) {\n    orgAdmissionReminders(filter: $filter) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      completedAt\n      application {\n        id\n        childFirstName\n        childLastName\n      }\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.OrgAdmissionRemindersDocument,
    "\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n": typeof types.RejectedAdmissionApplicationsDocument,
    "\n  query AdmissionsEnrollmentClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AdmissionsEnrollmentClassesDocument,
    "\n  mutation MoveAdmissionApplication($input: MoveAdmissionApplicationInput!) {\n    moveAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      position\n      stageEnteredAt\n    }\n  }\n": typeof types.MoveAdmissionApplicationDocument,
    "\n  mutation ResendAdmissionEmail($id: ID!) {\n    resendAdmissionEmail(id: $id) {\n      id\n      status\n      errorMessage\n    }\n  }\n": typeof types.ResendAdmissionEmailDocument,
    "\n  mutation DeleteAdmissionEmail($id: ID!) {\n    deleteAdmissionEmail(id: $id)\n  }\n": typeof types.DeleteAdmissionEmailDocument,
    "\n  mutation CreateAdmissionReminder($input: CreateAdmissionReminderInput!) {\n    createAdmissionReminder(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateAdmissionReminderDocument,
    "\n  mutation UpdateAdmissionReminder($input: UpdateAdmissionReminderInput!) {\n    updateAdmissionReminder(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateAdmissionReminderDocument,
    "\n  mutation CompleteAdmissionReminder($id: ID!) {\n    completeAdmissionReminder(id: $id) {\n      id\n    }\n  }\n": typeof types.CompleteAdmissionReminderDocument,
    "\n  mutation UncompleteAdmissionReminder($id: ID!) {\n    uncompleteAdmissionReminder(id: $id) {\n      id\n    }\n  }\n": typeof types.UncompleteAdmissionReminderDocument,
    "\n  mutation DeleteAdmissionReminder($id: ID!) {\n    deleteAdmissionReminder(id: $id)\n  }\n": typeof types.DeleteAdmissionReminderDocument,
    "\n  query PreviewAdmissionEmail($applicationId: ID!, $templateId: ID!) {\n    previewAdmissionEmail(\n      applicationId: $applicationId\n      templateId: $templateId\n    ) {\n      subject\n      bodyHtml\n      toEmail\n      toName\n      availableVariables\n    }\n  }\n": typeof types.PreviewAdmissionEmailDocument,
    "\n  mutation ReorderAdmissionApplications(\n    $input: ReorderAdmissionApplicationsInput!\n  ) {\n    reorderAdmissionApplications(input: $input) {\n      id\n      position\n    }\n  }\n": typeof types.ReorderAdmissionApplicationsDocument,
    "\n  mutation SendAdmissionEmail($input: SendAdmissionEmailInput!) {\n    sendAdmissionEmail(input: $input) {\n      id\n      status\n      errorMessage\n    }\n  }\n": typeof types.SendAdmissionEmailDocument,
    "\n  mutation CreateAdmissionStage($input: CreateAdmissionStageInput!) {\n    createAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n": typeof types.CreateAdmissionStageDocument,
    "\n  mutation UpdateAdmissionStage($input: UpdateAdmissionStageInput!) {\n    updateAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n": typeof types.UpdateAdmissionStageDocument,
    "\n  mutation ArchiveAdmissionStage($id: ID!) {\n    archiveAdmissionStage(id: $id)\n  }\n": typeof types.ArchiveAdmissionStageDocument,
    "\n  mutation ReorderAdmissionStages($input: ReorderAdmissionStagesInput!) {\n    reorderAdmissionStages(input: $input) {\n      id\n      position\n    }\n  }\n": typeof types.ReorderAdmissionStagesDocument,
    "\n  mutation UpdateAdmissionActivity($input: UpdateAdmissionActivityInput!) {\n    updateAdmissionActivity(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateAdmissionActivityDocument,
    "\n  mutation UpdateAdmissionApplication(\n    $input: UpdateAdmissionApplicationInput!\n  ) {\n    updateAdmissionApplication(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateAdmissionApplicationDocument,
    "\n  query AuthUserIdByUserId($userId: ID!) {\n    authUserIdByUserId(userId: $userId)\n  }\n": typeof types.AuthUserIdByUserIdDocument,
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
    "\n  mutation DeleteCountryInputTemplate($id: ID!) {\n    deleteCountryInputTemplate(id: $id)\n  }\n": typeof types.DeleteCountryInputTemplateDocument,
    "\n  query CountryInputTemplates {\n    countryInputTemplates {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n": typeof types.CountryInputTemplatesDocument,
    "\n  mutation UpsertCountryInputTemplate(\n    $input: UpsertCountryInputTemplateInput!\n  ) {\n    upsertCountryInputTemplate(input: $input) {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n": typeof types.UpsertCountryInputTemplateDocument,
    "\n  mutation ArchiveCurriculumNode($id: ID!) {\n    archiveCurriculumNode(id: $id)\n  }\n": typeof types.ArchiveCurriculumNodeDocument,
    "\n  mutation ArchiveCurriculum($id: ID!) {\n    archiveCurriculum(id: $id)\n  }\n": typeof types.ArchiveCurriculumDocument,
    "\n  mutation CreateCurriculum($input: CreateCurriculumInput!) {\n    createCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.CreateCurriculumDocument,
    "\n  query GetCurricula($includeArchived: Boolean) {\n    curricula(includeArchived: $includeArchived) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.GetCurriculaDocument,
    "\n  query GetCurriculumById($id: ID!) {\n    curriculumById(id: $id) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.GetCurriculumByIdDocument,
    "\n  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {\n    curriculumLevels(\n      curriculumId: $curriculumId\n      includeArchived: $includeArchived\n    ) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": typeof types.GetCurriculumLevelsDocument,
    "\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n": typeof types.GetCurriculumNodesDocument,
    "\n  mutation HardDeleteCurriculum($id: ID!) {\n    hardDeleteCurriculum(id: $id)\n  }\n": typeof types.HardDeleteCurriculumDocument,
    "\n  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {\n    importCurriculumFromPlan(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.ImportCurriculumFromPlanDocument,
    "\n  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {\n    reorderCurriculumNodes(input: $input) {\n      id\n      parentId\n      position\n    }\n  }\n": typeof types.ReorderCurriculumNodesDocument,
    "\n  mutation UnarchiveCurriculumNode($id: ID!) {\n    unarchiveCurriculumNode(id: $id)\n  }\n": typeof types.UnarchiveCurriculumNodeDocument,
    "\n  mutation UnarchiveCurriculum($id: ID!) {\n    unarchiveCurriculum(id: $id) {\n      id\n      isArchived\n    }\n  }\n": typeof types.UnarchiveCurriculumDocument,
    "\n  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {\n    updateCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.UpdateCurriculumDocument,
    "\n  mutation UpdateLessonClassification($input: UpdateCurriculumNodeInput!) {\n    updateCurriculumNode(input: $input) {\n      id\n      lessonType\n      lessonScale\n    }\n  }\n": typeof types.UpdateLessonClassificationDocument,
    "\n  mutation UpsertCurriculumLevelTranslation(\n    $input: UpsertCurriculumLevelTranslationInput!\n  ) {\n    upsertCurriculumLevelTranslation(input: $input) {\n      locale\n      name\n    }\n  }\n": typeof types.UpsertCurriculumLevelTranslationDocument,
    "\n  mutation UpsertCurriculumNodeTranslation(\n    $input: UpsertCurriculumNodeTranslationInput!\n  ) {\n    upsertCurriculumNodeTranslation(input: $input) {\n      locale\n      name\n      notes\n    }\n  }\n": typeof types.UpsertCurriculumNodeTranslationDocument,
    "\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.EmailTemplatesDocument,
    "\n  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {\n    createEmailTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEmailTemplateDocument,
    "\n  mutation UpdateEmailTemplate($input: UpdateEmailTemplateInput!) {\n    updateEmailTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEmailTemplateDocument,
    "\n  mutation DeleteEmailTemplate($id: ID!) {\n    deleteEmailTemplate(id: $id)\n  }\n": typeof types.DeleteEmailTemplateDocument,
    "\n  mutation ArchiveEmployeeAbsenceCategory($id: ID!) {\n    archiveEmployeeAbsenceCategory(id: $id)\n  }\n": typeof types.ArchiveEmployeeAbsenceCategoryDocument,
    "\n  mutation CreateEmployeeAbsenceCategory(\n    $input: CreateEmployeeAbsenceCategoryInput!\n  ) {\n    createEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeAbsenceCategoryDocument,
    "\n  query EmployeeAbsenceCategoriesByOrgIdFull {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.EmployeeAbsenceCategoriesByOrgIdFullDocument,
    "\n  query EmployeeAbsenceCategoryById($id: ID!) {\n    employeeAbsenceCategoryById(id: $id) {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": typeof types.EmployeeAbsenceCategoryByIdDocument,
    "\n  mutation ReorderEmployeeAbsenceCategories($ids: [ID!]!) {\n    reorderEmployeeAbsenceCategories(ids: $ids) {\n      id\n      sortOrder\n    }\n  }\n": typeof types.ReorderEmployeeAbsenceCategoriesDocument,
    "\n  mutation SetEmployeeAbsenceCategoryActive($id: ID!, $isActive: Boolean!) {\n    setEmployeeAbsenceCategoryActive(id: $id, isActive: $isActive) {\n      id\n      isActive\n    }\n  }\n": typeof types.SetEmployeeAbsenceCategoryActiveDocument,
    "\n  mutation UpdateEmployeeAbsenceCategory(\n    $input: UpdateEmployeeAbsenceCategoryInput!\n  ) {\n    updateEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeeAbsenceCategoryDocument,
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
    "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgInsuranceNumber\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n": typeof types.GetEmployeeHrProfileDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeesDocument,
    "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeeDocument,
    "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeeEmergencyProfileDocument,
    "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeeHrProfileDocument,
    "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n": typeof types.CreateGradeLevelDocument,
    "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n": typeof types.DeleteGradeLevelDocument,
    "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n": typeof types.GetGradeLevelsDocument,
    "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.ReorderGradeLevelsDocument,
    "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n": typeof types.UpdateGradeLevelDocument,
    "\n  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {\n    createOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": typeof types.CreateOrganizationSettingDocument,
    "\n  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {\n    deleteOrganizationSetting(organizationId: $organizationId, key: $key)\n  }\n": typeof types.DeleteOrganizationSettingDocument,
    "\n  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {\n    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      value\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetOrganizationSettingDocument,
    "\n  query GetOrganizationSettings($organizationId: ID!) {\n    organizationSettings(organizationId: $organizationId) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetOrganizationSettingsDocument,
    "\n  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {\n    updateOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": typeof types.UpdateOrganizationSettingDocument,
    "\n  query IsOrganizationDomainAvailable($domain: String!) {\n    isOrganizationDomainAvailable(domain: $domain)\n  }\n": typeof types.IsOrganizationDomainAvailableDocument,
    "\n  query IsOrganizationSubdomainAvailable($subdomain: String!) {\n    isOrganizationSubdomainAvailable(subdomain: $subdomain)\n  }\n": typeof types.IsOrganizationSubdomainAvailableDocument,
    "\n  mutation CreateOrganization {\n    createOrganization {\n      id\n    }\n  }\n": typeof types.CreateOrganizationDocument,
    "\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      bvgProvider\n      bvgContactPhone\n      uvgProvider\n      uvgContactPhone\n      dailySicknessProvider\n      dailySicknessContactPhone\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.OrganizationDocument,
    "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      subdomain\n      domain\n      isActive\n    }\n  }\n": typeof types.GetOrganizationsDocument,
    "\n  mutation RemoveOrganization($id: String!) {\n    removeOrganization(id: $id) {\n      id\n    }\n  }\n": typeof types.RemoveOrganizationDocument,
    "\n  mutation UpdateOrganization(\n    $updateOrganizationInput: UpdateOrganizationInput!\n  ) {\n    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {\n      id\n      name\n      subdomain\n    }\n  }\n": typeof types.UpdateOrganizationDocument,
    "\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n": typeof types.ArchiveProjectDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProjectDocument,
    "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n": typeof types.DeleteProjectDocument,
    "\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.MyTasksDocument,
    "\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n": typeof types.MembershipsByOrgIdDocument,
    "\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.TasksByProjectDocument,
    "\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.ProjectByIdDocument,
    "\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n    }\n  }\n": typeof types.MyProjectsDocument,
    "\n  mutation AddProjectMember($input: AddProjectMemberInput!) {\n    addProjectMember(input: $input) {\n      id\n    }\n  }\n": typeof types.AddProjectMemberDocument,
    "\n  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {\n    updateProjectMemberRole(input: $input) {\n      id\n      role\n    }\n  }\n": typeof types.UpdateProjectMemberRoleDocument,
    "\n  mutation RemoveProjectMember($id: ID!) {\n    removeProjectMember(id: $id)\n  }\n": typeof types.RemoveProjectMemberDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateTaskDocument,
    "\n  mutation UpdateTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateTaskDocument,
    "\n  mutation MoveTask($input: MoveTaskInput!) {\n    moveTask(input: $input) {\n      id\n      status\n      sortOrder\n    }\n  }\n": typeof types.MoveTaskDocument,
    "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n": typeof types.DeleteTaskDocument,
    "\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateProjectDocument,
    "\n  mutation UpdateTaskStatus($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.UpdateTaskStatusDocument,
    "\n  query GetRecordKeepingSettings {\n    recordKeepingSettings {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n": typeof types.GetRecordKeepingSettingsDocument,
    "\n  mutation UpdateRecordKeepingSettings(\n    $input: UpdateRecordKeepingSettingsInput!\n  ) {\n    updateRecordKeepingSettings(input: $input) {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n": typeof types.UpdateRecordKeepingSettingsDocument,
    "\n  mutation CreateLessonRecordsBulk($input: CreateLessonRecordsBulkInput!) {\n    createLessonRecordsBulk(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n": typeof types.CreateLessonRecordsBulkDocument,
    "\n  query GetAreaLessonCounts {\n    areaLessonCountsByOrg {\n      areaId\n      lessonCount\n      curriculumId\n      curriculumName\n    }\n  }\n": typeof types.GetAreaLessonCountsDocument,
    "\n  query ClassroomAttention($schoolClassId: ID!, $locale: String!) {\n    classroomAttentionSummaries(\n      schoolClassId: $schoolClassId\n      locale: $locale\n    ) {\n      studentId\n      firstName\n      lastName\n      totalSignals\n      byReason {\n        NEEDS_MORE_CURRENT\n        REPEATED_NEEDS_MORE\n        STUCK_PRACTICED\n        STUCK_INTRODUCED\n        BIG_GAP_INTRO_TO_PRACTICED\n      }\n      topItems {\n        lessonId\n        lessonName\n        reason\n        severity\n        days\n        since\n        ancestors {\n          id\n          nodeType\n          translations {\n            locale\n            name\n          }\n        }\n      }\n    }\n  }\n": typeof types.ClassroomAttentionDocument,
    "\n  query ClassroomEngagementTimeline(\n    $schoolClassId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    classroomEngagementTimeline(\n      schoolClassId: $schoolClassId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        focused\n        interested\n        mechanical\n        resistant\n        total\n      }\n      totalObserved\n    }\n  }\n": typeof types.ClassroomEngagementTimelineDocument,
    "\n  query ClassroomHeatmapData($schoolClassId: ID!, $locale: String!) {\n    classroomHeatmapData(schoolClassId: $schoolClassId, locale: $locale) {\n      students {\n        studentId\n        firstName\n        lastName\n      }\n      areas {\n        areaId\n        areaName\n      }\n      cells {\n        studentId\n        areaId\n        status\n        count\n      }\n    }\n  }\n": typeof types.ClassroomHeatmapDataDocument,
    "\n  query GetClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": typeof types.GetClassroomStudentsDocument,
    "\n  query GetLessonPrerequisites($lessonId: ID!) {\n    lessonPrerequisites(lessonId: $lessonId) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": typeof types.GetLessonPrerequisitesDocument,
    "\n  query GetLessonsForRecordKeeping {\n    lessonsByOrg(includeArchived: false) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n      ancestors {\n        id\n        nodeType\n        position\n        translations {\n          locale\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetLessonsForRecordKeepingDocument,
    "\n  query NextLessonsForStudent($studentId: ID!, $limit: Int) {\n    nextLessonsForStudent(studentId: $studentId, limit: $limit) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": typeof types.NextLessonsForStudentDocument,
    "\n  query GetOrgAreas {\n    areasByOrg(includeArchived: false) {\n      id\n      position\n      nodeType\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": typeof types.GetOrgAreasDocument,
    "\n  query GetStudentLessonRecords($filter: LessonRecordsFilterInput) {\n    lessonRecords(filter: $filter) {\n      id\n      lessonId\n      recordedAt\n      status\n      note\n      engagement\n      difficulty\n      socialForm\n      selfAssessment\n      selfAssessmentByChild\n      lessonClarityConfirmed\n      selfConfidence\n      persistence\n      concentration\n      lesson {\n        id\n        position\n        translations {\n          locale\n          name\n        }\n        ancestors {\n          id\n          nodeType\n          position\n          translations {\n            locale\n            name\n          }\n        }\n      }\n      recordedBy {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": typeof types.GetStudentLessonRecordsDocument,
    "\n  query StudentLessonRecordTimeline(\n    $studentId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    studentLessonRecordTimeline(\n      studentId: $studentId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        planning\n        introduced\n        practiced\n        mastered\n        needsMore\n        total\n      }\n      totalIntroductionsInRange\n      daysSinceLastIntroduction\n    }\n  }\n": typeof types.StudentLessonRecordTimelineDocument,
    "\n  mutation SetLessonPrerequisites($input: SetLessonPrerequisitesInput!) {\n    setLessonPrerequisites(input: $input) {\n      id\n    }\n  }\n": typeof types.SetLessonPrerequisitesDocument,
    "\n  mutation UpdateLessonRecord($input: UpdateLessonRecordInput!) {\n    updateLessonRecord(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n": typeof types.UpdateLessonRecordDocument,
    "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n": typeof types.GetPermissionsDocument,
    "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n": typeof types.GetRolesByOrgIdDocument,
    "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n": typeof types.UpdateRolePermissionsDocument,
    "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateSchoolClassDocument,
    "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n": typeof types.DeleteSchoolClassDocument,
    "\n  query GetMyTeachingSchoolClasses {\n    myTeachingSchoolClasses {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetMyTeachingSchoolClassesDocument,
    "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetSchoolClassByIdDocument,
    "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetSchoolClassesDocument,
    "\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.GetTeachersByOrgIdDocument,
    "\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateSchoolClassDocument,
    "\n  mutation CreateStudentNote(\n    $createStudentNoteInput: CreateStudentNoteInput!\n  ) {\n    createStudentNote(createStudentNoteInput: $createStudentNoteInput) {\n      id\n    }\n  }\n": typeof types.CreateStudentNoteDocument,
    "\n  query GetStudentNotesByStudentId($studentId: ID!) {\n    studentNotesByStudentId(studentId: $studentId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.GetStudentNotesByStudentIdDocument,
    "\n  query KanbanSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      color\n      maxCapacity\n      sortOrder\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n": typeof types.KanbanSchoolClassesDocument,
    "\n  query KanbanUnassignedStudents {\n    unassignedStudents {\n      id\n      firstName\n      lastName\n    }\n  }\n": typeof types.KanbanUnassignedStudentsDocument,
    "\n  query KanbanClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": typeof types.KanbanClassroomStudentsDocument,
    "\n  mutation TransferStudent($input: TransferStudentInput!) {\n    transferStudentToSchoolClass(input: $input) {\n      id\n    }\n  }\n": typeof types.TransferStudentDocument,
    "\n  mutation CreateStudent($input: CreateStudentInput!) {\n    createStudent(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateStudentDocument,
    "\n  mutation DeleteStudent($id: ID!) {\n    deleteStudent(id: $id)\n  }\n": typeof types.DeleteStudentDocument,
    "\n  query GetStudentById($id: ID!) {\n    studentById(id: $id) {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      notes\n      isActive\n    }\n  }\n": typeof types.GetStudentByIdDocument,
    "\n  query GetEnrollmentsByStudentId($studentId: ID!) {\n    enrollmentsByStudentId(studentId: $studentId) {\n      id\n      enrolledAt\n      leftAt\n      schoolClass {\n        id\n        name\n        gradeLevels {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetEnrollmentsByStudentIdDocument,
    "\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      exitDate\n      isActive\n      currentClass {\n        id\n        name\n        color\n        gradeLevels {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n": typeof types.GetStudentsDocument,
    "\n  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {\n    updateEnrollment(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEnrollmentDocument,
    "\n  mutation UpdateStudent($input: UpdateStudentInput!) {\n    updateStudent(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateStudentDocument,
    "\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": typeof types.AddTeamMemberDocument,
    "\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": typeof types.CreateTeamDocument,
    "\n  mutation DeleteTeam($id: ID!) {\n    deleteTeam(id: $id)\n  }\n": typeof types.DeleteTeamDocument,
    "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.GetTeamByIdDocument,
    "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      role\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetTeamMembersDocument,
    "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": typeof types.GetTeamsDocument,
    "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n": typeof types.RemoveTeamMemberDocument,
    "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": typeof types.ReorderTeamsDocument,
    "\n  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": typeof types.UpdateTeamMemberRoleDocument,
    "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.UpdateTeamDocument,
    "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n": typeof types.AddUserEmailDocument,
    "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      persona\n      isSuperAdmin\n    }\n  }\n": typeof types.GetAuthContextDocument,
    "\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n": typeof types.RolesByOrganizationIdDocument,
    "\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetUserByIdDocument,
    "\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetUsersDocument,
    "\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n": typeof types.RemoveUserEmailDocument,
    "\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n": typeof types.SetPrimaryUserEmailDocument,
    "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n": typeof types.UpdateUserDocument,
};
const documents: Documents = {
    "\n  mutation ArchiveAdmissionApplication($id: ID!) {\n    archiveAdmissionApplication(id: $id)\n  }\n": types.ArchiveAdmissionApplicationDocument,
    "\n  mutation RejectAdmissionApplication(\n    $input: RejectAdmissionApplicationInput!\n  ) {\n    rejectAdmissionApplication(input: $input) {\n      id\n      status\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n    }\n  }\n": types.RejectAdmissionApplicationDocument,
    "\n  mutation DeleteAdmissionApplication($id: ID!) {\n    deleteAdmissionApplication(id: $id)\n  }\n": types.DeleteAdmissionApplicationDocument,
    "\n  mutation RestoreAdmissionApplication($id: ID!) {\n    restoreAdmissionApplication(id: $id) {\n      id\n      status\n    }\n  }\n": types.RestoreAdmissionApplicationDocument,
    "\n  mutation UpdateAdmissionBoardSettings(\n    $input: UpdateAdmissionBoardSettingsInput!\n  ) {\n    updateAdmissionBoardSettings(input: $input) {\n      tableColumns\n    }\n  }\n": types.UpdateAdmissionBoardSettingsDocument,
    "\n  mutation CreateAdmissionActivity($input: CreateAdmissionActivityInput!) {\n    createAdmissionActivity(input: $input) {\n      id\n    }\n  }\n": types.CreateAdmissionActivityDocument,
    "\n  mutation CreateAdmissionApplication(\n    $input: CreateAdmissionApplicationInput!\n  ) {\n    createAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      familyId\n    }\n  }\n": types.CreateAdmissionApplicationDocument,
    "\n  mutation DeleteAdmissionActivity($id: ID!) {\n    deleteAdmissionActivity(id: $id)\n  }\n": types.DeleteAdmissionActivityDocument,
    "\n  mutation FinalizeAdmissionEnrollment($input: FinalizeEnrollmentInput!) {\n    finalizeAdmissionEnrollment(input: $input) {\n      application {\n        id\n        status\n        enrolledStudentId\n      }\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": types.FinalizeAdmissionEnrollmentDocument,
    "\n  query AdmissionActivities($applicationId: ID!) {\n    admissionActivities(applicationId: $applicationId) {\n      id\n      applicationId\n      type\n      occurredAt\n      subject\n      body\n      direction\n      durationMinutes\n      location\n      createdAt\n      updatedAt\n      createdByMembershipId\n      createdByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.AdmissionActivitiesDocument,
    "\n  query AdmissionEmails($applicationId: ID!) {\n    admissionEmails(applicationId: $applicationId) {\n      id\n      toEmail\n      toName\n      subject\n      bodyHtml\n      status\n      errorMessage\n      sentAt\n      template {\n        id\n        name\n      }\n      sentByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.AdmissionEmailsDocument,
    "\n  query AdmissionReminders($applicationId: ID!) {\n    admissionReminders(applicationId: $applicationId) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      assignedToMembershipId\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n      completedAt\n      createdAt\n    }\n  }\n": types.AdmissionRemindersDocument,
    "\n  query AdmissionsKanbanReminders {\n    orgAdmissionReminders(filter: OPEN) {\n      id\n      applicationId\n      dueAt\n    }\n  }\n": types.AdmissionsKanbanRemindersDocument,
    "\n  query AdmissionsKanbanStages {\n    admissionStages {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      isArchived\n      cardFields\n    }\n  }\n": types.AdmissionsKanbanStagesDocument,
    "\n  query AdmissionsBoardSettings {\n    admissionBoardSettings {\n      tableColumns\n    }\n  }\n": types.AdmissionsBoardSettingsDocument,
    "\n  query AdmissionsKanbanRejectionReasons {\n    admissionRejectionReasons {\n      id\n      label\n      color\n      position\n    }\n  }\n": types.AdmissionsKanbanRejectionReasonsDocument,
    "\n  query AdmissionsKanbanApplications {\n    admissionApplications {\n      id\n      admissionStageId\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      status\n      source\n      stageEnteredAt\n      familyId\n      enrolledStudentId\n      desiredGradeLevelId\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n      family {\n        id\n        name\n        contactPersons {\n          id\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n        }\n      }\n    }\n  }\n": types.AdmissionsKanbanApplicationsDocument,
    "\n  query AdmissionApplicationDetail($id: ID!) {\n    admissionApplicationById(id: $id) {\n      id\n      organizationId\n      admissionStageId\n      status\n      source\n      stageEnteredAt\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      childNotes\n      desiredGradeLevelId\n      desiredSchoolClassId\n      desiredEnrollmentDate\n      enrolledStudentId\n      familyId\n      family {\n        id\n        name\n        notes\n        contactPersons {\n          id\n          salutation\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n          occupation\n        }\n      }\n      admissionStage {\n        id\n        name\n        stageType\n      }\n      desiredSchoolClass {\n        id\n        name\n      }\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n    }\n    admissionAuditLogs(applicationId: $id) {\n      id\n      action\n      createdAt\n      fieldName\n      oldValue\n      newValue\n      fromStage {\n        id\n        name\n      }\n      toStage {\n        id\n        name\n      }\n      actorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n    admissionApplicationsByFamily(\n      familyId: \"00000000-0000-0000-0000-000000000000\"\n    ) @skip(if: true) {\n      id\n    }\n  }\n": types.AdmissionApplicationDetailDocument,
    "\n  query AdmissionApplicationSiblings($familyId: ID!) {\n    admissionApplicationsByFamily(familyId: $familyId) {\n      id\n      childFirstName\n      childLastName\n      childDateOfBirth\n      status\n      admissionStage {\n        id\n        name\n        color\n      }\n    }\n  }\n": types.AdmissionApplicationSiblingsDocument,
    "\n  query OrgAdmissionReminders($filter: AdmissionReminderFilter) {\n    orgAdmissionReminders(filter: $filter) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      completedAt\n      application {\n        id\n        childFirstName\n        childLastName\n      }\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.OrgAdmissionRemindersDocument,
    "\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n": types.RejectedAdmissionApplicationsDocument,
    "\n  query AdmissionsEnrollmentClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n": types.AdmissionsEnrollmentClassesDocument,
    "\n  mutation MoveAdmissionApplication($input: MoveAdmissionApplicationInput!) {\n    moveAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      position\n      stageEnteredAt\n    }\n  }\n": types.MoveAdmissionApplicationDocument,
    "\n  mutation ResendAdmissionEmail($id: ID!) {\n    resendAdmissionEmail(id: $id) {\n      id\n      status\n      errorMessage\n    }\n  }\n": types.ResendAdmissionEmailDocument,
    "\n  mutation DeleteAdmissionEmail($id: ID!) {\n    deleteAdmissionEmail(id: $id)\n  }\n": types.DeleteAdmissionEmailDocument,
    "\n  mutation CreateAdmissionReminder($input: CreateAdmissionReminderInput!) {\n    createAdmissionReminder(input: $input) {\n      id\n    }\n  }\n": types.CreateAdmissionReminderDocument,
    "\n  mutation UpdateAdmissionReminder($input: UpdateAdmissionReminderInput!) {\n    updateAdmissionReminder(input: $input) {\n      id\n    }\n  }\n": types.UpdateAdmissionReminderDocument,
    "\n  mutation CompleteAdmissionReminder($id: ID!) {\n    completeAdmissionReminder(id: $id) {\n      id\n    }\n  }\n": types.CompleteAdmissionReminderDocument,
    "\n  mutation UncompleteAdmissionReminder($id: ID!) {\n    uncompleteAdmissionReminder(id: $id) {\n      id\n    }\n  }\n": types.UncompleteAdmissionReminderDocument,
    "\n  mutation DeleteAdmissionReminder($id: ID!) {\n    deleteAdmissionReminder(id: $id)\n  }\n": types.DeleteAdmissionReminderDocument,
    "\n  query PreviewAdmissionEmail($applicationId: ID!, $templateId: ID!) {\n    previewAdmissionEmail(\n      applicationId: $applicationId\n      templateId: $templateId\n    ) {\n      subject\n      bodyHtml\n      toEmail\n      toName\n      availableVariables\n    }\n  }\n": types.PreviewAdmissionEmailDocument,
    "\n  mutation ReorderAdmissionApplications(\n    $input: ReorderAdmissionApplicationsInput!\n  ) {\n    reorderAdmissionApplications(input: $input) {\n      id\n      position\n    }\n  }\n": types.ReorderAdmissionApplicationsDocument,
    "\n  mutation SendAdmissionEmail($input: SendAdmissionEmailInput!) {\n    sendAdmissionEmail(input: $input) {\n      id\n      status\n      errorMessage\n    }\n  }\n": types.SendAdmissionEmailDocument,
    "\n  mutation CreateAdmissionStage($input: CreateAdmissionStageInput!) {\n    createAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n": types.CreateAdmissionStageDocument,
    "\n  mutation UpdateAdmissionStage($input: UpdateAdmissionStageInput!) {\n    updateAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n": types.UpdateAdmissionStageDocument,
    "\n  mutation ArchiveAdmissionStage($id: ID!) {\n    archiveAdmissionStage(id: $id)\n  }\n": types.ArchiveAdmissionStageDocument,
    "\n  mutation ReorderAdmissionStages($input: ReorderAdmissionStagesInput!) {\n    reorderAdmissionStages(input: $input) {\n      id\n      position\n    }\n  }\n": types.ReorderAdmissionStagesDocument,
    "\n  mutation UpdateAdmissionActivity($input: UpdateAdmissionActivityInput!) {\n    updateAdmissionActivity(input: $input) {\n      id\n    }\n  }\n": types.UpdateAdmissionActivityDocument,
    "\n  mutation UpdateAdmissionApplication(\n    $input: UpdateAdmissionApplicationInput!\n  ) {\n    updateAdmissionApplication(input: $input) {\n      id\n    }\n  }\n": types.UpdateAdmissionApplicationDocument,
    "\n  query AuthUserIdByUserId($userId: ID!) {\n    authUserIdByUserId(userId: $userId)\n  }\n": types.AuthUserIdByUserIdDocument,
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
    "\n  mutation DeleteCountryInputTemplate($id: ID!) {\n    deleteCountryInputTemplate(id: $id)\n  }\n": types.DeleteCountryInputTemplateDocument,
    "\n  query CountryInputTemplates {\n    countryInputTemplates {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n": types.CountryInputTemplatesDocument,
    "\n  mutation UpsertCountryInputTemplate(\n    $input: UpsertCountryInputTemplateInput!\n  ) {\n    upsertCountryInputTemplate(input: $input) {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n": types.UpsertCountryInputTemplateDocument,
    "\n  mutation ArchiveCurriculumNode($id: ID!) {\n    archiveCurriculumNode(id: $id)\n  }\n": types.ArchiveCurriculumNodeDocument,
    "\n  mutation ArchiveCurriculum($id: ID!) {\n    archiveCurriculum(id: $id)\n  }\n": types.ArchiveCurriculumDocument,
    "\n  mutation CreateCurriculum($input: CreateCurriculumInput!) {\n    createCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.CreateCurriculumDocument,
    "\n  query GetCurricula($includeArchived: Boolean) {\n    curricula(includeArchived: $includeArchived) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.GetCurriculaDocument,
    "\n  query GetCurriculumById($id: ID!) {\n    curriculumById(id: $id) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.GetCurriculumByIdDocument,
    "\n  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {\n    curriculumLevels(\n      curriculumId: $curriculumId\n      includeArchived: $includeArchived\n    ) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": types.GetCurriculumLevelsDocument,
    "\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n": types.GetCurriculumNodesDocument,
    "\n  mutation HardDeleteCurriculum($id: ID!) {\n    hardDeleteCurriculum(id: $id)\n  }\n": types.HardDeleteCurriculumDocument,
    "\n  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {\n    importCurriculumFromPlan(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.ImportCurriculumFromPlanDocument,
    "\n  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {\n    reorderCurriculumNodes(input: $input) {\n      id\n      parentId\n      position\n    }\n  }\n": types.ReorderCurriculumNodesDocument,
    "\n  mutation UnarchiveCurriculumNode($id: ID!) {\n    unarchiveCurriculumNode(id: $id)\n  }\n": types.UnarchiveCurriculumNodeDocument,
    "\n  mutation UnarchiveCurriculum($id: ID!) {\n    unarchiveCurriculum(id: $id) {\n      id\n      isArchived\n    }\n  }\n": types.UnarchiveCurriculumDocument,
    "\n  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {\n    updateCurriculum(input: $input) {\n      id\n      slug\n      position\n      isArchived\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.UpdateCurriculumDocument,
    "\n  mutation UpdateLessonClassification($input: UpdateCurriculumNodeInput!) {\n    updateCurriculumNode(input: $input) {\n      id\n      lessonType\n      lessonScale\n    }\n  }\n": types.UpdateLessonClassificationDocument,
    "\n  mutation UpsertCurriculumLevelTranslation(\n    $input: UpsertCurriculumLevelTranslationInput!\n  ) {\n    upsertCurriculumLevelTranslation(input: $input) {\n      locale\n      name\n    }\n  }\n": types.UpsertCurriculumLevelTranslationDocument,
    "\n  mutation UpsertCurriculumNodeTranslation(\n    $input: UpsertCurriculumNodeTranslationInput!\n  ) {\n    upsertCurriculumNodeTranslation(input: $input) {\n      locale\n      name\n      notes\n    }\n  }\n": types.UpsertCurriculumNodeTranslationDocument,
    "\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      createdAt\n      updatedAt\n    }\n  }\n": types.EmailTemplatesDocument,
    "\n  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {\n    createEmailTemplate(input: $input) {\n      id\n    }\n  }\n": types.CreateEmailTemplateDocument,
    "\n  mutation UpdateEmailTemplate($input: UpdateEmailTemplateInput!) {\n    updateEmailTemplate(input: $input) {\n      id\n    }\n  }\n": types.UpdateEmailTemplateDocument,
    "\n  mutation DeleteEmailTemplate($id: ID!) {\n    deleteEmailTemplate(id: $id)\n  }\n": types.DeleteEmailTemplateDocument,
    "\n  mutation ArchiveEmployeeAbsenceCategory($id: ID!) {\n    archiveEmployeeAbsenceCategory(id: $id)\n  }\n": types.ArchiveEmployeeAbsenceCategoryDocument,
    "\n  mutation CreateEmployeeAbsenceCategory(\n    $input: CreateEmployeeAbsenceCategoryInput!\n  ) {\n    createEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n": types.CreateEmployeeAbsenceCategoryDocument,
    "\n  query EmployeeAbsenceCategoriesByOrgIdFull {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.EmployeeAbsenceCategoriesByOrgIdFullDocument,
    "\n  query EmployeeAbsenceCategoryById($id: ID!) {\n    employeeAbsenceCategoryById(id: $id) {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n": types.EmployeeAbsenceCategoryByIdDocument,
    "\n  mutation ReorderEmployeeAbsenceCategories($ids: [ID!]!) {\n    reorderEmployeeAbsenceCategories(ids: $ids) {\n      id\n      sortOrder\n    }\n  }\n": types.ReorderEmployeeAbsenceCategoriesDocument,
    "\n  mutation SetEmployeeAbsenceCategoryActive($id: ID!, $isActive: Boolean!) {\n    setEmployeeAbsenceCategoryActive(id: $id, isActive: $isActive) {\n      id\n      isActive\n    }\n  }\n": types.SetEmployeeAbsenceCategoryActiveDocument,
    "\n  mutation UpdateEmployeeAbsenceCategory(\n    $input: UpdateEmployeeAbsenceCategoryInput!\n  ) {\n    updateEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n": types.UpdateEmployeeAbsenceCategoryDocument,
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
    "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgInsuranceNumber\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n": types.GetEmployeeHrProfileDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetEmployeesDocument,
    "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n": types.UpdateEmployeeDocument,
    "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeeEmergencyProfileDocument,
    "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeeHrProfileDocument,
    "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n": types.CreateGradeLevelDocument,
    "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n": types.DeleteGradeLevelDocument,
    "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n": types.GetGradeLevelsDocument,
    "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.ReorderGradeLevelsDocument,
    "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n": types.UpdateGradeLevelDocument,
    "\n  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {\n    createOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": types.CreateOrganizationSettingDocument,
    "\n  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {\n    deleteOrganizationSetting(organizationId: $organizationId, key: $key)\n  }\n": types.DeleteOrganizationSettingDocument,
    "\n  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {\n    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      value\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetOrganizationSettingDocument,
    "\n  query GetOrganizationSettings($organizationId: ID!) {\n    organizationSettings(organizationId: $organizationId) {\n      id\n      organizationId\n      key\n      description\n      hasValue\n      version\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetOrganizationSettingsDocument,
    "\n  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {\n    updateOrganizationSetting(input: $input) {\n      id\n      key\n      description\n      hasValue\n    }\n  }\n": types.UpdateOrganizationSettingDocument,
    "\n  query IsOrganizationDomainAvailable($domain: String!) {\n    isOrganizationDomainAvailable(domain: $domain)\n  }\n": types.IsOrganizationDomainAvailableDocument,
    "\n  query IsOrganizationSubdomainAvailable($subdomain: String!) {\n    isOrganizationSubdomainAvailable(subdomain: $subdomain)\n  }\n": types.IsOrganizationSubdomainAvailableDocument,
    "\n  mutation CreateOrganization {\n    createOrganization {\n      id\n    }\n  }\n": types.CreateOrganizationDocument,
    "\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      bvgProvider\n      bvgContactPhone\n      uvgProvider\n      uvgContactPhone\n      dailySicknessProvider\n      dailySicknessContactPhone\n      createdAt\n      updatedAt\n    }\n  }\n": types.OrganizationDocument,
    "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      subdomain\n      domain\n      isActive\n    }\n  }\n": types.GetOrganizationsDocument,
    "\n  mutation RemoveOrganization($id: String!) {\n    removeOrganization(id: $id) {\n      id\n    }\n  }\n": types.RemoveOrganizationDocument,
    "\n  mutation UpdateOrganization(\n    $updateOrganizationInput: UpdateOrganizationInput!\n  ) {\n    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {\n      id\n      name\n      subdomain\n    }\n  }\n": types.UpdateOrganizationDocument,
    "\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n": types.ArchiveProjectDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n": types.DeleteProjectDocument,
    "\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.MyTasksDocument,
    "\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n": types.MembershipsByOrgIdDocument,
    "\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.TasksByProjectDocument,
    "\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.ProjectByIdDocument,
    "\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n    }\n  }\n": types.MyProjectsDocument,
    "\n  mutation AddProjectMember($input: AddProjectMemberInput!) {\n    addProjectMember(input: $input) {\n      id\n    }\n  }\n": types.AddProjectMemberDocument,
    "\n  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {\n    updateProjectMemberRole(input: $input) {\n      id\n      role\n    }\n  }\n": types.UpdateProjectMemberRoleDocument,
    "\n  mutation RemoveProjectMember($id: ID!) {\n    removeProjectMember(id: $id)\n  }\n": types.RemoveProjectMemberDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n": types.CreateTaskDocument,
    "\n  mutation UpdateTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n": types.UpdateTaskDocument,
    "\n  mutation MoveTask($input: MoveTaskInput!) {\n    moveTask(input: $input) {\n      id\n      status\n      sortOrder\n    }\n  }\n": types.MoveTaskDocument,
    "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n": types.DeleteTaskDocument,
    "\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      id\n    }\n  }\n": types.UpdateProjectDocument,
    "\n  mutation UpdateTaskStatus($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n      status\n    }\n  }\n": types.UpdateTaskStatusDocument,
    "\n  query GetRecordKeepingSettings {\n    recordKeepingSettings {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n": types.GetRecordKeepingSettingsDocument,
    "\n  mutation UpdateRecordKeepingSettings(\n    $input: UpdateRecordKeepingSettingsInput!\n  ) {\n    updateRecordKeepingSettings(input: $input) {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n": types.UpdateRecordKeepingSettingsDocument,
    "\n  mutation CreateLessonRecordsBulk($input: CreateLessonRecordsBulkInput!) {\n    createLessonRecordsBulk(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n": types.CreateLessonRecordsBulkDocument,
    "\n  query GetAreaLessonCounts {\n    areaLessonCountsByOrg {\n      areaId\n      lessonCount\n      curriculumId\n      curriculumName\n    }\n  }\n": types.GetAreaLessonCountsDocument,
    "\n  query ClassroomAttention($schoolClassId: ID!, $locale: String!) {\n    classroomAttentionSummaries(\n      schoolClassId: $schoolClassId\n      locale: $locale\n    ) {\n      studentId\n      firstName\n      lastName\n      totalSignals\n      byReason {\n        NEEDS_MORE_CURRENT\n        REPEATED_NEEDS_MORE\n        STUCK_PRACTICED\n        STUCK_INTRODUCED\n        BIG_GAP_INTRO_TO_PRACTICED\n      }\n      topItems {\n        lessonId\n        lessonName\n        reason\n        severity\n        days\n        since\n        ancestors {\n          id\n          nodeType\n          translations {\n            locale\n            name\n          }\n        }\n      }\n    }\n  }\n": types.ClassroomAttentionDocument,
    "\n  query ClassroomEngagementTimeline(\n    $schoolClassId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    classroomEngagementTimeline(\n      schoolClassId: $schoolClassId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        focused\n        interested\n        mechanical\n        resistant\n        total\n      }\n      totalObserved\n    }\n  }\n": types.ClassroomEngagementTimelineDocument,
    "\n  query ClassroomHeatmapData($schoolClassId: ID!, $locale: String!) {\n    classroomHeatmapData(schoolClassId: $schoolClassId, locale: $locale) {\n      students {\n        studentId\n        firstName\n        lastName\n      }\n      areas {\n        areaId\n        areaName\n      }\n      cells {\n        studentId\n        areaId\n        status\n        count\n      }\n    }\n  }\n": types.ClassroomHeatmapDataDocument,
    "\n  query GetClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": types.GetClassroomStudentsDocument,
    "\n  query GetLessonPrerequisites($lessonId: ID!) {\n    lessonPrerequisites(lessonId: $lessonId) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": types.GetLessonPrerequisitesDocument,
    "\n  query GetLessonsForRecordKeeping {\n    lessonsByOrg(includeArchived: false) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n      ancestors {\n        id\n        nodeType\n        position\n        translations {\n          locale\n          name\n        }\n      }\n    }\n  }\n": types.GetLessonsForRecordKeepingDocument,
    "\n  query NextLessonsForStudent($studentId: ID!, $limit: Int) {\n    nextLessonsForStudent(studentId: $studentId, limit: $limit) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": types.NextLessonsForStudentDocument,
    "\n  query GetOrgAreas {\n    areasByOrg(includeArchived: false) {\n      id\n      position\n      nodeType\n      translations {\n        locale\n        name\n      }\n    }\n  }\n": types.GetOrgAreasDocument,
    "\n  query GetStudentLessonRecords($filter: LessonRecordsFilterInput) {\n    lessonRecords(filter: $filter) {\n      id\n      lessonId\n      recordedAt\n      status\n      note\n      engagement\n      difficulty\n      socialForm\n      selfAssessment\n      selfAssessmentByChild\n      lessonClarityConfirmed\n      selfConfidence\n      persistence\n      concentration\n      lesson {\n        id\n        position\n        translations {\n          locale\n          name\n        }\n        ancestors {\n          id\n          nodeType\n          position\n          translations {\n            locale\n            name\n          }\n        }\n      }\n      recordedBy {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": types.GetStudentLessonRecordsDocument,
    "\n  query StudentLessonRecordTimeline(\n    $studentId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    studentLessonRecordTimeline(\n      studentId: $studentId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        planning\n        introduced\n        practiced\n        mastered\n        needsMore\n        total\n      }\n      totalIntroductionsInRange\n      daysSinceLastIntroduction\n    }\n  }\n": types.StudentLessonRecordTimelineDocument,
    "\n  mutation SetLessonPrerequisites($input: SetLessonPrerequisitesInput!) {\n    setLessonPrerequisites(input: $input) {\n      id\n    }\n  }\n": types.SetLessonPrerequisitesDocument,
    "\n  mutation UpdateLessonRecord($input: UpdateLessonRecordInput!) {\n    updateLessonRecord(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n": types.UpdateLessonRecordDocument,
    "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n": types.GetPermissionsDocument,
    "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n": types.GetRolesByOrgIdDocument,
    "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n": types.UpdateRolePermissionsDocument,
    "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n": types.CreateSchoolClassDocument,
    "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n": types.DeleteSchoolClassDocument,
    "\n  query GetMyTeachingSchoolClasses {\n    myTeachingSchoolClasses {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetMyTeachingSchoolClassesDocument,
    "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetSchoolClassByIdDocument,
    "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetSchoolClassesDocument,
    "\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.GetTeachersByOrgIdDocument,
    "\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n": types.UpdateSchoolClassDocument,
    "\n  mutation CreateStudentNote(\n    $createStudentNoteInput: CreateStudentNoteInput!\n  ) {\n    createStudentNote(createStudentNoteInput: $createStudentNoteInput) {\n      id\n    }\n  }\n": types.CreateStudentNoteDocument,
    "\n  query GetStudentNotesByStudentId($studentId: ID!) {\n    studentNotesByStudentId(studentId: $studentId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.GetStudentNotesByStudentIdDocument,
    "\n  query KanbanSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      color\n      maxCapacity\n      sortOrder\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n": types.KanbanSchoolClassesDocument,
    "\n  query KanbanUnassignedStudents {\n    unassignedStudents {\n      id\n      firstName\n      lastName\n    }\n  }\n": types.KanbanUnassignedStudentsDocument,
    "\n  query KanbanClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n": types.KanbanClassroomStudentsDocument,
    "\n  mutation TransferStudent($input: TransferStudentInput!) {\n    transferStudentToSchoolClass(input: $input) {\n      id\n    }\n  }\n": types.TransferStudentDocument,
    "\n  mutation CreateStudent($input: CreateStudentInput!) {\n    createStudent(input: $input) {\n      id\n    }\n  }\n": types.CreateStudentDocument,
    "\n  mutation DeleteStudent($id: ID!) {\n    deleteStudent(id: $id)\n  }\n": types.DeleteStudentDocument,
    "\n  query GetStudentById($id: ID!) {\n    studentById(id: $id) {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      enrollmentDate\n      exitDate\n      notes\n      isActive\n    }\n  }\n": types.GetStudentByIdDocument,
    "\n  query GetEnrollmentsByStudentId($studentId: ID!) {\n    enrollmentsByStudentId(studentId: $studentId) {\n      id\n      enrolledAt\n      leftAt\n      schoolClass {\n        id\n        name\n        gradeLevels {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetEnrollmentsByStudentIdDocument,
    "\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      exitDate\n      isActive\n      currentClass {\n        id\n        name\n        color\n        gradeLevels {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n": types.GetStudentsDocument,
    "\n  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {\n    updateEnrollment(input: $input) {\n      id\n    }\n  }\n": types.UpdateEnrollmentDocument,
    "\n  mutation UpdateStudent($input: UpdateStudentInput!) {\n    updateStudent(input: $input) {\n      id\n    }\n  }\n": types.UpdateStudentDocument,
    "\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": types.AddTeamMemberDocument,
    "\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": types.CreateTeamDocument,
    "\n  mutation DeleteTeam($id: ID!) {\n    deleteTeam(id: $id)\n  }\n": types.DeleteTeamDocument,
    "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n": types.GetTeamByIdDocument,
    "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      role\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetTeamMembersDocument,
    "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": types.GetTeamsDocument,
    "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n": types.RemoveTeamMemberDocument,
    "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": types.ReorderTeamsDocument,
    "\n  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": types.UpdateTeamMemberRoleDocument,
    "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n": types.UpdateTeamDocument,
    "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n": types.AddUserEmailDocument,
    "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n": types.CreateUserDocument,
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      persona\n      isSuperAdmin\n    }\n  }\n": types.GetAuthContextDocument,
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
export function graphql(source: "\n  mutation ArchiveAdmissionApplication($id: ID!) {\n    archiveAdmissionApplication(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveAdmissionApplication($id: ID!) {\n    archiveAdmissionApplication(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RejectAdmissionApplication(\n    $input: RejectAdmissionApplicationInput!\n  ) {\n    rejectAdmissionApplication(input: $input) {\n      id\n      status\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n    }\n  }\n"): (typeof documents)["\n  mutation RejectAdmissionApplication(\n    $input: RejectAdmissionApplicationInput!\n  ) {\n    rejectAdmissionApplication(input: $input) {\n      id\n      status\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAdmissionApplication($id: ID!) {\n    deleteAdmissionApplication(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAdmissionApplication($id: ID!) {\n    deleteAdmissionApplication(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RestoreAdmissionApplication($id: ID!) {\n    restoreAdmissionApplication(id: $id) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation RestoreAdmissionApplication($id: ID!) {\n    restoreAdmissionApplication(id: $id) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAdmissionBoardSettings(\n    $input: UpdateAdmissionBoardSettingsInput!\n  ) {\n    updateAdmissionBoardSettings(input: $input) {\n      tableColumns\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAdmissionBoardSettings(\n    $input: UpdateAdmissionBoardSettingsInput!\n  ) {\n    updateAdmissionBoardSettings(input: $input) {\n      tableColumns\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAdmissionActivity($input: CreateAdmissionActivityInput!) {\n    createAdmissionActivity(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAdmissionActivity($input: CreateAdmissionActivityInput!) {\n    createAdmissionActivity(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAdmissionApplication(\n    $input: CreateAdmissionApplicationInput!\n  ) {\n    createAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      familyId\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAdmissionApplication(\n    $input: CreateAdmissionApplicationInput!\n  ) {\n    createAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      familyId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAdmissionActivity($id: ID!) {\n    deleteAdmissionActivity(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAdmissionActivity($id: ID!) {\n    deleteAdmissionActivity(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FinalizeAdmissionEnrollment($input: FinalizeEnrollmentInput!) {\n    finalizeAdmissionEnrollment(input: $input) {\n      application {\n        id\n        status\n        enrolledStudentId\n      }\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation FinalizeAdmissionEnrollment($input: FinalizeEnrollmentInput!) {\n    finalizeAdmissionEnrollment(input: $input) {\n      application {\n        id\n        status\n        enrolledStudentId\n      }\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionActivities($applicationId: ID!) {\n    admissionActivities(applicationId: $applicationId) {\n      id\n      applicationId\n      type\n      occurredAt\n      subject\n      body\n      direction\n      durationMinutes\n      location\n      createdAt\n      updatedAt\n      createdByMembershipId\n      createdByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdmissionActivities($applicationId: ID!) {\n    admissionActivities(applicationId: $applicationId) {\n      id\n      applicationId\n      type\n      occurredAt\n      subject\n      body\n      direction\n      durationMinutes\n      location\n      createdAt\n      updatedAt\n      createdByMembershipId\n      createdByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionEmails($applicationId: ID!) {\n    admissionEmails(applicationId: $applicationId) {\n      id\n      toEmail\n      toName\n      subject\n      bodyHtml\n      status\n      errorMessage\n      sentAt\n      template {\n        id\n        name\n      }\n      sentByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdmissionEmails($applicationId: ID!) {\n    admissionEmails(applicationId: $applicationId) {\n      id\n      toEmail\n      toName\n      subject\n      bodyHtml\n      status\n      errorMessage\n      sentAt\n      template {\n        id\n        name\n      }\n      sentByMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionReminders($applicationId: ID!) {\n    admissionReminders(applicationId: $applicationId) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      assignedToMembershipId\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n      completedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query AdmissionReminders($applicationId: ID!) {\n    admissionReminders(applicationId: $applicationId) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      assignedToMembershipId\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n      completedAt\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionsKanbanReminders {\n    orgAdmissionReminders(filter: OPEN) {\n      id\n      applicationId\n      dueAt\n    }\n  }\n"): (typeof documents)["\n  query AdmissionsKanbanReminders {\n    orgAdmissionReminders(filter: OPEN) {\n      id\n      applicationId\n      dueAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionsKanbanStages {\n    admissionStages {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      isArchived\n      cardFields\n    }\n  }\n"): (typeof documents)["\n  query AdmissionsKanbanStages {\n    admissionStages {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      isArchived\n      cardFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionsBoardSettings {\n    admissionBoardSettings {\n      tableColumns\n    }\n  }\n"): (typeof documents)["\n  query AdmissionsBoardSettings {\n    admissionBoardSettings {\n      tableColumns\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionsKanbanRejectionReasons {\n    admissionRejectionReasons {\n      id\n      label\n      color\n      position\n    }\n  }\n"): (typeof documents)["\n  query AdmissionsKanbanRejectionReasons {\n    admissionRejectionReasons {\n      id\n      label\n      color\n      position\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionsKanbanApplications {\n    admissionApplications {\n      id\n      admissionStageId\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      status\n      source\n      stageEnteredAt\n      familyId\n      enrolledStudentId\n      desiredGradeLevelId\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n      family {\n        id\n        name\n        contactPersons {\n          id\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdmissionsKanbanApplications {\n    admissionApplications {\n      id\n      admissionStageId\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      status\n      source\n      stageEnteredAt\n      familyId\n      enrolledStudentId\n      desiredGradeLevelId\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n      family {\n        id\n        name\n        contactPersons {\n          id\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionApplicationDetail($id: ID!) {\n    admissionApplicationById(id: $id) {\n      id\n      organizationId\n      admissionStageId\n      status\n      source\n      stageEnteredAt\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      childNotes\n      desiredGradeLevelId\n      desiredSchoolClassId\n      desiredEnrollmentDate\n      enrolledStudentId\n      familyId\n      family {\n        id\n        name\n        notes\n        contactPersons {\n          id\n          salutation\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n          occupation\n        }\n      }\n      admissionStage {\n        id\n        name\n        stageType\n      }\n      desiredSchoolClass {\n        id\n        name\n      }\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n    }\n    admissionAuditLogs(applicationId: $id) {\n      id\n      action\n      createdAt\n      fieldName\n      oldValue\n      newValue\n      fromStage {\n        id\n        name\n      }\n      toStage {\n        id\n        name\n      }\n      actorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n    admissionApplicationsByFamily(\n      familyId: \"00000000-0000-0000-0000-000000000000\"\n    ) @skip(if: true) {\n      id\n    }\n  }\n"): (typeof documents)["\n  query AdmissionApplicationDetail($id: ID!) {\n    admissionApplicationById(id: $id) {\n      id\n      organizationId\n      admissionStageId\n      status\n      source\n      stageEnteredAt\n      position\n      childFirstName\n      childLastName\n      childDateOfBirth\n      childGender\n      childNotes\n      desiredGradeLevelId\n      desiredSchoolClassId\n      desiredEnrollmentDate\n      enrolledStudentId\n      familyId\n      family {\n        id\n        name\n        notes\n        contactPersons {\n          id\n          salutation\n          firstName\n          lastName\n          email\n          phone\n          mobile\n          roles\n          occupation\n        }\n      }\n      admissionStage {\n        id\n        name\n        stageType\n      }\n      desiredSchoolClass {\n        id\n        name\n      }\n      desiredGradeLevel {\n        id\n        name\n        color\n      }\n    }\n    admissionAuditLogs(applicationId: $id) {\n      id\n      action\n      createdAt\n      fieldName\n      oldValue\n      newValue\n      fromStage {\n        id\n        name\n      }\n      toStage {\n        id\n        name\n      }\n      actorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n    admissionApplicationsByFamily(\n      familyId: \"00000000-0000-0000-0000-000000000000\"\n    ) @skip(if: true) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionApplicationSiblings($familyId: ID!) {\n    admissionApplicationsByFamily(familyId: $familyId) {\n      id\n      childFirstName\n      childLastName\n      childDateOfBirth\n      status\n      admissionStage {\n        id\n        name\n        color\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdmissionApplicationSiblings($familyId: ID!) {\n    admissionApplicationsByFamily(familyId: $familyId) {\n      id\n      childFirstName\n      childLastName\n      childDateOfBirth\n      status\n      admissionStage {\n        id\n        name\n        color\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OrgAdmissionReminders($filter: AdmissionReminderFilter) {\n    orgAdmissionReminders(filter: $filter) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      completedAt\n      application {\n        id\n        childFirstName\n        childLastName\n      }\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query OrgAdmissionReminders($filter: AdmissionReminderFilter) {\n    orgAdmissionReminders(filter: $filter) {\n      id\n      applicationId\n      dueAt\n      title\n      note\n      completedAt\n      application {\n        id\n        childFirstName\n        childLastName\n      }\n      assignedToMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n"): (typeof documents)["\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdmissionsEnrollmentClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdmissionsEnrollmentClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MoveAdmissionApplication($input: MoveAdmissionApplicationInput!) {\n    moveAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      position\n      stageEnteredAt\n    }\n  }\n"): (typeof documents)["\n  mutation MoveAdmissionApplication($input: MoveAdmissionApplicationInput!) {\n    moveAdmissionApplication(input: $input) {\n      id\n      admissionStageId\n      position\n      stageEnteredAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResendAdmissionEmail($id: ID!) {\n    resendAdmissionEmail(id: $id) {\n      id\n      status\n      errorMessage\n    }\n  }\n"): (typeof documents)["\n  mutation ResendAdmissionEmail($id: ID!) {\n    resendAdmissionEmail(id: $id) {\n      id\n      status\n      errorMessage\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAdmissionEmail($id: ID!) {\n    deleteAdmissionEmail(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAdmissionEmail($id: ID!) {\n    deleteAdmissionEmail(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAdmissionReminder($input: CreateAdmissionReminderInput!) {\n    createAdmissionReminder(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAdmissionReminder($input: CreateAdmissionReminderInput!) {\n    createAdmissionReminder(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAdmissionReminder($input: UpdateAdmissionReminderInput!) {\n    updateAdmissionReminder(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAdmissionReminder($input: UpdateAdmissionReminderInput!) {\n    updateAdmissionReminder(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteAdmissionReminder($id: ID!) {\n    completeAdmissionReminder(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CompleteAdmissionReminder($id: ID!) {\n    completeAdmissionReminder(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UncompleteAdmissionReminder($id: ID!) {\n    uncompleteAdmissionReminder(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UncompleteAdmissionReminder($id: ID!) {\n    uncompleteAdmissionReminder(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAdmissionReminder($id: ID!) {\n    deleteAdmissionReminder(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAdmissionReminder($id: ID!) {\n    deleteAdmissionReminder(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PreviewAdmissionEmail($applicationId: ID!, $templateId: ID!) {\n    previewAdmissionEmail(\n      applicationId: $applicationId\n      templateId: $templateId\n    ) {\n      subject\n      bodyHtml\n      toEmail\n      toName\n      availableVariables\n    }\n  }\n"): (typeof documents)["\n  query PreviewAdmissionEmail($applicationId: ID!, $templateId: ID!) {\n    previewAdmissionEmail(\n      applicationId: $applicationId\n      templateId: $templateId\n    ) {\n      subject\n      bodyHtml\n      toEmail\n      toName\n      availableVariables\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderAdmissionApplications(\n    $input: ReorderAdmissionApplicationsInput!\n  ) {\n    reorderAdmissionApplications(input: $input) {\n      id\n      position\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderAdmissionApplications(\n    $input: ReorderAdmissionApplicationsInput!\n  ) {\n    reorderAdmissionApplications(input: $input) {\n      id\n      position\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendAdmissionEmail($input: SendAdmissionEmailInput!) {\n    sendAdmissionEmail(input: $input) {\n      id\n      status\n      errorMessage\n    }\n  }\n"): (typeof documents)["\n  mutation SendAdmissionEmail($input: SendAdmissionEmailInput!) {\n    sendAdmissionEmail(input: $input) {\n      id\n      status\n      errorMessage\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAdmissionStage($input: CreateAdmissionStageInput!) {\n    createAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAdmissionStage($input: CreateAdmissionStageInput!) {\n    createAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAdmissionStage($input: UpdateAdmissionStageInput!) {\n    updateAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAdmissionStage($input: UpdateAdmissionStageInput!) {\n    updateAdmissionStage(input: $input) {\n      id\n      name\n      slug\n      color\n      position\n      stageType\n      isDefault\n      cardFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveAdmissionStage($id: ID!) {\n    archiveAdmissionStage(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveAdmissionStage($id: ID!) {\n    archiveAdmissionStage(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderAdmissionStages($input: ReorderAdmissionStagesInput!) {\n    reorderAdmissionStages(input: $input) {\n      id\n      position\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderAdmissionStages($input: ReorderAdmissionStagesInput!) {\n    reorderAdmissionStages(input: $input) {\n      id\n      position\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAdmissionActivity($input: UpdateAdmissionActivityInput!) {\n    updateAdmissionActivity(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAdmissionActivity($input: UpdateAdmissionActivityInput!) {\n    updateAdmissionActivity(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAdmissionApplication(\n    $input: UpdateAdmissionApplicationInput!\n  ) {\n    updateAdmissionApplication(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAdmissionApplication(\n    $input: UpdateAdmissionApplicationInput!\n  ) {\n    updateAdmissionApplication(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuthUserIdByUserId($userId: ID!) {\n    authUserIdByUserId(userId: $userId)\n  }\n"): (typeof documents)["\n  query AuthUserIdByUserId($userId: ID!) {\n    authUserIdByUserId(userId: $userId)\n  }\n"];
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
export function graphql(source: "\n  mutation DeleteCountryInputTemplate($id: ID!) {\n    deleteCountryInputTemplate(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCountryInputTemplate($id: ID!) {\n    deleteCountryInputTemplate(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CountryInputTemplates {\n    countryInputTemplates {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n"): (typeof documents)["\n  query CountryInputTemplates {\n    countryInputTemplates {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertCountryInputTemplate(\n    $input: UpsertCountryInputTemplateInput!\n  ) {\n    upsertCountryInputTemplate(input: $input) {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertCountryInputTemplate(\n    $input: UpsertCountryInputTemplateInput!\n  ) {\n    upsertCountryInputTemplate(input: $input) {\n      id\n      countryCode\n      fieldType\n      mask\n      placeholder\n      maxLength\n      regex\n      prefix\n      validatorKind\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurriculumNodes(\n    $curriculumId: ID!\n    $levelId: ID!\n    $includeArchived: Boolean\n  ) {\n    curriculumNodes(\n      curriculumId: $curriculumId\n      levelId: $levelId\n      includeArchived: $includeArchived\n    ) {\n      id\n      curriculumId\n      levelId\n      parentId\n      nodeType\n      position\n      isArchived\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n        notes\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation UpdateLessonClassification($input: UpdateCurriculumNodeInput!) {\n    updateCurriculumNode(input: $input) {\n      id\n      lessonType\n      lessonScale\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateLessonClassification($input: UpdateCurriculumNodeInput!) {\n    updateCurriculumNode(input: $input) {\n      id\n      lessonType\n      lessonScale\n    }\n  }\n"];
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
export function graphql(source: "\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {\n    createEmailTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {\n    createEmailTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmailTemplate($input: UpdateEmailTemplateInput!) {\n    updateEmailTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmailTemplate($input: UpdateEmailTemplateInput!) {\n    updateEmailTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmailTemplate($id: ID!) {\n    deleteEmailTemplate(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmailTemplate($id: ID!) {\n    deleteEmailTemplate(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveEmployeeAbsenceCategory($id: ID!) {\n    archiveEmployeeAbsenceCategory(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveEmployeeAbsenceCategory($id: ID!) {\n    archiveEmployeeAbsenceCategory(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployeeAbsenceCategory(\n    $input: CreateEmployeeAbsenceCategoryInput!\n  ) {\n    createEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployeeAbsenceCategory(\n    $input: CreateEmployeeAbsenceCategoryInput!\n  ) {\n    createEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeAbsenceCategoriesByOrgIdFull {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeAbsenceCategoriesByOrgIdFull {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeAbsenceCategoryById($id: ID!) {\n    employeeAbsenceCategoryById(id: $id) {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeAbsenceCategoryById($id: ID!) {\n    employeeAbsenceCategoryById(id: $id) {\n      id\n      systemCode\n      isSystem\n      isActive\n      countsAsWorkTime\n      isPaid\n      affectsVacationBalance\n      defaultIsVacationCapable\n      reducesVacationEntitlementAfterDays\n      requiresCertificate\n      certificateRequiredFromDay\n      maxDaysPerYear\n      defaultPercentage\n      requiresApproval\n      color\n      iconName\n      sortOrder\n      translations {\n        locale\n        name\n        description\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderEmployeeAbsenceCategories($ids: [ID!]!) {\n    reorderEmployeeAbsenceCategories(ids: $ids) {\n      id\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderEmployeeAbsenceCategories($ids: [ID!]!) {\n    reorderEmployeeAbsenceCategories(ids: $ids) {\n      id\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetEmployeeAbsenceCategoryActive($id: ID!, $isActive: Boolean!) {\n    setEmployeeAbsenceCategoryActive(id: $id, isActive: $isActive) {\n      id\n      isActive\n    }\n  }\n"): (typeof documents)["\n  mutation SetEmployeeAbsenceCategoryActive($id: ID!, $isActive: Boolean!) {\n    setEmployeeAbsenceCategoryActive(id: $id, isActive: $isActive) {\n      id\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmployeeAbsenceCategory(\n    $input: UpdateEmployeeAbsenceCategoryInput!\n  ) {\n    updateEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmployeeAbsenceCategory(\n    $input: UpdateEmployeeAbsenceCategoryInput!\n  ) {\n    updateEmployeeAbsenceCategory(input: $input) {\n      id\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgInsuranceNumber\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgInsuranceNumber\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      sortOrder\n    }\n  }\n"];
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
export function graphql(source: "\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      bvgProvider\n      bvgContactPhone\n      uvgProvider\n      uvgContactPhone\n      dailySicknessProvider\n      dailySicknessContactPhone\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Organization($id: String!) {\n    organization(id: $id) {\n      id\n      name\n      subdomain\n      domain\n      street\n      zip\n      city\n      country\n      phone\n      email\n      website\n      timezone\n      latitude\n      longitude\n      isActive\n      bvgProvider\n      bvgContactPhone\n      uvgProvider\n      uvgContactPhone\n      dailySicknessProvider\n      dailySicknessContactPhone\n      createdAt\n      updatedAt\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      sortOrder\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      isArchived\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddProjectMember($input: AddProjectMemberInput!) {\n    addProjectMember(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddProjectMember($input: AddProjectMemberInput!) {\n    addProjectMember(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {\n    updateProjectMemberRole(input: $input) {\n      id\n      role\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {\n    updateProjectMemberRole(input: $input) {\n      id\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveProjectMember($id: ID!) {\n    removeProjectMember(id: $id)\n  }\n"): (typeof documents)["\n  mutation RemoveProjectMember($id: ID!) {\n    removeProjectMember(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MoveTask($input: MoveTaskInput!) {\n    moveTask(input: $input) {\n      id\n      status\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation MoveTask($input: MoveTaskInput!) {\n    moveTask(input: $input) {\n      id\n      status\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTaskStatus($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTaskStatus($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRecordKeepingSettings {\n    recordKeepingSettings {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n"): (typeof documents)["\n  query GetRecordKeepingSettings {\n    recordKeepingSettings {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateRecordKeepingSettings(\n    $input: UpdateRecordKeepingSettingsInput!\n  ) {\n    updateRecordKeepingSettings(input: $input) {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateRecordKeepingSettings(\n    $input: UpdateRecordKeepingSettingsInput!\n  ) {\n    updateRecordKeepingSettings(input: $input) {\n      introducedStuckDays\n      practicedStuckDays\n      bigGapDays\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateLessonRecordsBulk($input: CreateLessonRecordsBulkInput!) {\n    createLessonRecordsBulk(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n"): (typeof documents)["\n  mutation CreateLessonRecordsBulk($input: CreateLessonRecordsBulkInput!) {\n    createLessonRecordsBulk(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAreaLessonCounts {\n    areaLessonCountsByOrg {\n      areaId\n      lessonCount\n      curriculumId\n      curriculumName\n    }\n  }\n"): (typeof documents)["\n  query GetAreaLessonCounts {\n    areaLessonCountsByOrg {\n      areaId\n      lessonCount\n      curriculumId\n      curriculumName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ClassroomAttention($schoolClassId: ID!, $locale: String!) {\n    classroomAttentionSummaries(\n      schoolClassId: $schoolClassId\n      locale: $locale\n    ) {\n      studentId\n      firstName\n      lastName\n      totalSignals\n      byReason {\n        NEEDS_MORE_CURRENT\n        REPEATED_NEEDS_MORE\n        STUCK_PRACTICED\n        STUCK_INTRODUCED\n        BIG_GAP_INTRO_TO_PRACTICED\n      }\n      topItems {\n        lessonId\n        lessonName\n        reason\n        severity\n        days\n        since\n        ancestors {\n          id\n          nodeType\n          translations {\n            locale\n            name\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ClassroomAttention($schoolClassId: ID!, $locale: String!) {\n    classroomAttentionSummaries(\n      schoolClassId: $schoolClassId\n      locale: $locale\n    ) {\n      studentId\n      firstName\n      lastName\n      totalSignals\n      byReason {\n        NEEDS_MORE_CURRENT\n        REPEATED_NEEDS_MORE\n        STUCK_PRACTICED\n        STUCK_INTRODUCED\n        BIG_GAP_INTRO_TO_PRACTICED\n      }\n      topItems {\n        lessonId\n        lessonName\n        reason\n        severity\n        days\n        since\n        ancestors {\n          id\n          nodeType\n          translations {\n            locale\n            name\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ClassroomEngagementTimeline(\n    $schoolClassId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    classroomEngagementTimeline(\n      schoolClassId: $schoolClassId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        focused\n        interested\n        mechanical\n        resistant\n        total\n      }\n      totalObserved\n    }\n  }\n"): (typeof documents)["\n  query ClassroomEngagementTimeline(\n    $schoolClassId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    classroomEngagementTimeline(\n      schoolClassId: $schoolClassId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        focused\n        interested\n        mechanical\n        resistant\n        total\n      }\n      totalObserved\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ClassroomHeatmapData($schoolClassId: ID!, $locale: String!) {\n    classroomHeatmapData(schoolClassId: $schoolClassId, locale: $locale) {\n      students {\n        studentId\n        firstName\n        lastName\n      }\n      areas {\n        areaId\n        areaName\n      }\n      cells {\n        studentId\n        areaId\n        status\n        count\n      }\n    }\n  }\n"): (typeof documents)["\n  query ClassroomHeatmapData($schoolClassId: ID!, $locale: String!) {\n    classroomHeatmapData(schoolClassId: $schoolClassId, locale: $locale) {\n      students {\n        studentId\n        firstName\n        lastName\n      }\n      areas {\n        areaId\n        areaName\n      }\n      cells {\n        studentId\n        areaId\n        status\n        count\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetLessonPrerequisites($lessonId: ID!) {\n    lessonPrerequisites(lessonId: $lessonId) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetLessonPrerequisites($lessonId: ID!) {\n    lessonPrerequisites(lessonId: $lessonId) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetLessonsForRecordKeeping {\n    lessonsByOrg(includeArchived: false) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n      ancestors {\n        id\n        nodeType\n        position\n        translations {\n          locale\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetLessonsForRecordKeeping {\n    lessonsByOrg(includeArchived: false) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n      ancestors {\n        id\n        nodeType\n        position\n        translations {\n          locale\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NextLessonsForStudent($studentId: ID!, $limit: Int) {\n    nextLessonsForStudent(studentId: $studentId, limit: $limit) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query NextLessonsForStudent($studentId: ID!, $limit: Int) {\n    nextLessonsForStudent(studentId: $studentId, limit: $limit) {\n      id\n      position\n      lessonType\n      lessonScale\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrgAreas {\n    areasByOrg(includeArchived: false) {\n      id\n      position\n      nodeType\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetOrgAreas {\n    areasByOrg(includeArchived: false) {\n      id\n      position\n      nodeType\n      translations {\n        locale\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetStudentLessonRecords($filter: LessonRecordsFilterInput) {\n    lessonRecords(filter: $filter) {\n      id\n      lessonId\n      recordedAt\n      status\n      note\n      engagement\n      difficulty\n      socialForm\n      selfAssessment\n      selfAssessmentByChild\n      lessonClarityConfirmed\n      selfConfidence\n      persistence\n      concentration\n      lesson {\n        id\n        position\n        translations {\n          locale\n          name\n        }\n        ancestors {\n          id\n          nodeType\n          position\n          translations {\n            locale\n            name\n          }\n        }\n      }\n      recordedBy {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetStudentLessonRecords($filter: LessonRecordsFilterInput) {\n    lessonRecords(filter: $filter) {\n      id\n      lessonId\n      recordedAt\n      status\n      note\n      engagement\n      difficulty\n      socialForm\n      selfAssessment\n      selfAssessmentByChild\n      lessonClarityConfirmed\n      selfConfidence\n      persistence\n      concentration\n      lesson {\n        id\n        position\n        translations {\n          locale\n          name\n        }\n        ancestors {\n          id\n          nodeType\n          position\n          translations {\n            locale\n            name\n          }\n        }\n      }\n      recordedBy {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query StudentLessonRecordTimeline(\n    $studentId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    studentLessonRecordTimeline(\n      studentId: $studentId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        planning\n        introduced\n        practiced\n        mastered\n        needsMore\n        total\n      }\n      totalIntroductionsInRange\n      daysSinceLastIntroduction\n    }\n  }\n"): (typeof documents)["\n  query StudentLessonRecordTimeline(\n    $studentId: ID!\n    $from: String!\n    $to: String!\n    $granularity: TimelineGranularity!\n  ) {\n    studentLessonRecordTimeline(\n      studentId: $studentId\n      from: $from\n      to: $to\n      granularity: $granularity\n    ) {\n      buckets {\n        bucketStart\n        planning\n        introduced\n        practiced\n        mastered\n        needsMore\n        total\n      }\n      totalIntroductionsInRange\n      daysSinceLastIntroduction\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetLessonPrerequisites($input: SetLessonPrerequisitesInput!) {\n    setLessonPrerequisites(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation SetLessonPrerequisites($input: SetLessonPrerequisitesInput!) {\n    setLessonPrerequisites(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateLessonRecord($input: UpdateLessonRecordInput!) {\n    updateLessonRecord(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateLessonRecord($input: UpdateLessonRecordInput!) {\n    updateLessonRecord(input: $input) {\n      id\n      studentId\n      lessonId\n      recordedAt\n      status\n      note\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetMyTeachingSchoolClasses {\n    myTeachingSchoolClasses {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetMyTeachingSchoolClasses {\n    myTeachingSchoolClasses {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {\n    updateSchoolClass(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateStudentNote(\n    $createStudentNoteInput: CreateStudentNoteInput!\n  ) {\n    createStudentNote(createStudentNoteInput: $createStudentNoteInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateStudentNote(\n    $createStudentNoteInput: CreateStudentNoteInput!\n  ) {\n    createStudentNote(createStudentNoteInput: $createStudentNoteInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetStudentNotesByStudentId($studentId: ID!) {\n    studentNotesByStudentId(studentId: $studentId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetStudentNotesByStudentId($studentId: ID!) {\n    studentNotesByStudentId(studentId: $studentId) {\n      id\n      category\n      title\n      content\n      isConfidential\n      date\n      createdAt\n      authorMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query KanbanSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      color\n      maxCapacity\n      sortOrder\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query KanbanSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      color\n      maxCapacity\n      sortOrder\n      isActive\n      gradeLevels {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query KanbanUnassignedStudents {\n    unassignedStudents {\n      id\n      firstName\n      lastName\n    }\n  }\n"): (typeof documents)["\n  query KanbanUnassignedStudents {\n    unassignedStudents {\n      id\n      firstName\n      lastName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query KanbanClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"): (typeof documents)["\n  query KanbanClassroomStudents($schoolClassId: ID!) {\n    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {\n      id\n      student {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TransferStudent($input: TransferStudentInput!) {\n    transferStudentToSchoolClass(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation TransferStudent($input: TransferStudentInput!) {\n    transferStudentToSchoolClass(input: $input) {\n      id\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      exitDate\n      isActive\n      currentClass {\n        id\n        name\n        color\n        gradeLevels {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetStudents {\n    studentsByOrgId {\n      id\n      firstName\n      lastName\n      dateOfBirth\n      gender\n      exitDate\n      isActive\n      currentClass {\n        id\n        name\n        color\n        gradeLevels {\n          id\n          name\n          color\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n"): (typeof documents)["\n  mutation AddTeamMember($input: CreateTeamMemberInput!) {\n    createTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTeam($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      role\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      role\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n"): (typeof documents)["\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n"): (typeof documents)["\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      persona\n      isSuperAdmin\n    }\n  }\n"): (typeof documents)["\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      persona\n      isSuperAdmin\n    }\n  }\n"];
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