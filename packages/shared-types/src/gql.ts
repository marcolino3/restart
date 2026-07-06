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
    "\n  query AccessReview {\n    accessReview {\n      membershipId\n      memberName\n      roles\n      sensitivePermissions\n      lastReviewedAt\n    }\n  }\n": typeof types.AccessReviewDocument,
    "\n  mutation RecertifyAccess($membershipId: ID!, $note: String) {\n    recertifyAccess(membershipId: $membershipId, note: $note)\n  }\n": typeof types.RecertifyAccessDocument,
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
    "\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      followUpYear\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n": typeof types.RejectedAdmissionApplicationsDocument,
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
    "\n  mutation ArchiveConsentPurpose($id: ID!) {\n    archiveConsentPurpose(id: $id)\n  }\n": typeof types.ArchiveConsentPurposeDocument,
    "\n  query ConsentPurposes($includeArchived: Boolean) {\n    consentPurposes(includeArchived: $includeArchived) {\n      id\n      name\n      slug\n      description\n      appliesTo\n      legalBasis\n      requiresEvidence\n      isMandatory\n      position\n      isArchived\n    }\n  }\n": typeof types.ConsentPurposesDocument,
    "\n  query ConsentsForSubject(\n    $subjectType: ConsentSubjectType!\n    $subjectId: ID!\n  ) {\n    consentsForSubject(subjectType: $subjectType, subjectId: $subjectId) {\n      id\n      subjectType\n      subjectId\n      purposeId\n      status\n      grantedByContactPersonId\n      decidedAt\n      withdrawnAt\n      evidenceUrl\n      note\n      purpose {\n        id\n        name\n        slug\n      }\n    }\n  }\n": typeof types.ConsentsForSubjectDocument,
    "\n  mutation RecordConsent($input: RecordConsentInput!) {\n    recordConsent(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.RecordConsentDocument,
    "\n  mutation CreateConsentPurpose($input: CreateConsentPurposeInput!) {\n    createConsentPurpose(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateConsentPurposeDocument,
    "\n  mutation UpdateConsentPurpose($input: UpdateConsentPurposeInput!) {\n    updateConsentPurpose(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateConsentPurposeDocument,
    "\n  mutation WithdrawConsent($input: WithdrawConsentInput!) {\n    withdrawConsent(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.WithdrawConsentDocument,
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
    "\n  mutation CreateDataBreach($input: CreateDataBreachInput!) {\n    createDataBreach(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateDataBreachDocument,
    "\n  query DataBreaches($status: DataBreachStatus) {\n    dataBreaches(status: $status) {\n      id\n      title\n      description\n      detectedAt\n      status\n      riskLevel\n      affectedScope\n      affectedCount\n      authorityNotifiedAt\n      subjectsNotifiedAt\n      measures\n      closedAt\n      notes\n      authorityNotificationDueAt\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.DataBreachesDocument,
    "\n  mutation UpdateDataBreach($input: UpdateDataBreachInput!) {\n    updateDataBreach(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.UpdateDataBreachDocument,
    "\n  mutation CreateDataSubjectRequest($input: CreateDataSubjectRequestInput!) {\n    createDataSubjectRequest(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateDataSubjectRequestDocument,
    "\n  query DataSubjectRequests($status: DataSubjectRequestStatus) {\n    dataSubjectRequests(status: $status) {\n      id\n      type\n      status\n      subjectType\n      subjectId\n      subjectName\n      contactEmail\n      receivedAt\n      dueDate\n      resolvedAt\n      resolutionNote\n      notes\n      assigneeMembershipId\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.DataSubjectRequestsDocument,
    "\n  query DataSubjectExport($subjectType: DataSubjectType!, $subjectId: ID!) {\n    dataSubjectExport(subjectType: $subjectType, subjectId: $subjectId)\n  }\n": typeof types.DataSubjectExportDocument,
    "\n  mutation UpdateDataSubjectRequest($input: UpdateDataSubjectRequestInput!) {\n    updateDataSubjectRequest(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.UpdateDataSubjectRequestDocument,
    "\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      isAutomatic\n      sentCount\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.EmailTemplatesDocument,
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
    "\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      documentUrl\n      isActive\n    }\n  }\n": typeof types.EmployeeContractsByEmployeeIdDocument,
    "\n  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {\n    createEmployeeContract(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeContractDocument,
    "\n  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {\n    updateEmployeeContract(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeeContractDocument,
    "\n  mutation DeleteEmployeeContract($id: ID!) {\n    deleteEmployeeContract(id: $id)\n  }\n": typeof types.DeleteEmployeeContractDocument,
    "\n  mutation UpsertEmployeeOnboardingDraft($input: EmployeeOnboardingInput!) {\n    upsertEmployeeOnboardingDraft(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n": typeof types.UpsertEmployeeOnboardingDraftDocument,
    "\n  mutation FinalizeEmployeeOnboarding($input: FinalizeEmployeeOnboardingInput!) {\n    finalizeEmployeeOnboarding(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n": typeof types.FinalizeEmployeeOnboardingDocument,
    "\n  mutation SendEmployeeInvitation($employeeId: ID!) {\n    sendEmployeeInvitation(employeeId: $employeeId) {\n      id\n      invitationStatus\n    }\n  }\n": typeof types.SendEmployeeInvitationDocument,
    "\n  query GetEmployeeAuditLog($employeeId: ID!) {\n    employeeAuditLog(employeeId: $employeeId) {\n      id\n      createdAt\n      entityType\n      fieldName\n      oldValue\n      newValue\n      actorMembershipId\n      actorMembership {\n        id\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeeAuditLogDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      timeTrackingEnabled\n      membership {\n        id\n        persona\n        contactPhone\n        user {\n          id\n          title\n          firstName\n          lastName\n          dateOfBirth\n          socialSecurityNumber\n          street\n          houseNumber\n          addressLine2\n          postalCode\n          city\n          country\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        organization {\n          id\n          name\n        }\n        roles {\n          id\n          name\n          systemCode\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeeByIdDocument,
    "\n  query GetEmployeeEmergencyProfile($employeeId: ID!) {\n    employeeEmergencyProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      contact1Name\n      contact1Relationship\n      contact1Phone\n      contact1Email\n      contact2Name\n      contact2Relationship\n      contact2Phone\n      contact2Email\n      bloodType\n      allergies\n      chronicConditions\n      emergencyMedications\n      primaryDoctorName\n      primaryDoctorPhone\n      pharmacyName\n    }\n  }\n": typeof types.GetEmployeeEmergencyProfileDocument,
    "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgInsuranceNumber\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n": typeof types.GetEmployeeHrProfileDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      workloadPercent\n      timeBalanceMinutes\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n          status\n          invitationStatus\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetEmployeesDocument,
    "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeeDocument,
    "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeeEmergencyProfileDocument,
    "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeeHrProfileDocument,
    "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n": typeof types.CreateGradeLevelDocument,
    "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n": typeof types.DeleteGradeLevelDocument,
    "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n      classCount\n      studentCount\n    }\n  }\n": typeof types.GetGradeLevelsDocument,
    "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.ReorderGradeLevelsDocument,
    "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n": typeof types.UpdateGradeLevelDocument,
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
    "\n  mutation AddTaskNote($input: AddTaskNoteInput!) {\n    addTaskNote(input: $input) {\n      id\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n    }\n  }\n": typeof types.AddTaskNoteDocument,
    "\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n": typeof types.ArchiveProjectDocument,
    "\n  mutation CreateProjectFromTemplate($input: CreateProjectFromTemplateInput!) {\n    createProjectFromTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProjectFromTemplateDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProjectDocument,
    "\n  mutation CreateTasksFromProtocol($input: CreateTasksFromProtocolInput!) {\n    createTasksFromProtocol(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateTasksFromProtocolDocument,
    "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n": typeof types.DeleteProjectDocument,
    "\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      protocol {\n        id\n        title\n      }\n      admissionApplicationId\n      admissionApplication {\n        id\n        childFirstName\n        childLastName\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.MyTasksDocument,
    "\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n        isSuperAdmin\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n": typeof types.MembershipsByOrgIdDocument,
    "\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      protocol {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.TasksByProjectDocument,
    "\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.ProjectByIdDocument,
    "\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.MyProjectsDocument,
    "\n  query TasksByProtocol($protocolId: ID!) {\n    tasksByProtocol(protocolId: $protocolId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      project {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": typeof types.TasksByProtocolDocument,
    "\n  query ProtocolTemplatesByOrg {\n    protocolTemplatesByOrg {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n": typeof types.ProtocolTemplatesByOrgDocument,
    "\n  query ProtocolById($id: ID!) {\n    protocolById(id: $id) {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      projectId\n      externalParticipants\n      createdByMembershipId\n      createdBy {\n        userId\n      }\n      project {\n        id\n        title\n      }\n      participants {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n      sections {\n        agendaItems {\n          no\n          topic\n          goal\n        }\n        decisions {\n          topic\n          decision\n          responsible\n          dueDate\n        }\n        communications {\n          topic\n          audience\n          responsible\n          channel\n          dueDate\n        }\n        infoPoints\n        challenges {\n          topic\n          challenge\n          supportNeeded\n        }\n        openPoints {\n          topic\n          nextStep\n          forNextMeeting\n        }\n      }\n    }\n  }\n": typeof types.ProtocolByIdDocument,
    "\n  query ProtocolsByOrg {\n    protocolsByOrg {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      project {\n        id\n        title\n      }\n      participants {\n        id\n      }\n    }\n  }\n": typeof types.ProtocolsByOrgDocument,
    "\n  query ProjectTemplateById($id: ID!) {\n    projectTemplateById(id: $id) {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n        title\n        description\n        priority\n        sortOrder\n        dueOffsetDays\n      }\n    }\n  }\n": typeof types.ProjectTemplateByIdDocument,
    "\n  query ProjectTemplates {\n    projectTemplates {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n      }\n    }\n  }\n": typeof types.ProjectTemplatesDocument,
    "\n  mutation AddProjectMember($input: AddProjectMemberInput!) {\n    addProjectMember(input: $input) {\n      id\n    }\n  }\n": typeof types.AddProjectMemberDocument,
    "\n  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {\n    updateProjectMemberRole(input: $input) {\n      id\n      role\n    }\n  }\n": typeof types.UpdateProjectMemberRoleDocument,
    "\n  mutation RemoveProjectMember($id: ID!) {\n    removeProjectMember(id: $id)\n  }\n": typeof types.RemoveProjectMemberDocument,
    "\n  mutation CreateProtocolTemplate($input: CreateProtocolTemplateInput!) {\n    createProtocolTemplate(input: $input) {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n": typeof types.CreateProtocolTemplateDocument,
    "\n  mutation UpdateProtocolTemplate($input: UpdateProtocolTemplateInput!) {\n    updateProtocolTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateProtocolTemplateDocument,
    "\n  mutation DeleteProtocolTemplate($id: ID!) {\n    deleteProtocolTemplate(id: $id)\n  }\n": typeof types.DeleteProtocolTemplateDocument,
    "\n  mutation SaveProtocolAsTemplate($input: SaveProtocolAsTemplateInput!) {\n    saveProtocolAsTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.SaveProtocolAsTemplateDocument,
    "\n  mutation CreateProtocol($input: CreateProtocolInput!) {\n    createProtocol(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProtocolDocument,
    "\n  mutation UpdateProtocol($input: UpdateProtocolInput!) {\n    updateProtocol(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateProtocolDocument,
    "\n  mutation DeleteProtocol($id: ID!) {\n    deleteProtocol(id: $id)\n  }\n": typeof types.DeleteProtocolDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateTaskDocument,
    "\n  mutation UpdateTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateTaskDocument,
    "\n  mutation MoveTask($input: MoveTaskInput!) {\n    moveTask(input: $input) {\n      id\n      status\n      sortOrder\n    }\n  }\n": typeof types.MoveTaskDocument,
    "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n": typeof types.DeleteTaskDocument,
    "\n  mutation CreateProjectTemplate($input: CreateProjectTemplateInput!) {\n    createProjectTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProjectTemplateDocument,
    "\n  mutation UpdateProjectTemplate($input: UpdateProjectTemplateInput!) {\n    updateProjectTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateProjectTemplateDocument,
    "\n  mutation DeleteProjectTemplate($id: ID!) {\n    deleteProjectTemplate(id: $id)\n  }\n": typeof types.DeleteProjectTemplateDocument,
    "\n  mutation CreatePersonalTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n": typeof types.CreatePersonalTaskDocument,
    "\n  mutation UpdatePersonalTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdatePersonalTaskDocument,
    "\n  mutation ReorderMyTasks($orderedTaskIds: [ID!]!) {\n    reorderMyTasks(orderedTaskIds: $orderedTaskIds)\n  }\n": typeof types.ReorderMyTasksDocument,
    "\n  mutation SaveProjectAsTemplate($input: SaveProjectAsTemplateInput!) {\n    saveProjectAsTemplate(input: $input) {\n      id\n    }\n  }\n": typeof types.SaveProjectAsTemplateDocument,
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
    "\n  mutation DeleteRetentionPolicy($id: ID!) {\n    deleteRetentionPolicy(id: $id)\n  }\n": typeof types.DeleteRetentionPolicyDocument,
    "\n  mutation ExecutePurgeCandidate($id: ID!) {\n    executePurgeCandidate(id: $id)\n  }\n": typeof types.ExecutePurgeCandidateDocument,
    "\n  query PurgeCandidates {\n    purgeCandidates {\n      id\n      entityType\n      subjectLabel\n      dueSince\n      action\n      status\n      reviewedAt\n      executedAt\n      note\n    }\n  }\n": typeof types.PurgeCandidatesDocument,
    "\n  query RetentionPolicies {\n    retentionPolicies {\n      id\n      entityType\n      retentionMonths\n      action\n      description\n      isEnabled\n      dueCount\n    }\n  }\n": typeof types.RetentionPoliciesDocument,
    "\n  mutation ReviewPurgeCandidate($id: ID!, $approve: Boolean!) {\n    reviewPurgeCandidate(id: $id, approve: $approve)\n  }\n": typeof types.ReviewPurgeCandidateDocument,
    "\n  mutation ScanRetention {\n    scanRetention\n  }\n": typeof types.ScanRetentionDocument,
    "\n  mutation UpsertRetentionPolicy($input: UpsertRetentionPolicyInput!) {\n    upsertRetentionPolicy(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertRetentionPolicyDocument,
    "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n": typeof types.GetPermissionsDocument,
    "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n": typeof types.GetRolesByOrgIdDocument,
    "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n": typeof types.UpdateRolePermissionsDocument,
    "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateSchoolClassDocument,
    "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n": typeof types.DeleteSchoolClassDocument,
    "\n  query GetMyTeachingSchoolClasses {\n    myTeachingSchoolClasses {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetMyTeachingSchoolClassesDocument,
    "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": typeof types.GetSchoolClassByIdDocument,
    "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n        ageMin\n        ageMax\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      enrolledCount\n      isActive\n    }\n  }\n": typeof types.GetSchoolClassesDocument,
    "\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": typeof types.GetTeachersByOrgIdDocument,
    "\n  mutation ReorderSchoolClasses($input: ReorderSchoolClassesInput!) {\n    reorderSchoolClasses(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": typeof types.ReorderSchoolClassesDocument,
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
    "\n  query GetAllTeamMembers {\n    teamMembersByOrgId {\n      id\n      role\n      team {\n        id\n      }\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetAllTeamMembersDocument,
    "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.GetTeamByIdDocument,
    "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      role\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetTeamMembersDocument,
    "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": typeof types.GetTeamsDocument,
    "\n  mutation MoveTeamMember($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": typeof types.MoveTeamMemberDocument,
    "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n": typeof types.RemoveTeamMemberDocument,
    "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": typeof types.ReorderTeamsDocument,
    "\n  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": typeof types.UpdateTeamMemberRoleDocument,
    "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n": typeof types.UpdateTeamDocument,
    "\n  query MyEmployeeId {\n    myEmployeeId\n  }\n": typeof types.MyEmployeeIdDocument,
    "\n  query MyTimeTracking($employeeId: ID!, $from: String!, $to: String!) {\n    myWorkTimeBalance(from: $from, to: $to) {\n      employeeId\n      fromDate\n      toDate\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      actualMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    myVacationBalance(from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    myMissingRecordDays(from: $from, to: $to)\n    timeTrackingByEmployeeId(employeeId: $employeeId, from: $from, to: $to) {\n      id\n      startedAt\n      endedAt\n      breakMinutes\n      workMinutes\n      notes\n      entryDate\n      source\n    }\n  }\n": typeof types.MyTimeTrackingDocument,
    "\n  query TeamOverview($from: String!, $to: String!) {\n    teamWorkTimeOverview(from: $from, to: $to) {\n      employeeId\n      employeeName\n      netBalanceMinutes\n      vacationDaysUsed\n    }\n  }\n": typeof types.TeamOverviewDocument,
    "\n  query EmployeeReport(\n    $employeeId: ID!\n    $from: String!\n    $to: String!\n    $locale: String\n  ) {\n    employeeMissingRecordDays(employeeId: $employeeId, from: $from, to: $to)\n    employeeAbsenceCategorySummary(\n      employeeId: $employeeId\n      from: $from\n      to: $to\n      locale: $locale\n    ) {\n      categoryId\n      name\n      color\n      fullDays\n      partialDays\n      totalDays\n    }\n    employeeWorkTimeBalance(employeeId: $employeeId, from: $from, to: $to) {\n      employeeId\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    employeeVacationBalance(employeeId: $employeeId, from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    employeeMonthlyWorkTime(employeeId: $employeeId, from: $from, to: $to) {\n      year\n      month\n      plannedMinutes\n      actualMinutes\n      differenceMinutes\n    }\n  }\n": typeof types.EmployeeReportDocument,
    "\n  mutation CreateTimeTracking($input: CreateTimeTrackingInput!) {\n    createTimeTracking(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateTimeTrackingDocument,
    "\n  mutation UpdateTimeTracking($input: UpdateTimeTrackingInput!) {\n    updateTimeTracking(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateTimeTrackingDocument,
    "\n  mutation DeleteTimeTracking($id: ID!) {\n    deleteTimeTracking(id: $id)\n  }\n": typeof types.DeleteTimeTrackingDocument,
    "\n  mutation StartTimeTracking($employeeId: ID!) {\n    startTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n": typeof types.StartTimeTrackingDocument,
    "\n  mutation StopTimeTracking($employeeId: ID!) {\n    stopTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n": typeof types.StopTimeTrackingDocument,
    "\n  query EmployeePeriodOpeningBalances($employeeId: ID!) {\n    employeePeriodOpeningBalances(employeeId: $employeeId) {\n      id\n      employeeId\n      periodId\n      openingWorkMinutes\n      openingVacationDays\n    }\n  }\n": typeof types.EmployeePeriodOpeningBalancesDocument,
    "\n  mutation UpsertEmployeePeriodOpeningBalance(\n    $input: UpsertEmployeePeriodOpeningBalanceInput!\n  ) {\n    upsertEmployeePeriodOpeningBalance(input: $input) {\n      id\n    }\n  }\n": typeof types.UpsertEmployeePeriodOpeningBalanceDocument,
    "\n  mutation DeleteEmployeePeriodOpeningBalance($id: ID!) {\n    deleteEmployeePeriodOpeningBalance(id: $id)\n  }\n": typeof types.DeleteEmployeePeriodOpeningBalanceDocument,
    "\n  query EmployeePaidOvertime($employeeId: ID!) {\n    employeePaidOvertime(employeeId: $employeeId) {\n      id\n      employeeId\n      date\n      minutes\n      note\n    }\n  }\n": typeof types.EmployeePaidOvertimeDocument,
    "\n  mutation CreateEmployeePaidOvertime($input: CreateEmployeePaidOvertimeInput!) {\n    createEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateEmployeePaidOvertimeDocument,
    "\n  mutation UpdateEmployeePaidOvertime($input: UpdateEmployeePaidOvertimeInput!) {\n    updateEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateEmployeePaidOvertimeDocument,
    "\n  mutation DeleteEmployeePaidOvertime($id: ID!) {\n    deleteEmployeePaidOvertime(id: $id)\n  }\n": typeof types.DeleteEmployeePaidOvertimeDocument,
    "\n  query TimeTrackingPeriods {\n    timeTrackingPeriods {\n      id\n      label\n      startDate\n      endDate\n      status\n    }\n  }\n": typeof types.TimeTrackingPeriodsDocument,
    "\n  mutation EnsureTimeTrackingPeriod($date: String!) {\n    ensureTimeTrackingPeriod(date: $date) {\n      id\n      label\n    }\n  }\n": typeof types.EnsureTimeTrackingPeriodDocument,
    "\n  mutation SetTimeTrackingPeriodStatus(\n    $id: ID!\n    $status: TimeTrackingPeriodStatus!\n  ) {\n    setTimeTrackingPeriodStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n": typeof types.SetTimeTrackingPeriodStatusDocument,
    "\n  query TimeTrackingSettings {\n    holidays {\n      id\n      date\n      name\n      paidPercentage\n      canton\n    }\n    companyVacations {\n      id\n      name\n      startDate\n      endDate\n      appliesToAll\n    }\n  }\n": typeof types.TimeTrackingSettingsDocument,
    "\n  mutation CreateHoliday($input: CreateHolidayInput!) {\n    createHoliday(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateHolidayDocument,
    "\n  mutation DeleteHoliday($id: ID!) {\n    deleteHoliday(id: $id)\n  }\n": typeof types.DeleteHolidayDocument,
    "\n  mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {\n    createCompanyVacation(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateCompanyVacationDocument,
    "\n  mutation DeleteCompanyVacation($id: ID!) {\n    deleteCompanyVacation(id: $id)\n  }\n": typeof types.DeleteCompanyVacationDocument,
    "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n": typeof types.AddUserEmailDocument,
    "\n  mutation ChangeUserEmail($input: ChangeUserEmailInput!) {\n    changeUserEmail(input: $input) {\n      id\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n    }\n  }\n": typeof types.ChangeUserEmailDocument,
    "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      orgName\n      persona\n      theme\n      isSuperAdmin\n      timeTrackingEnabled\n      isProjectMember\n    }\n  }\n": typeof types.GetAuthContextDocument,
    "\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n": typeof types.RolesByOrganizationIdDocument,
    "\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetUserByIdDocument,
    "\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.GetUsersDocument,
    "\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n": typeof types.RemoveUserEmailDocument,
    "\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n": typeof types.SetPrimaryUserEmailDocument,
    "\n  mutation UpdateMyTheme($input: UpdateMyThemeInput!) {\n    updateMyTheme(input: $input)\n  }\n": typeof types.UpdateMyThemeDocument,
    "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n": typeof types.UpdateUserDocument,
    "\n  mutation ArchiveProcessingActivity($id: ID!) {\n    archiveProcessingActivity(id: $id)\n  }\n": typeof types.ArchiveProcessingActivityDocument,
    "\n  mutation ArchiveSubprocessor($id: ID!) {\n    archiveSubprocessor(id: $id)\n  }\n": typeof types.ArchiveSubprocessorDocument,
    "\n  query ProcessingActivities {\n    processingActivities {\n      id\n      name\n      purpose\n      legalBasis\n      dataCategories\n      dataSubjects\n      recipients\n      retentionNote\n    }\n  }\n": typeof types.ProcessingActivitiesDocument,
    "\n  query Subprocessors {\n    subprocessors {\n      id\n      name\n      purpose\n      country\n      dpaSigned\n      url\n      notes\n    }\n  }\n": typeof types.SubprocessorsDocument,
    "\n  mutation CreateProcessingActivity($input: CreateProcessingActivityInput!) {\n    createProcessingActivity(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateProcessingActivityDocument,
    "\n  mutation UpdateProcessingActivity($input: UpdateProcessingActivityInput!) {\n    updateProcessingActivity(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateProcessingActivityDocument,
    "\n  mutation CreateSubprocessor($input: CreateSubprocessorInput!) {\n    createSubprocessor(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateSubprocessorDocument,
    "\n  mutation UpdateSubprocessor($input: UpdateSubprocessorInput!) {\n    updateSubprocessor(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateSubprocessorDocument,
};
const documents: Documents = {
    "\n  query AccessReview {\n    accessReview {\n      membershipId\n      memberName\n      roles\n      sensitivePermissions\n      lastReviewedAt\n    }\n  }\n": types.AccessReviewDocument,
    "\n  mutation RecertifyAccess($membershipId: ID!, $note: String) {\n    recertifyAccess(membershipId: $membershipId, note: $note)\n  }\n": types.RecertifyAccessDocument,
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
    "\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      followUpYear\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n": types.RejectedAdmissionApplicationsDocument,
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
    "\n  mutation ArchiveConsentPurpose($id: ID!) {\n    archiveConsentPurpose(id: $id)\n  }\n": types.ArchiveConsentPurposeDocument,
    "\n  query ConsentPurposes($includeArchived: Boolean) {\n    consentPurposes(includeArchived: $includeArchived) {\n      id\n      name\n      slug\n      description\n      appliesTo\n      legalBasis\n      requiresEvidence\n      isMandatory\n      position\n      isArchived\n    }\n  }\n": types.ConsentPurposesDocument,
    "\n  query ConsentsForSubject(\n    $subjectType: ConsentSubjectType!\n    $subjectId: ID!\n  ) {\n    consentsForSubject(subjectType: $subjectType, subjectId: $subjectId) {\n      id\n      subjectType\n      subjectId\n      purposeId\n      status\n      grantedByContactPersonId\n      decidedAt\n      withdrawnAt\n      evidenceUrl\n      note\n      purpose {\n        id\n        name\n        slug\n      }\n    }\n  }\n": types.ConsentsForSubjectDocument,
    "\n  mutation RecordConsent($input: RecordConsentInput!) {\n    recordConsent(input: $input) {\n      id\n      status\n    }\n  }\n": types.RecordConsentDocument,
    "\n  mutation CreateConsentPurpose($input: CreateConsentPurposeInput!) {\n    createConsentPurpose(input: $input) {\n      id\n    }\n  }\n": types.CreateConsentPurposeDocument,
    "\n  mutation UpdateConsentPurpose($input: UpdateConsentPurposeInput!) {\n    updateConsentPurpose(input: $input) {\n      id\n    }\n  }\n": types.UpdateConsentPurposeDocument,
    "\n  mutation WithdrawConsent($input: WithdrawConsentInput!) {\n    withdrawConsent(input: $input) {\n      id\n      status\n    }\n  }\n": types.WithdrawConsentDocument,
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
    "\n  mutation CreateDataBreach($input: CreateDataBreachInput!) {\n    createDataBreach(input: $input) {\n      id\n    }\n  }\n": types.CreateDataBreachDocument,
    "\n  query DataBreaches($status: DataBreachStatus) {\n    dataBreaches(status: $status) {\n      id\n      title\n      description\n      detectedAt\n      status\n      riskLevel\n      affectedScope\n      affectedCount\n      authorityNotifiedAt\n      subjectsNotifiedAt\n      measures\n      closedAt\n      notes\n      authorityNotificationDueAt\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.DataBreachesDocument,
    "\n  mutation UpdateDataBreach($input: UpdateDataBreachInput!) {\n    updateDataBreach(input: $input) {\n      id\n      status\n    }\n  }\n": types.UpdateDataBreachDocument,
    "\n  mutation CreateDataSubjectRequest($input: CreateDataSubjectRequestInput!) {\n    createDataSubjectRequest(input: $input) {\n      id\n    }\n  }\n": types.CreateDataSubjectRequestDocument,
    "\n  query DataSubjectRequests($status: DataSubjectRequestStatus) {\n    dataSubjectRequests(status: $status) {\n      id\n      type\n      status\n      subjectType\n      subjectId\n      subjectName\n      contactEmail\n      receivedAt\n      dueDate\n      resolvedAt\n      resolutionNote\n      notes\n      assigneeMembershipId\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.DataSubjectRequestsDocument,
    "\n  query DataSubjectExport($subjectType: DataSubjectType!, $subjectId: ID!) {\n    dataSubjectExport(subjectType: $subjectType, subjectId: $subjectId)\n  }\n": types.DataSubjectExportDocument,
    "\n  mutation UpdateDataSubjectRequest($input: UpdateDataSubjectRequestInput!) {\n    updateDataSubjectRequest(input: $input) {\n      id\n      status\n    }\n  }\n": types.UpdateDataSubjectRequestDocument,
    "\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      isAutomatic\n      sentCount\n      createdAt\n      updatedAt\n    }\n  }\n": types.EmailTemplatesDocument,
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
    "\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      documentUrl\n      isActive\n    }\n  }\n": types.EmployeeContractsByEmployeeIdDocument,
    "\n  mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {\n    createEmployeeContract(input: $input) {\n      id\n    }\n  }\n": types.CreateEmployeeContractDocument,
    "\n  mutation UpdateEmployeeContract($input: UpdateEmployeeContractInput!) {\n    updateEmployeeContract(input: $input) {\n      id\n    }\n  }\n": types.UpdateEmployeeContractDocument,
    "\n  mutation DeleteEmployeeContract($id: ID!) {\n    deleteEmployeeContract(id: $id)\n  }\n": types.DeleteEmployeeContractDocument,
    "\n  mutation UpsertEmployeeOnboardingDraft($input: EmployeeOnboardingInput!) {\n    upsertEmployeeOnboardingDraft(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n": types.UpsertEmployeeOnboardingDraftDocument,
    "\n  mutation FinalizeEmployeeOnboarding($input: FinalizeEmployeeOnboardingInput!) {\n    finalizeEmployeeOnboarding(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n": types.FinalizeEmployeeOnboardingDocument,
    "\n  mutation SendEmployeeInvitation($employeeId: ID!) {\n    sendEmployeeInvitation(employeeId: $employeeId) {\n      id\n      invitationStatus\n    }\n  }\n": types.SendEmployeeInvitationDocument,
    "\n  query GetEmployeeAuditLog($employeeId: ID!) {\n    employeeAuditLog(employeeId: $employeeId) {\n      id\n      createdAt\n      entityType\n      fieldName\n      oldValue\n      newValue\n      actorMembershipId\n      actorMembership {\n        id\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.GetEmployeeAuditLogDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      timeTrackingEnabled\n      membership {\n        id\n        persona\n        contactPhone\n        user {\n          id\n          title\n          firstName\n          lastName\n          dateOfBirth\n          socialSecurityNumber\n          street\n          houseNumber\n          addressLine2\n          postalCode\n          city\n          country\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        organization {\n          id\n          name\n        }\n        roles {\n          id\n          name\n          systemCode\n        }\n      }\n    }\n  }\n": types.GetEmployeeByIdDocument,
    "\n  query GetEmployeeEmergencyProfile($employeeId: ID!) {\n    employeeEmergencyProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      contact1Name\n      contact1Relationship\n      contact1Phone\n      contact1Email\n      contact2Name\n      contact2Relationship\n      contact2Phone\n      contact2Email\n      bloodType\n      allergies\n      chronicConditions\n      emergencyMedications\n      primaryDoctorName\n      primaryDoctorPhone\n      pharmacyName\n    }\n  }\n": types.GetEmployeeEmergencyProfileDocument,
    "\n  query GetEmployeeHrProfile($employeeId: ID!) {\n    employeeHrProfile(employeeId: $employeeId) {\n      id\n      employeeId\n      iban\n      bankAccountHolder\n      bankName\n      bvgInsuranceNumber\n      withholdingTaxCode\n      nationality\n      residencePermitType\n      residencePermitValidUntil\n      maritalStatus\n      denomination\n      numberOfChildren\n      onboardingStatus\n      ndaSigned\n      criminalRecordSubmitted\n    }\n  }\n": types.GetEmployeeHrProfileDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      workloadPercent\n      timeBalanceMinutes\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n          status\n          invitationStatus\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetEmployeesDocument,
    "\n  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {\n    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {\n      id\n    }\n  }\n": types.UpdateEmployeeDocument,
    "\n  mutation UpsertEmployeeEmergencyProfile(\n    $input: UpsertEmployeeEmergencyProfileInput!\n  ) {\n    upsertEmployeeEmergencyProfile(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeeEmergencyProfileDocument,
    "\n  mutation UpsertEmployeeHrProfile($input: UpsertEmployeeHrProfileInput!) {\n    upsertEmployeeHrProfile(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeeHrProfileDocument,
    "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n": types.CreateGradeLevelDocument,
    "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n": types.DeleteGradeLevelDocument,
    "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n      classCount\n      studentCount\n    }\n  }\n": types.GetGradeLevelsDocument,
    "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.ReorderGradeLevelsDocument,
    "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n": types.UpdateGradeLevelDocument,
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
    "\n  mutation AddTaskNote($input: AddTaskNoteInput!) {\n    addTaskNote(input: $input) {\n      id\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n    }\n  }\n": types.AddTaskNoteDocument,
    "\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n": types.ArchiveProjectDocument,
    "\n  mutation CreateProjectFromTemplate($input: CreateProjectFromTemplateInput!) {\n    createProjectFromTemplate(input: $input) {\n      id\n    }\n  }\n": types.CreateProjectFromTemplateDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation CreateTasksFromProtocol($input: CreateTasksFromProtocolInput!) {\n    createTasksFromProtocol(input: $input) {\n      id\n    }\n  }\n": types.CreateTasksFromProtocolDocument,
    "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n": types.DeleteProjectDocument,
    "\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      protocol {\n        id\n        title\n      }\n      admissionApplicationId\n      admissionApplication {\n        id\n        childFirstName\n        childLastName\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.MyTasksDocument,
    "\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n        isSuperAdmin\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n": types.MembershipsByOrgIdDocument,
    "\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      protocol {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.TasksByProjectDocument,
    "\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.ProjectByIdDocument,
    "\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.MyProjectsDocument,
    "\n  query TasksByProtocol($protocolId: ID!) {\n    tasksByProtocol(protocolId: $protocolId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      project {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n": types.TasksByProtocolDocument,
    "\n  query ProtocolTemplatesByOrg {\n    protocolTemplatesByOrg {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n": types.ProtocolTemplatesByOrgDocument,
    "\n  query ProtocolById($id: ID!) {\n    protocolById(id: $id) {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      projectId\n      externalParticipants\n      createdByMembershipId\n      createdBy {\n        userId\n      }\n      project {\n        id\n        title\n      }\n      participants {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n      sections {\n        agendaItems {\n          no\n          topic\n          goal\n        }\n        decisions {\n          topic\n          decision\n          responsible\n          dueDate\n        }\n        communications {\n          topic\n          audience\n          responsible\n          channel\n          dueDate\n        }\n        infoPoints\n        challenges {\n          topic\n          challenge\n          supportNeeded\n        }\n        openPoints {\n          topic\n          nextStep\n          forNextMeeting\n        }\n      }\n    }\n  }\n": types.ProtocolByIdDocument,
    "\n  query ProtocolsByOrg {\n    protocolsByOrg {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      project {\n        id\n        title\n      }\n      participants {\n        id\n      }\n    }\n  }\n": types.ProtocolsByOrgDocument,
    "\n  query ProjectTemplateById($id: ID!) {\n    projectTemplateById(id: $id) {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n        title\n        description\n        priority\n        sortOrder\n        dueOffsetDays\n      }\n    }\n  }\n": types.ProjectTemplateByIdDocument,
    "\n  query ProjectTemplates {\n    projectTemplates {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n      }\n    }\n  }\n": types.ProjectTemplatesDocument,
    "\n  mutation AddProjectMember($input: AddProjectMemberInput!) {\n    addProjectMember(input: $input) {\n      id\n    }\n  }\n": types.AddProjectMemberDocument,
    "\n  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {\n    updateProjectMemberRole(input: $input) {\n      id\n      role\n    }\n  }\n": types.UpdateProjectMemberRoleDocument,
    "\n  mutation RemoveProjectMember($id: ID!) {\n    removeProjectMember(id: $id)\n  }\n": types.RemoveProjectMemberDocument,
    "\n  mutation CreateProtocolTemplate($input: CreateProtocolTemplateInput!) {\n    createProtocolTemplate(input: $input) {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n": types.CreateProtocolTemplateDocument,
    "\n  mutation UpdateProtocolTemplate($input: UpdateProtocolTemplateInput!) {\n    updateProtocolTemplate(input: $input) {\n      id\n    }\n  }\n": types.UpdateProtocolTemplateDocument,
    "\n  mutation DeleteProtocolTemplate($id: ID!) {\n    deleteProtocolTemplate(id: $id)\n  }\n": types.DeleteProtocolTemplateDocument,
    "\n  mutation SaveProtocolAsTemplate($input: SaveProtocolAsTemplateInput!) {\n    saveProtocolAsTemplate(input: $input) {\n      id\n    }\n  }\n": types.SaveProtocolAsTemplateDocument,
    "\n  mutation CreateProtocol($input: CreateProtocolInput!) {\n    createProtocol(input: $input) {\n      id\n    }\n  }\n": types.CreateProtocolDocument,
    "\n  mutation UpdateProtocol($input: UpdateProtocolInput!) {\n    updateProtocol(input: $input) {\n      id\n    }\n  }\n": types.UpdateProtocolDocument,
    "\n  mutation DeleteProtocol($id: ID!) {\n    deleteProtocol(id: $id)\n  }\n": types.DeleteProtocolDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n": types.CreateTaskDocument,
    "\n  mutation UpdateTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n": types.UpdateTaskDocument,
    "\n  mutation MoveTask($input: MoveTaskInput!) {\n    moveTask(input: $input) {\n      id\n      status\n      sortOrder\n    }\n  }\n": types.MoveTaskDocument,
    "\n  mutation DeleteTask($id: ID!) {\n    deleteTask(id: $id)\n  }\n": types.DeleteTaskDocument,
    "\n  mutation CreateProjectTemplate($input: CreateProjectTemplateInput!) {\n    createProjectTemplate(input: $input) {\n      id\n    }\n  }\n": types.CreateProjectTemplateDocument,
    "\n  mutation UpdateProjectTemplate($input: UpdateProjectTemplateInput!) {\n    updateProjectTemplate(input: $input) {\n      id\n    }\n  }\n": types.UpdateProjectTemplateDocument,
    "\n  mutation DeleteProjectTemplate($id: ID!) {\n    deleteProjectTemplate(id: $id)\n  }\n": types.DeleteProjectTemplateDocument,
    "\n  mutation CreatePersonalTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n": types.CreatePersonalTaskDocument,
    "\n  mutation UpdatePersonalTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n": types.UpdatePersonalTaskDocument,
    "\n  mutation ReorderMyTasks($orderedTaskIds: [ID!]!) {\n    reorderMyTasks(orderedTaskIds: $orderedTaskIds)\n  }\n": types.ReorderMyTasksDocument,
    "\n  mutation SaveProjectAsTemplate($input: SaveProjectAsTemplateInput!) {\n    saveProjectAsTemplate(input: $input) {\n      id\n    }\n  }\n": types.SaveProjectAsTemplateDocument,
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
    "\n  mutation DeleteRetentionPolicy($id: ID!) {\n    deleteRetentionPolicy(id: $id)\n  }\n": types.DeleteRetentionPolicyDocument,
    "\n  mutation ExecutePurgeCandidate($id: ID!) {\n    executePurgeCandidate(id: $id)\n  }\n": types.ExecutePurgeCandidateDocument,
    "\n  query PurgeCandidates {\n    purgeCandidates {\n      id\n      entityType\n      subjectLabel\n      dueSince\n      action\n      status\n      reviewedAt\n      executedAt\n      note\n    }\n  }\n": types.PurgeCandidatesDocument,
    "\n  query RetentionPolicies {\n    retentionPolicies {\n      id\n      entityType\n      retentionMonths\n      action\n      description\n      isEnabled\n      dueCount\n    }\n  }\n": types.RetentionPoliciesDocument,
    "\n  mutation ReviewPurgeCandidate($id: ID!, $approve: Boolean!) {\n    reviewPurgeCandidate(id: $id, approve: $approve)\n  }\n": types.ReviewPurgeCandidateDocument,
    "\n  mutation ScanRetention {\n    scanRetention\n  }\n": types.ScanRetentionDocument,
    "\n  mutation UpsertRetentionPolicy($input: UpsertRetentionPolicyInput!) {\n    upsertRetentionPolicy(input: $input) {\n      id\n    }\n  }\n": types.UpsertRetentionPolicyDocument,
    "\n  query GetPermissions {\n    permissions {\n      id\n      code\n      name\n      description\n    }\n  }\n": types.GetPermissionsDocument,
    "\n  query GetRolesByOrgId {\n    rolesByOrgId {\n      id\n      name\n      systemCode\n      isSystem\n      permissions {\n        id\n        code\n        name\n      }\n    }\n  }\n": types.GetRolesByOrgIdDocument,
    "\n  mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {\n    updateRolePermissions(input: $input) {\n      id\n      permissions {\n        id\n        code\n      }\n    }\n  }\n": types.UpdateRolePermissionsDocument,
    "\n  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {\n    createSchoolClass(input: $input) {\n      id\n    }\n  }\n": types.CreateSchoolClassDocument,
    "\n  mutation DeleteSchoolClass($id: ID!) {\n    deleteSchoolClass(id: $id)\n  }\n": types.DeleteSchoolClassDocument,
    "\n  query GetMyTeachingSchoolClasses {\n    myTeachingSchoolClasses {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetMyTeachingSchoolClassesDocument,
    "\n  query GetSchoolClassById($id: ID!) {\n    schoolClassById(id: $id) {\n      id\n      name\n      gradeLevels {\n        id\n        name\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      isActive\n    }\n  }\n": types.GetSchoolClassByIdDocument,
    "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n        ageMin\n        ageMax\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      enrolledCount\n      isActive\n    }\n  }\n": types.GetSchoolClassesDocument,
    "\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n": types.GetTeachersByOrgIdDocument,
    "\n  mutation ReorderSchoolClasses($input: ReorderSchoolClassesInput!) {\n    reorderSchoolClasses(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n": types.ReorderSchoolClassesDocument,
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
    "\n  query GetAllTeamMembers {\n    teamMembersByOrgId {\n      id\n      role\n      team {\n        id\n      }\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetAllTeamMembersDocument,
    "\n  query GetTeamById($id: ID!) {\n    teamById(id: $id) {\n      id\n      name\n    }\n  }\n": types.GetTeamByIdDocument,
    "\n  query GetTeamMembers($teamId: ID!) {\n    teamMembersByTeamId(teamId: $teamId) {\n      id\n      role\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetTeamMembersDocument,
    "\n  query GetTeams {\n    teamsByOrgId {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": types.GetTeamsDocument,
    "\n  mutation MoveTeamMember($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": types.MoveTeamMemberDocument,
    "\n  mutation RemoveTeamMember($id: ID!) {\n    deleteTeamMember(id: $id)\n  }\n": types.RemoveTeamMemberDocument,
    "\n  mutation ReorderTeams($input: ReorderTeamsInput!) {\n    reorderTeams(input: $input) {\n      id\n      name\n      sortOrder\n      parentId\n    }\n  }\n": types.ReorderTeamsDocument,
    "\n  mutation UpdateTeamMemberRole($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n": types.UpdateTeamMemberRoleDocument,
    "\n  mutation UpdateTeam($input: UpdateTeamInput!) {\n    updateTeam(input: $input) {\n      id\n      name\n    }\n  }\n": types.UpdateTeamDocument,
    "\n  query MyEmployeeId {\n    myEmployeeId\n  }\n": types.MyEmployeeIdDocument,
    "\n  query MyTimeTracking($employeeId: ID!, $from: String!, $to: String!) {\n    myWorkTimeBalance(from: $from, to: $to) {\n      employeeId\n      fromDate\n      toDate\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      actualMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    myVacationBalance(from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    myMissingRecordDays(from: $from, to: $to)\n    timeTrackingByEmployeeId(employeeId: $employeeId, from: $from, to: $to) {\n      id\n      startedAt\n      endedAt\n      breakMinutes\n      workMinutes\n      notes\n      entryDate\n      source\n    }\n  }\n": types.MyTimeTrackingDocument,
    "\n  query TeamOverview($from: String!, $to: String!) {\n    teamWorkTimeOverview(from: $from, to: $to) {\n      employeeId\n      employeeName\n      netBalanceMinutes\n      vacationDaysUsed\n    }\n  }\n": types.TeamOverviewDocument,
    "\n  query EmployeeReport(\n    $employeeId: ID!\n    $from: String!\n    $to: String!\n    $locale: String\n  ) {\n    employeeMissingRecordDays(employeeId: $employeeId, from: $from, to: $to)\n    employeeAbsenceCategorySummary(\n      employeeId: $employeeId\n      from: $from\n      to: $to\n      locale: $locale\n    ) {\n      categoryId\n      name\n      color\n      fullDays\n      partialDays\n      totalDays\n    }\n    employeeWorkTimeBalance(employeeId: $employeeId, from: $from, to: $to) {\n      employeeId\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    employeeVacationBalance(employeeId: $employeeId, from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    employeeMonthlyWorkTime(employeeId: $employeeId, from: $from, to: $to) {\n      year\n      month\n      plannedMinutes\n      actualMinutes\n      differenceMinutes\n    }\n  }\n": types.EmployeeReportDocument,
    "\n  mutation CreateTimeTracking($input: CreateTimeTrackingInput!) {\n    createTimeTracking(input: $input) {\n      id\n    }\n  }\n": types.CreateTimeTrackingDocument,
    "\n  mutation UpdateTimeTracking($input: UpdateTimeTrackingInput!) {\n    updateTimeTracking(input: $input) {\n      id\n    }\n  }\n": types.UpdateTimeTrackingDocument,
    "\n  mutation DeleteTimeTracking($id: ID!) {\n    deleteTimeTracking(id: $id)\n  }\n": types.DeleteTimeTrackingDocument,
    "\n  mutation StartTimeTracking($employeeId: ID!) {\n    startTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n": types.StartTimeTrackingDocument,
    "\n  mutation StopTimeTracking($employeeId: ID!) {\n    stopTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n": types.StopTimeTrackingDocument,
    "\n  query EmployeePeriodOpeningBalances($employeeId: ID!) {\n    employeePeriodOpeningBalances(employeeId: $employeeId) {\n      id\n      employeeId\n      periodId\n      openingWorkMinutes\n      openingVacationDays\n    }\n  }\n": types.EmployeePeriodOpeningBalancesDocument,
    "\n  mutation UpsertEmployeePeriodOpeningBalance(\n    $input: UpsertEmployeePeriodOpeningBalanceInput!\n  ) {\n    upsertEmployeePeriodOpeningBalance(input: $input) {\n      id\n    }\n  }\n": types.UpsertEmployeePeriodOpeningBalanceDocument,
    "\n  mutation DeleteEmployeePeriodOpeningBalance($id: ID!) {\n    deleteEmployeePeriodOpeningBalance(id: $id)\n  }\n": types.DeleteEmployeePeriodOpeningBalanceDocument,
    "\n  query EmployeePaidOvertime($employeeId: ID!) {\n    employeePaidOvertime(employeeId: $employeeId) {\n      id\n      employeeId\n      date\n      minutes\n      note\n    }\n  }\n": types.EmployeePaidOvertimeDocument,
    "\n  mutation CreateEmployeePaidOvertime($input: CreateEmployeePaidOvertimeInput!) {\n    createEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n": types.CreateEmployeePaidOvertimeDocument,
    "\n  mutation UpdateEmployeePaidOvertime($input: UpdateEmployeePaidOvertimeInput!) {\n    updateEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n": types.UpdateEmployeePaidOvertimeDocument,
    "\n  mutation DeleteEmployeePaidOvertime($id: ID!) {\n    deleteEmployeePaidOvertime(id: $id)\n  }\n": types.DeleteEmployeePaidOvertimeDocument,
    "\n  query TimeTrackingPeriods {\n    timeTrackingPeriods {\n      id\n      label\n      startDate\n      endDate\n      status\n    }\n  }\n": types.TimeTrackingPeriodsDocument,
    "\n  mutation EnsureTimeTrackingPeriod($date: String!) {\n    ensureTimeTrackingPeriod(date: $date) {\n      id\n      label\n    }\n  }\n": types.EnsureTimeTrackingPeriodDocument,
    "\n  mutation SetTimeTrackingPeriodStatus(\n    $id: ID!\n    $status: TimeTrackingPeriodStatus!\n  ) {\n    setTimeTrackingPeriodStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n": types.SetTimeTrackingPeriodStatusDocument,
    "\n  query TimeTrackingSettings {\n    holidays {\n      id\n      date\n      name\n      paidPercentage\n      canton\n    }\n    companyVacations {\n      id\n      name\n      startDate\n      endDate\n      appliesToAll\n    }\n  }\n": types.TimeTrackingSettingsDocument,
    "\n  mutation CreateHoliday($input: CreateHolidayInput!) {\n    createHoliday(input: $input) {\n      id\n    }\n  }\n": types.CreateHolidayDocument,
    "\n  mutation DeleteHoliday($id: ID!) {\n    deleteHoliday(id: $id)\n  }\n": types.DeleteHolidayDocument,
    "\n  mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {\n    createCompanyVacation(input: $input) {\n      id\n    }\n  }\n": types.CreateCompanyVacationDocument,
    "\n  mutation DeleteCompanyVacation($id: ID!) {\n    deleteCompanyVacation(id: $id)\n  }\n": types.DeleteCompanyVacationDocument,
    "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n": types.AddUserEmailDocument,
    "\n  mutation ChangeUserEmail($input: ChangeUserEmailInput!) {\n    changeUserEmail(input: $input) {\n      id\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n    }\n  }\n": types.ChangeUserEmailDocument,
    "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n": types.CreateUserDocument,
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      orgName\n      persona\n      theme\n      isSuperAdmin\n      timeTrackingEnabled\n      isProjectMember\n    }\n  }\n": types.GetAuthContextDocument,
    "\n  query RolesByOrganizationId($organizationId: ID!) {\n    rolesByOrganizationId(organizationId: $organizationId) {\n      id\n      name\n      systemCode\n      isSystem\n    }\n  }\n": types.RolesByOrganizationIdDocument,
    "\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      title\n      firstName\n      lastName\n      username\n      dateOfBirth\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n      memberships {\n        id\n        persona\n        contactPhone\n        userEmailId\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetUserByIdDocument,
    "\n  query GetUsers {\n    users {\n      id\n      title\n      firstName\n      lastName\n      isSuperAdmin\n      isActive\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n        authAccounts {\n          id\n          provider\n        }\n      }\n      memberships {\n        id\n        persona\n        organization {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.GetUsersDocument,
    "\n  mutation RemoveUserEmail($id: ID!) {\n    removeUserEmail(id: $id) {\n      id\n    }\n  }\n": types.RemoveUserEmailDocument,
    "\n  mutation SetPrimaryUserEmail($id: ID!) {\n    setPrimaryUserEmail(id: $id) {\n      id\n      isPrimary\n    }\n  }\n": types.SetPrimaryUserEmailDocument,
    "\n  mutation UpdateMyTheme($input: UpdateMyThemeInput!) {\n    updateMyTheme(input: $input)\n  }\n": types.UpdateMyThemeDocument,
    "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n": types.UpdateUserDocument,
    "\n  mutation ArchiveProcessingActivity($id: ID!) {\n    archiveProcessingActivity(id: $id)\n  }\n": types.ArchiveProcessingActivityDocument,
    "\n  mutation ArchiveSubprocessor($id: ID!) {\n    archiveSubprocessor(id: $id)\n  }\n": types.ArchiveSubprocessorDocument,
    "\n  query ProcessingActivities {\n    processingActivities {\n      id\n      name\n      purpose\n      legalBasis\n      dataCategories\n      dataSubjects\n      recipients\n      retentionNote\n    }\n  }\n": types.ProcessingActivitiesDocument,
    "\n  query Subprocessors {\n    subprocessors {\n      id\n      name\n      purpose\n      country\n      dpaSigned\n      url\n      notes\n    }\n  }\n": types.SubprocessorsDocument,
    "\n  mutation CreateProcessingActivity($input: CreateProcessingActivityInput!) {\n    createProcessingActivity(input: $input) {\n      id\n    }\n  }\n": types.CreateProcessingActivityDocument,
    "\n  mutation UpdateProcessingActivity($input: UpdateProcessingActivityInput!) {\n    updateProcessingActivity(input: $input) {\n      id\n    }\n  }\n": types.UpdateProcessingActivityDocument,
    "\n  mutation CreateSubprocessor($input: CreateSubprocessorInput!) {\n    createSubprocessor(input: $input) {\n      id\n    }\n  }\n": types.CreateSubprocessorDocument,
    "\n  mutation UpdateSubprocessor($input: UpdateSubprocessorInput!) {\n    updateSubprocessor(input: $input) {\n      id\n    }\n  }\n": types.UpdateSubprocessorDocument,
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
export function graphql(source: "\n  query AccessReview {\n    accessReview {\n      membershipId\n      memberName\n      roles\n      sensitivePermissions\n      lastReviewedAt\n    }\n  }\n"): (typeof documents)["\n  query AccessReview {\n    accessReview {\n      membershipId\n      memberName\n      roles\n      sensitivePermissions\n      lastReviewedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RecertifyAccess($membershipId: ID!, $note: String) {\n    recertifyAccess(membershipId: $membershipId, note: $note)\n  }\n"): (typeof documents)["\n  mutation RecertifyAccess($membershipId: ID!, $note: String) {\n    recertifyAccess(membershipId: $membershipId, note: $note)\n  }\n"];
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
export function graphql(source: "\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      followUpYear\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n"): (typeof documents)["\n  query RejectedAdmissionApplications {\n    admissionApplications(includeFinished: true) {\n      id\n      status\n      childFirstName\n      childLastName\n      stageEnteredAt\n      rejectionReason\n      rejectionReasonId\n      rejectedBy\n      followUpYear\n      family {\n        name\n      }\n      desiredGradeLevel {\n        name\n      }\n    }\n    admissionRejectionReasons(includeArchived: true) {\n      id\n      label\n      color\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation ArchiveConsentPurpose($id: ID!) {\n    archiveConsentPurpose(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveConsentPurpose($id: ID!) {\n    archiveConsentPurpose(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ConsentPurposes($includeArchived: Boolean) {\n    consentPurposes(includeArchived: $includeArchived) {\n      id\n      name\n      slug\n      description\n      appliesTo\n      legalBasis\n      requiresEvidence\n      isMandatory\n      position\n      isArchived\n    }\n  }\n"): (typeof documents)["\n  query ConsentPurposes($includeArchived: Boolean) {\n    consentPurposes(includeArchived: $includeArchived) {\n      id\n      name\n      slug\n      description\n      appliesTo\n      legalBasis\n      requiresEvidence\n      isMandatory\n      position\n      isArchived\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ConsentsForSubject(\n    $subjectType: ConsentSubjectType!\n    $subjectId: ID!\n  ) {\n    consentsForSubject(subjectType: $subjectType, subjectId: $subjectId) {\n      id\n      subjectType\n      subjectId\n      purposeId\n      status\n      grantedByContactPersonId\n      decidedAt\n      withdrawnAt\n      evidenceUrl\n      note\n      purpose {\n        id\n        name\n        slug\n      }\n    }\n  }\n"): (typeof documents)["\n  query ConsentsForSubject(\n    $subjectType: ConsentSubjectType!\n    $subjectId: ID!\n  ) {\n    consentsForSubject(subjectType: $subjectType, subjectId: $subjectId) {\n      id\n      subjectType\n      subjectId\n      purposeId\n      status\n      grantedByContactPersonId\n      decidedAt\n      withdrawnAt\n      evidenceUrl\n      note\n      purpose {\n        id\n        name\n        slug\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RecordConsent($input: RecordConsentInput!) {\n    recordConsent(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation RecordConsent($input: RecordConsentInput!) {\n    recordConsent(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateConsentPurpose($input: CreateConsentPurposeInput!) {\n    createConsentPurpose(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateConsentPurpose($input: CreateConsentPurposeInput!) {\n    createConsentPurpose(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateConsentPurpose($input: UpdateConsentPurposeInput!) {\n    updateConsentPurpose(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateConsentPurpose($input: UpdateConsentPurposeInput!) {\n    updateConsentPurpose(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation WithdrawConsent($input: WithdrawConsentInput!) {\n    withdrawConsent(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation WithdrawConsent($input: WithdrawConsentInput!) {\n    withdrawConsent(input: $input) {\n      id\n      status\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation CreateDataBreach($input: CreateDataBreachInput!) {\n    createDataBreach(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDataBreach($input: CreateDataBreachInput!) {\n    createDataBreach(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DataBreaches($status: DataBreachStatus) {\n    dataBreaches(status: $status) {\n      id\n      title\n      description\n      detectedAt\n      status\n      riskLevel\n      affectedScope\n      affectedCount\n      authorityNotifiedAt\n      subjectsNotifiedAt\n      measures\n      closedAt\n      notes\n      authorityNotificationDueAt\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query DataBreaches($status: DataBreachStatus) {\n    dataBreaches(status: $status) {\n      id\n      title\n      description\n      detectedAt\n      status\n      riskLevel\n      affectedScope\n      affectedCount\n      authorityNotifiedAt\n      subjectsNotifiedAt\n      measures\n      closedAt\n      notes\n      authorityNotificationDueAt\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDataBreach($input: UpdateDataBreachInput!) {\n    updateDataBreach(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDataBreach($input: UpdateDataBreachInput!) {\n    updateDataBreach(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateDataSubjectRequest($input: CreateDataSubjectRequestInput!) {\n    createDataSubjectRequest(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDataSubjectRequest($input: CreateDataSubjectRequestInput!) {\n    createDataSubjectRequest(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DataSubjectRequests($status: DataSubjectRequestStatus) {\n    dataSubjectRequests(status: $status) {\n      id\n      type\n      status\n      subjectType\n      subjectId\n      subjectName\n      contactEmail\n      receivedAt\n      dueDate\n      resolvedAt\n      resolutionNote\n      notes\n      assigneeMembershipId\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query DataSubjectRequests($status: DataSubjectRequestStatus) {\n    dataSubjectRequests(status: $status) {\n      id\n      type\n      status\n      subjectType\n      subjectId\n      subjectName\n      contactEmail\n      receivedAt\n      dueDate\n      resolvedAt\n      resolutionNote\n      notes\n      assigneeMembershipId\n      assigneeMembership {\n        id\n        user {\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DataSubjectExport($subjectType: DataSubjectType!, $subjectId: ID!) {\n    dataSubjectExport(subjectType: $subjectType, subjectId: $subjectId)\n  }\n"): (typeof documents)["\n  query DataSubjectExport($subjectType: DataSubjectType!, $subjectId: ID!) {\n    dataSubjectExport(subjectType: $subjectType, subjectId: $subjectId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDataSubjectRequest($input: UpdateDataSubjectRequestInput!) {\n    updateDataSubjectRequest(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDataSubjectRequest($input: UpdateDataSubjectRequestInput!) {\n    updateDataSubjectRequest(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      isAutomatic\n      sentCount\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query EmailTemplates($category: EmailTemplateCategory) {\n    emailTemplates(category: $category) {\n      id\n      name\n      category\n      subject\n      bodyHtml\n      description\n      isAutomatic\n      sentCount\n      createdAt\n      updatedAt\n    }\n  }\n"];
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
export function graphql(source: "\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      documentUrl\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query EmployeeContractsByEmployeeId($employeeId: ID!) {\n    employeeContractsByEmployeeId(employeeId: $employeeId) {\n      id\n      employeeId\n      startDate\n      endDate\n      probationEndDate\n      contractType\n      position\n      supervisorMembershipId\n      workloadPercent\n      weeklyHours\n      grossSalary\n      paymentInterval\n      has13thSalary\n      annualVacationDays\n      remainingVacationDays\n      notes\n      documentUrl\n      isActive\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation UpsertEmployeeOnboardingDraft($input: EmployeeOnboardingInput!) {\n    upsertEmployeeOnboardingDraft(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertEmployeeOnboardingDraft($input: EmployeeOnboardingInput!) {\n    upsertEmployeeOnboardingDraft(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FinalizeEmployeeOnboarding($input: FinalizeEmployeeOnboardingInput!) {\n    finalizeEmployeeOnboarding(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n"): (typeof documents)["\n  mutation FinalizeEmployeeOnboarding($input: FinalizeEmployeeOnboardingInput!) {\n    finalizeEmployeeOnboarding(input: $input) {\n      id\n      status\n      invitationStatus\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendEmployeeInvitation($employeeId: ID!) {\n    sendEmployeeInvitation(employeeId: $employeeId) {\n      id\n      invitationStatus\n    }\n  }\n"): (typeof documents)["\n  mutation SendEmployeeInvitation($employeeId: ID!) {\n    sendEmployeeInvitation(employeeId: $employeeId) {\n      id\n      invitationStatus\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetEmployees {\n    employeesByOrgId {\n      workloadPercent\n      timeBalanceMinutes\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n          status\n          invitationStatus\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployees {\n    employeesByOrgId {\n      workloadPercent\n      timeBalanceMinutes\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n          status\n          invitationStatus\n        }\n        user {\n          firstName\n          id\n          lastName\n          userEmails {\n            email\n            isPrimary\n          }\n        }\n        persona\n        contactPhone\n      }\n      teamMembers {\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {\n    createGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteGradeLevel($id: ID!) {\n    deleteGradeLevel(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n      classCount\n      studentCount\n    }\n  }\n"): (typeof documents)["\n  query GetGradeLevels {\n    gradeLevelsByOrgId {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n      classCount\n      studentCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {\n    reorderGradeLevels(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {\n    updateGradeLevel(input: $input) {\n      id\n      name\n      color\n      shortCode\n      ageMin\n      ageMax\n      sortOrder\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation AddTaskNote($input: AddTaskNoteInput!) {\n    addTaskNote(input: $input) {\n      id\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddTaskNote($input: AddTaskNoteInput!) {\n    addTaskNote(input: $input) {\n      id\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveProject($id: ID!, $archived: Boolean!) {\n    archiveProject(id: $id, archived: $archived) {\n      id\n      isArchived\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProjectFromTemplate($input: CreateProjectFromTemplateInput!) {\n    createProjectFromTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProjectFromTemplate($input: CreateProjectFromTemplateInput!) {\n    createProjectFromTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTasksFromProtocol($input: CreateTasksFromProtocolInput!) {\n    createTasksFromProtocol(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTasksFromProtocol($input: CreateTasksFromProtocolInput!) {\n    createTasksFromProtocol(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      protocol {\n        id\n        title\n      }\n      admissionApplicationId\n      admissionApplication {\n        id\n        childFirstName\n        childLastName\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyTasks {\n    myTasks {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      project {\n        id\n        title\n        color\n      }\n      protocol {\n        id\n        title\n      }\n      admissionApplicationId\n      admissionApplication {\n        id\n        childFirstName\n        childLastName\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n        isSuperAdmin\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  query MembershipsByOrgId($organizationId: ID!) {\n    membershipsByOrgId(organizationId: $organizationId) {\n      id\n      userId\n      user {\n        firstName\n        lastName\n        isSuperAdmin\n      }\n      userEmail {\n        email\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      protocol {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TasksByProject($projectId: ID!) {\n    tasksByProject(projectId: $projectId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      dueTime\n      completedAt\n      checklist {\n        id\n        label\n        done\n      }\n      notes {\n        id\n        text\n        authorName\n        createdAt\n      }\n      createdByMembershipId\n      sortOrder\n      protocol {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectById($id: ID!) {\n    projectById(id: $id) {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyProjects {\n    myProjects {\n      id\n      title\n      description\n      status\n      color\n      dueDate\n      isArchived\n      createdAt\n      taskStats {\n        total\n        done\n      }\n      members {\n        id\n        role\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TasksByProtocol($protocolId: ID!) {\n    tasksByProtocol(protocolId: $protocolId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      project {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TasksByProtocol($protocolId: ID!) {\n    tasksByProtocol(protocolId: $protocolId) {\n      id\n      title\n      description\n      status\n      priority\n      dueDate\n      project {\n        id\n        title\n      }\n      assignees {\n        id\n        membershipId\n        membership {\n          id\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProtocolTemplatesByOrg {\n    protocolTemplatesByOrg {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n"): (typeof documents)["\n  query ProtocolTemplatesByOrg {\n    protocolTemplatesByOrg {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProtocolById($id: ID!) {\n    protocolById(id: $id) {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      projectId\n      externalParticipants\n      createdByMembershipId\n      createdBy {\n        userId\n      }\n      project {\n        id\n        title\n      }\n      participants {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n      sections {\n        agendaItems {\n          no\n          topic\n          goal\n        }\n        decisions {\n          topic\n          decision\n          responsible\n          dueDate\n        }\n        communications {\n          topic\n          audience\n          responsible\n          channel\n          dueDate\n        }\n        infoPoints\n        challenges {\n          topic\n          challenge\n          supportNeeded\n        }\n        openPoints {\n          topic\n          nextStep\n          forNextMeeting\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProtocolById($id: ID!) {\n    protocolById(id: $id) {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      projectId\n      externalParticipants\n      createdByMembershipId\n      createdBy {\n        userId\n      }\n      project {\n        id\n        title\n      }\n      participants {\n        id\n        membershipId\n        membership {\n          id\n          userId\n          user {\n            firstName\n            lastName\n          }\n          userEmail {\n            email\n          }\n        }\n      }\n      sections {\n        agendaItems {\n          no\n          topic\n          goal\n        }\n        decisions {\n          topic\n          decision\n          responsible\n          dueDate\n        }\n        communications {\n          topic\n          audience\n          responsible\n          channel\n          dueDate\n        }\n        infoPoints\n        challenges {\n          topic\n          challenge\n          supportNeeded\n        }\n        openPoints {\n          topic\n          nextStep\n          forNextMeeting\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProtocolsByOrg {\n    protocolsByOrg {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      project {\n        id\n        title\n      }\n      participants {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProtocolsByOrg {\n    protocolsByOrg {\n      id\n      title\n      meetingDate\n      startTime\n      endTime\n      status\n      project {\n        id\n        title\n      }\n      participants {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectTemplateById($id: ID!) {\n    projectTemplateById(id: $id) {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n        title\n        description\n        priority\n        sortOrder\n        dueOffsetDays\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectTemplateById($id: ID!) {\n    projectTemplateById(id: $id) {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n        title\n        description\n        priority\n        sortOrder\n        dueOffsetDays\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectTemplates {\n    projectTemplates {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProjectTemplates {\n    projectTemplates {\n      id\n      title\n      description\n      createdAt\n      tasks {\n        id\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation CreateProtocolTemplate($input: CreateProtocolTemplateInput!) {\n    createProtocolTemplate(input: $input) {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProtocolTemplate($input: CreateProtocolTemplateInput!) {\n    createProtocolTemplate(input: $input) {\n      id\n      title\n      agendaItems {\n        no\n        topic\n        goal\n      }\n      defaultParticipantMembershipIds\n      usedCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProtocolTemplate($input: UpdateProtocolTemplateInput!) {\n    updateProtocolTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProtocolTemplate($input: UpdateProtocolTemplateInput!) {\n    updateProtocolTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProtocolTemplate($id: ID!) {\n    deleteProtocolTemplate(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProtocolTemplate($id: ID!) {\n    deleteProtocolTemplate(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveProtocolAsTemplate($input: SaveProtocolAsTemplateInput!) {\n    saveProtocolAsTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation SaveProtocolAsTemplate($input: SaveProtocolAsTemplateInput!) {\n    saveProtocolAsTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProtocol($input: CreateProtocolInput!) {\n    createProtocol(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProtocol($input: CreateProtocolInput!) {\n    createProtocol(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProtocol($input: UpdateProtocolInput!) {\n    updateProtocol(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProtocol($input: UpdateProtocolInput!) {\n    updateProtocol(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProtocol($id: ID!) {\n    deleteProtocol(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProtocol($id: ID!) {\n    deleteProtocol(id: $id)\n  }\n"];
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
export function graphql(source: "\n  mutation CreateProjectTemplate($input: CreateProjectTemplateInput!) {\n    createProjectTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProjectTemplate($input: CreateProjectTemplateInput!) {\n    createProjectTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProjectTemplate($input: UpdateProjectTemplateInput!) {\n    updateProjectTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProjectTemplate($input: UpdateProjectTemplateInput!) {\n    updateProjectTemplate(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProjectTemplate($id: ID!) {\n    deleteProjectTemplate(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProjectTemplate($id: ID!) {\n    deleteProjectTemplate(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePersonalTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePersonalTask($input: CreateTaskInput!) {\n    createTask(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePersonalTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePersonalTask($input: UpdateTaskInput!) {\n    updateTask(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderMyTasks($orderedTaskIds: [ID!]!) {\n    reorderMyTasks(orderedTaskIds: $orderedTaskIds)\n  }\n"): (typeof documents)["\n  mutation ReorderMyTasks($orderedTaskIds: [ID!]!) {\n    reorderMyTasks(orderedTaskIds: $orderedTaskIds)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveProjectAsTemplate($input: SaveProjectAsTemplateInput!) {\n    saveProjectAsTemplate(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation SaveProjectAsTemplate($input: SaveProjectAsTemplateInput!) {\n    saveProjectAsTemplate(input: $input) {\n      id\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation DeleteRetentionPolicy($id: ID!) {\n    deleteRetentionPolicy(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteRetentionPolicy($id: ID!) {\n    deleteRetentionPolicy(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ExecutePurgeCandidate($id: ID!) {\n    executePurgeCandidate(id: $id)\n  }\n"): (typeof documents)["\n  mutation ExecutePurgeCandidate($id: ID!) {\n    executePurgeCandidate(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PurgeCandidates {\n    purgeCandidates {\n      id\n      entityType\n      subjectLabel\n      dueSince\n      action\n      status\n      reviewedAt\n      executedAt\n      note\n    }\n  }\n"): (typeof documents)["\n  query PurgeCandidates {\n    purgeCandidates {\n      id\n      entityType\n      subjectLabel\n      dueSince\n      action\n      status\n      reviewedAt\n      executedAt\n      note\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RetentionPolicies {\n    retentionPolicies {\n      id\n      entityType\n      retentionMonths\n      action\n      description\n      isEnabled\n      dueCount\n    }\n  }\n"): (typeof documents)["\n  query RetentionPolicies {\n    retentionPolicies {\n      id\n      entityType\n      retentionMonths\n      action\n      description\n      isEnabled\n      dueCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReviewPurgeCandidate($id: ID!, $approve: Boolean!) {\n    reviewPurgeCandidate(id: $id, approve: $approve)\n  }\n"): (typeof documents)["\n  mutation ReviewPurgeCandidate($id: ID!, $approve: Boolean!) {\n    reviewPurgeCandidate(id: $id, approve: $approve)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ScanRetention {\n    scanRetention\n  }\n"): (typeof documents)["\n  mutation ScanRetention {\n    scanRetention\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertRetentionPolicy($input: UpsertRetentionPolicyInput!) {\n    upsertRetentionPolicy(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertRetentionPolicy($input: UpsertRetentionPolicyInput!) {\n    upsertRetentionPolicy(input: $input) {\n      id\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n        ageMin\n        ageMax\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      enrolledCount\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetSchoolClasses {\n    schoolClassesByOrgId {\n      id\n      name\n      gradeLevels {\n        id\n        name\n        ageMin\n        ageMax\n      }\n      teachers {\n        id\n        membership {\n          user {\n            firstName\n            lastName\n          }\n        }\n      }\n      color\n      description\n      sortOrder\n      maxCapacity\n      room\n      enrolledCount\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTeachersByOrgId {\n    teachersByOrgId {\n      id\n      membership {\n        user {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderSchoolClasses($input: ReorderSchoolClassesInput!) {\n    reorderSchoolClasses(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderSchoolClasses($input: ReorderSchoolClassesInput!) {\n    reorderSchoolClasses(input: $input) {\n      id\n      name\n      sortOrder\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetAllTeamMembers {\n    teamMembersByOrgId {\n      id\n      role\n      team {\n        id\n      }\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetAllTeamMembers {\n    teamMembersByOrgId {\n      id\n      role\n      team {\n        id\n      }\n      employee {\n        id\n        isActive\n        membership {\n          user {\n            id\n            firstName\n            lastName\n            userEmails {\n              email\n              isPrimary\n            }\n          }\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation MoveTeamMember($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n"): (typeof documents)["\n  mutation MoveTeamMember($input: UpdateTeamMemberInput!) {\n    updateTeamMember(input: $input) {\n      id\n      role\n    }\n  }\n"];
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
export function graphql(source: "\n  query MyEmployeeId {\n    myEmployeeId\n  }\n"): (typeof documents)["\n  query MyEmployeeId {\n    myEmployeeId\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyTimeTracking($employeeId: ID!, $from: String!, $to: String!) {\n    myWorkTimeBalance(from: $from, to: $to) {\n      employeeId\n      fromDate\n      toDate\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      actualMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    myVacationBalance(from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    myMissingRecordDays(from: $from, to: $to)\n    timeTrackingByEmployeeId(employeeId: $employeeId, from: $from, to: $to) {\n      id\n      startedAt\n      endedAt\n      breakMinutes\n      workMinutes\n      notes\n      entryDate\n      source\n    }\n  }\n"): (typeof documents)["\n  query MyTimeTracking($employeeId: ID!, $from: String!, $to: String!) {\n    myWorkTimeBalance(from: $from, to: $to) {\n      employeeId\n      fromDate\n      toDate\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      actualMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    myVacationBalance(from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    myMissingRecordDays(from: $from, to: $to)\n    timeTrackingByEmployeeId(employeeId: $employeeId, from: $from, to: $to) {\n      id\n      startedAt\n      endedAt\n      breakMinutes\n      workMinutes\n      notes\n      entryDate\n      source\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamOverview($from: String!, $to: String!) {\n    teamWorkTimeOverview(from: $from, to: $to) {\n      employeeId\n      employeeName\n      netBalanceMinutes\n      vacationDaysUsed\n    }\n  }\n"): (typeof documents)["\n  query TeamOverview($from: String!, $to: String!) {\n    teamWorkTimeOverview(from: $from, to: $to) {\n      employeeId\n      employeeName\n      netBalanceMinutes\n      vacationDaysUsed\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeReport(\n    $employeeId: ID!\n    $from: String!\n    $to: String!\n    $locale: String\n  ) {\n    employeeMissingRecordDays(employeeId: $employeeId, from: $from, to: $to)\n    employeeAbsenceCategorySummary(\n      employeeId: $employeeId\n      from: $from\n      to: $to\n      locale: $locale\n    ) {\n      categoryId\n      name\n      color\n      fullDays\n      partialDays\n      totalDays\n    }\n    employeeWorkTimeBalance(employeeId: $employeeId, from: $from, to: $to) {\n      employeeId\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    employeeVacationBalance(employeeId: $employeeId, from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    employeeMonthlyWorkTime(employeeId: $employeeId, from: $from, to: $to) {\n      year\n      month\n      plannedMinutes\n      actualMinutes\n      differenceMinutes\n    }\n  }\n"): (typeof documents)["\n  query EmployeeReport(\n    $employeeId: ID!\n    $from: String!\n    $to: String!\n    $locale: String\n  ) {\n    employeeMissingRecordDays(employeeId: $employeeId, from: $from, to: $to)\n    employeeAbsenceCategorySummary(\n      employeeId: $employeeId\n      from: $from\n      to: $to\n      locale: $locale\n    ) {\n      categoryId\n      name\n      color\n      fullDays\n      partialDays\n      totalDays\n    }\n    employeeWorkTimeBalance(employeeId: $employeeId, from: $from, to: $to) {\n      employeeId\n      plannedMinutes\n      workedMinutes\n      vacationMinutes\n      absenceMinutes\n      differenceMinutes\n      openingWorkMinutes\n      paidOvertimeMinutes\n      netBalanceMinutes\n      vacationDaysUsed\n      absenceDaysCount\n    }\n    employeeVacationBalance(employeeId: $employeeId, from: $from, to: $to) {\n      entitlementDays\n      openingDays\n      usedDays\n      remainingDays\n    }\n    employeeMonthlyWorkTime(employeeId: $employeeId, from: $from, to: $to) {\n      year\n      month\n      plannedMinutes\n      actualMinutes\n      differenceMinutes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTimeTracking($input: CreateTimeTrackingInput!) {\n    createTimeTracking(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTimeTracking($input: CreateTimeTrackingInput!) {\n    createTimeTracking(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTimeTracking($input: UpdateTimeTrackingInput!) {\n    updateTimeTracking(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTimeTracking($input: UpdateTimeTrackingInput!) {\n    updateTimeTracking(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTimeTracking($id: ID!) {\n    deleteTimeTracking(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTimeTracking($id: ID!) {\n    deleteTimeTracking(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartTimeTracking($employeeId: ID!) {\n    startTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation StartTimeTracking($employeeId: ID!) {\n    startTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StopTimeTracking($employeeId: ID!) {\n    stopTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation StopTimeTracking($employeeId: ID!) {\n    stopTimeTracking(employeeId: $employeeId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeePeriodOpeningBalances($employeeId: ID!) {\n    employeePeriodOpeningBalances(employeeId: $employeeId) {\n      id\n      employeeId\n      periodId\n      openingWorkMinutes\n      openingVacationDays\n    }\n  }\n"): (typeof documents)["\n  query EmployeePeriodOpeningBalances($employeeId: ID!) {\n    employeePeriodOpeningBalances(employeeId: $employeeId) {\n      id\n      employeeId\n      periodId\n      openingWorkMinutes\n      openingVacationDays\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpsertEmployeePeriodOpeningBalance(\n    $input: UpsertEmployeePeriodOpeningBalanceInput!\n  ) {\n    upsertEmployeePeriodOpeningBalance(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpsertEmployeePeriodOpeningBalance(\n    $input: UpsertEmployeePeriodOpeningBalanceInput!\n  ) {\n    upsertEmployeePeriodOpeningBalance(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmployeePeriodOpeningBalance($id: ID!) {\n    deleteEmployeePeriodOpeningBalance(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmployeePeriodOpeningBalance($id: ID!) {\n    deleteEmployeePeriodOpeningBalance(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeePaidOvertime($employeeId: ID!) {\n    employeePaidOvertime(employeeId: $employeeId) {\n      id\n      employeeId\n      date\n      minutes\n      note\n    }\n  }\n"): (typeof documents)["\n  query EmployeePaidOvertime($employeeId: ID!) {\n    employeePaidOvertime(employeeId: $employeeId) {\n      id\n      employeeId\n      date\n      minutes\n      note\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployeePaidOvertime($input: CreateEmployeePaidOvertimeInput!) {\n    createEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployeePaidOvertime($input: CreateEmployeePaidOvertimeInput!) {\n    createEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmployeePaidOvertime($input: UpdateEmployeePaidOvertimeInput!) {\n    updateEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmployeePaidOvertime($input: UpdateEmployeePaidOvertimeInput!) {\n    updateEmployeePaidOvertime(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmployeePaidOvertime($id: ID!) {\n    deleteEmployeePaidOvertime(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmployeePaidOvertime($id: ID!) {\n    deleteEmployeePaidOvertime(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TimeTrackingPeriods {\n    timeTrackingPeriods {\n      id\n      label\n      startDate\n      endDate\n      status\n    }\n  }\n"): (typeof documents)["\n  query TimeTrackingPeriods {\n    timeTrackingPeriods {\n      id\n      label\n      startDate\n      endDate\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EnsureTimeTrackingPeriod($date: String!) {\n    ensureTimeTrackingPeriod(date: $date) {\n      id\n      label\n    }\n  }\n"): (typeof documents)["\n  mutation EnsureTimeTrackingPeriod($date: String!) {\n    ensureTimeTrackingPeriod(date: $date) {\n      id\n      label\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetTimeTrackingPeriodStatus(\n    $id: ID!\n    $status: TimeTrackingPeriodStatus!\n  ) {\n    setTimeTrackingPeriodStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation SetTimeTrackingPeriodStatus(\n    $id: ID!\n    $status: TimeTrackingPeriodStatus!\n  ) {\n    setTimeTrackingPeriodStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TimeTrackingSettings {\n    holidays {\n      id\n      date\n      name\n      paidPercentage\n      canton\n    }\n    companyVacations {\n      id\n      name\n      startDate\n      endDate\n      appliesToAll\n    }\n  }\n"): (typeof documents)["\n  query TimeTrackingSettings {\n    holidays {\n      id\n      date\n      name\n      paidPercentage\n      canton\n    }\n    companyVacations {\n      id\n      name\n      startDate\n      endDate\n      appliesToAll\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateHoliday($input: CreateHolidayInput!) {\n    createHoliday(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateHoliday($input: CreateHolidayInput!) {\n    createHoliday(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteHoliday($id: ID!) {\n    deleteHoliday(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteHoliday($id: ID!) {\n    deleteHoliday(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {\n    createCompanyVacation(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {\n    createCompanyVacation(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCompanyVacation($id: ID!) {\n    deleteCompanyVacation(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCompanyVacation($id: ID!) {\n    deleteCompanyVacation(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n"): (typeof documents)["\n  mutation AddUserEmail($userId: ID!, $email: String!) {\n    addUserEmail(userId: $userId, email: $email) {\n      id\n      email\n      isPrimary\n      isVerified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangeUserEmail($input: ChangeUserEmailInput!) {\n    changeUserEmail(input: $input) {\n      id\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ChangeUserEmail($input: ChangeUserEmailInput!) {\n    changeUserEmail(input: $input) {\n      id\n      userEmails {\n        id\n        email\n        isPrimary\n        isVerified\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      orgName\n      persona\n      theme\n      isSuperAdmin\n      timeTrackingEnabled\n      isProjectMember\n    }\n  }\n"): (typeof documents)["\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        userEmails {\n          id\n          email\n          isPrimary\n          isVerified\n        }\n      }\n      roles\n      permissions\n      orgId\n      orgName\n      persona\n      theme\n      isSuperAdmin\n      timeTrackingEnabled\n      isProjectMember\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation UpdateMyTheme($input: UpdateMyThemeInput!) {\n    updateMyTheme(input: $input)\n  }\n"): (typeof documents)["\n  mutation UpdateMyTheme($input: UpdateMyThemeInput!) {\n    updateMyTheme(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUser($updateUserInput: UpdateUserInput!) {\n    updateUser(updateUserInput: $updateUserInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveProcessingActivity($id: ID!) {\n    archiveProcessingActivity(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveProcessingActivity($id: ID!) {\n    archiveProcessingActivity(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveSubprocessor($id: ID!) {\n    archiveSubprocessor(id: $id)\n  }\n"): (typeof documents)["\n  mutation ArchiveSubprocessor($id: ID!) {\n    archiveSubprocessor(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProcessingActivities {\n    processingActivities {\n      id\n      name\n      purpose\n      legalBasis\n      dataCategories\n      dataSubjects\n      recipients\n      retentionNote\n    }\n  }\n"): (typeof documents)["\n  query ProcessingActivities {\n    processingActivities {\n      id\n      name\n      purpose\n      legalBasis\n      dataCategories\n      dataSubjects\n      recipients\n      retentionNote\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Subprocessors {\n    subprocessors {\n      id\n      name\n      purpose\n      country\n      dpaSigned\n      url\n      notes\n    }\n  }\n"): (typeof documents)["\n  query Subprocessors {\n    subprocessors {\n      id\n      name\n      purpose\n      country\n      dpaSigned\n      url\n      notes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProcessingActivity($input: CreateProcessingActivityInput!) {\n    createProcessingActivity(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProcessingActivity($input: CreateProcessingActivityInput!) {\n    createProcessingActivity(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProcessingActivity($input: UpdateProcessingActivityInput!) {\n    updateProcessingActivity(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProcessingActivity($input: UpdateProcessingActivityInput!) {\n    updateProcessingActivity(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSubprocessor($input: CreateSubprocessorInput!) {\n    createSubprocessor(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSubprocessor($input: CreateSubprocessorInput!) {\n    createSubprocessor(input: $input) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateSubprocessor($input: UpdateSubprocessorInput!) {\n    updateSubprocessor(input: $input) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSubprocessor($input: UpdateSubprocessorInput!) {\n    updateSubprocessor(input: $input) {\n      id\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;