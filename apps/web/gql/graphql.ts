/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type Address = {
  __typename?: 'Address';
  addressLine1?: Maybe<Scalars['String']['output']>;
  addressLine2?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Country>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  postalCode?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type AuthAccount = {
  __typename?: 'AuthAccount';
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['output'];
};

export type AuthContextOutput = {
  __typename?: 'AuthContextOutput';
  isSuperAdmin: Scalars['Boolean']['output'];
  orgId?: Maybe<Scalars['String']['output']>;
  permissions: Array<Scalars['String']['output']>;
  roles: Array<Scalars['String']['output']>;
  user: User;
};

export type Country = {
  __typename?: 'Country';
  createdAt: Scalars['DateTime']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isoCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type CreateAddressInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateAuthAccountInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateCountryInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateEmployeeAbsenceNoticeInput = {
  absenceCategoryId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  isTeamInformed: Scalars['Boolean']['input'];
  note: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type CreateEmployeeContractInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateEmployeeInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  persona: Persona;
};

export type CreateOrganizationSettingInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  value: Scalars['String']['input'];
};

export type CreateTeamInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateTeamMemberInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateTimeTrackingInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  isActive?: Scalars['Boolean']['input'];
  lastName: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type Employee = {
  __typename?: 'Employee';
  absences?: Maybe<EmployeeAbsence>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  membership: Membership;
  timeTrackingEnabled: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsence = {
  __typename?: 'EmployeeAbsence';
  absenceCategoryId: Scalars['String']['output'];
  absenceDays?: Maybe<Array<EmployeeAbsenceDay>>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee: Employee;
  employeeId: Scalars['String']['output'];
  endDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isTeamInformed: Scalars['Boolean']['output'];
  membershipId: Scalars['String']['output'];
  note: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  startDate: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsenceCategory = {
  __typename?: 'EmployeeAbsenceCategory';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isSystem: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  systemCode?: Maybe<SystemEmployeeAbsenceCategory>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeAbsenceDay = {
  __typename?: 'EmployeeAbsenceDay';
  absenceCategory?: Maybe<EmployeeAbsenceCategory>;
  absenceCategoryId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee: Employee;
  employeeAbsence: EmployeeAbsence;
  employeeAbsenceId: Scalars['ID']['output'];
  employeeId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type EmployeeContract = {
  __typename?: 'EmployeeContract';
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['output'];
};

export type Membership = {
  __typename?: 'Membership';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  employee?: Maybe<Employee>;
  employeeId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  persona: Persona;
  roles?: Maybe<Array<Role>>;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
  version: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createAddress: Address;
  createAuthAccount: AuthAccount;
  createCountry: Country;
  createEmployee: Employee;
  createEmployeeAbsenceNotice: EmployeeAbsence;
  createEmployeeContract: EmployeeContract;
  createOrganization: Organization;
  createOrganizationSetting: OrganizationSettingOutput;
  createTeam: Team;
  createTeamMember: TeamMember;
  createTimeTracking: TimeTracking;
  createUser: User;
  deleteOrganizationSetting: Scalars['Boolean']['output'];
  removeAddress: Address;
  removeAuthAccount: AuthAccount;
  removeCountry: Country;
  removeEmployeeContract: EmployeeContract;
  removeOrganization: Organization;
  removeTeam: Team;
  removeTeamMember: TeamMember;
  removeTimeTracking: TimeTracking;
  removeUser: User;
  seedSystemEmployeeAbsenceCategories: EmployeeAbsenceCategory;
  updateAddress: Address;
  updateAuthAccount: AuthAccount;
  updateCountry: Country;
  updateEmployee: Employee;
  updateEmployeeContract: EmployeeContract;
  updateOrganization: Organization;
  updateOrganizationSetting: OrganizationSettingOutput;
  updateRolePermissions: Role;
  updateTeam: Team;
  updateTeamMember: TeamMember;
  updateTimeTracking: TimeTracking;
  updateUser: User;
};


export type MutationCreateAddressArgs = {
  createAddressInput: CreateAddressInput;
};


export type MutationCreateAuthAccountArgs = {
  createAuthAccountInput: CreateAuthAccountInput;
};


export type MutationCreateCountryArgs = {
  createCountryInput: CreateCountryInput;
};


export type MutationCreateEmployeeArgs = {
  createEmployeeInput: CreateEmployeeInput;
};


export type MutationCreateEmployeeAbsenceNoticeArgs = {
  createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput;
};


export type MutationCreateEmployeeContractArgs = {
  createEmployeeContractInput: CreateEmployeeContractInput;
};


export type MutationCreateOrganizationSettingArgs = {
  input: CreateOrganizationSettingInput;
};


export type MutationCreateTeamArgs = {
  createTeamInput: CreateTeamInput;
};


export type MutationCreateTeamMemberArgs = {
  createTeamMemberInput: CreateTeamMemberInput;
};


export type MutationCreateTimeTrackingArgs = {
  createTimeTrackingInput: CreateTimeTrackingInput;
};


export type MutationCreateUserArgs = {
  createUserInput: CreateUserInput;
};


export type MutationDeleteOrganizationSettingArgs = {
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationRemoveAddressArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveAuthAccountArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveCountryArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveEmployeeContractArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveTeamArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveTeamMemberArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveTimeTrackingArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSeedSystemEmployeeAbsenceCategoriesArgs = {
  orgId: Scalars['String']['input'];
};


export type MutationUpdateAddressArgs = {
  updateAddressInput: UpdateAddressInput;
};


export type MutationUpdateAuthAccountArgs = {
  updateAuthAccountInput: UpdateAuthAccountInput;
};


export type MutationUpdateCountryArgs = {
  updateCountryInput: UpdateCountryInput;
};


export type MutationUpdateEmployeeArgs = {
  updateEmployeeInput: UpdateEmployeeInput;
};


export type MutationUpdateEmployeeContractArgs = {
  updateEmployeeContractInput: UpdateEmployeeContractInput;
};


export type MutationUpdateOrganizationArgs = {
  updateOrganizationInput: UpdateOrganizationInput;
};


export type MutationUpdateOrganizationSettingArgs = {
  input: UpdateOrganizationSettingInput;
};


export type MutationUpdateRolePermissionsArgs = {
  input: UpdateRolePermissionsInput;
};


export type MutationUpdateTeamArgs = {
  updateTeamInput: UpdateTeamInput;
};


export type MutationUpdateTeamMemberArgs = {
  updateTeamMemberInput: UpdateTeamMemberInput;
};


export type MutationUpdateTimeTrackingArgs = {
  updateTimeTrackingInput: UpdateTimeTrackingInput;
};


export type MutationUpdateUserArgs = {
  updateUserInput: UpdateUserInput;
};

export type Organization = {
  __typename?: 'Organization';
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  memberships?: Maybe<Array<Membership>>;
  name?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  roles?: Maybe<Array<Role>>;
  slug?: Maybe<Scalars['String']['output']>;
  street?: Maybe<Scalars['String']['output']>;
  teamIds?: Maybe<Array<Scalars['ID']['output']>>;
  teams?: Maybe<Array<Team>>;
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
  website?: Maybe<Scalars['String']['output']>;
  zip?: Maybe<Scalars['String']['output']>;
};

export type OrganizationSettingOutput = {
  __typename?: 'OrganizationSettingOutput';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  hasValue: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  code: PermissionCode;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  roles?: Maybe<Array<Role>>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Supported Permission Codes */
export enum PermissionCode {
  BillingManage = 'BILLING_MANAGE',
  EmployeeRead = 'EMPLOYEE_READ',
  EmployeeWrite = 'EMPLOYEE_WRITE',
  OrgDelete = 'ORG_DELETE',
  OrgTransferOwnership = 'ORG_TRANSFER_OWNERSHIP',
  RoleAssign = 'ROLE_ASSIGN',
  RoleCreate = 'ROLE_CREATE',
  RoleDelete = 'ROLE_DELETE',
  TeamCreate = 'TEAM_CREATE',
  TeamDelete = 'TEAM_DELETE',
  TeamManage = 'TEAM_MANAGE',
  TimesheetRead = 'TIMESHEET_READ',
  TimesheetWrite = 'TIMESHEET_WRITE',
  UserInvite = 'USER_INVITE',
  UserRemove = 'USER_REMOVE'
}

export enum Persona {
  Admin = 'ADMIN',
  Employee = 'EMPLOYEE',
  Hr = 'HR',
  Office = 'OFFICE',
  Parent = 'PARENT',
  Student = 'STUDENT',
  Teacher = 'TEACHER'
}

export type Query = {
  __typename?: 'Query';
  address: Address;
  addresses: Array<Address>;
  authAccount: AuthAccount;
  authAccounts: Array<AuthAccount>;
  authContext: AuthContextOutput;
  countries: Array<Country>;
  country: Country;
  currentUser: User;
  employeeAbsenceCategoriesByOrgId: Array<EmployeeAbsenceCategory>;
  employeeById: Membership;
  employeeContract: EmployeeContract;
  employeeContracts: Array<EmployeeContract>;
  employeesByOrgId: Array<Employee>;
  isOrganizationSlugAvailable: Scalars['Boolean']['output'];
  organization: Organization;
  organizationSetting: OrganizationSettingOutput;
  organizationSettings: Array<OrganizationSettingOutput>;
  organizations: Array<Organization>;
  permissions: Array<Permission>;
  rolesByOrgId: Array<Role>;
  team: Team;
  teamMember: TeamMember;
  teamMembers: Array<TeamMember>;
  teams: Array<Team>;
  timeTracking: TimeTracking;
  user: User;
  users: Array<User>;
};


export type QueryAddressArgs = {
  id: Scalars['Int']['input'];
};


export type QueryAuthAccountArgs = {
  id: Scalars['Int']['input'];
};


export type QueryCountryArgs = {
  id: Scalars['Int']['input'];
};


export type QueryEmployeeByIdArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeContractArgs = {
  id: Scalars['Int']['input'];
};


export type QueryIsOrganizationSlugAvailableArgs = {
  slug: Scalars['String']['input'];
};


export type QueryOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryOrganizationSettingArgs = {
  decrypt?: Scalars['Boolean']['input'];
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};


export type QueryOrganizationSettingsArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QueryTeamArgs = {
  id: Scalars['Int']['input'];
};


export type QueryTeamMemberArgs = {
  id: Scalars['Int']['input'];
};


export type QueryTimeTrackingArgs = {
  id: Scalars['Int']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type Role = {
  __typename?: 'Role';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isSystem: Scalars['Boolean']['output'];
  memberships?: Maybe<Array<Membership>>;
  name?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  permissions?: Maybe<Array<Permission>>;
  systemCode?: Maybe<SystemRole>;
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

/** Supported System Employee Absence Category */
export enum SystemEmployeeAbsenceCategory {
  Accident = 'ACCIDENT',
  ChildcareSick = 'CHILDCARE_SICK',
  CivilService = 'CIVIL_SERVICE',
  Funeral = 'FUNERAL',
  MilitaryService = 'MILITARY_SERVICE',
  Move = 'MOVE',
  Other = 'OTHER',
  Sickness = 'SICKNESS',
  Training = 'TRAINING'
}

/** Supported System Roles */
export enum SystemRole {
  Employee = 'EMPLOYEE',
  HrManager = 'HR_MANAGER',
  Office = 'OFFICE',
  OrgAdmin = 'ORG_ADMIN',
  OrgOwner = 'ORG_OWNER',
  TeamLead = 'TEAM_LEAD'
}

export type Team = {
  __typename?: 'Team';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type TeamMember = {
  __typename?: 'TeamMember';
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['output'];
};

export type TimeTracking = {
  __typename?: 'TimeTracking';
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['output'];
};

export type UpdateAddressInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateAuthAccountInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateCountryInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateEmployeeContractInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateEmployeeInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  persona?: InputMaybe<Persona>;
};

export type UpdateOrganizationInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  domain?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationName?: InputMaybe<Scalars['String']['input']>;
  organizationSlug?: InputMaybe<Scalars['String']['input']>;
  ownerEmail?: InputMaybe<Scalars['String']['input']>;
  ownerFirstName?: InputMaybe<Scalars['String']['input']>;
  ownerLastName?: InputMaybe<Scalars['String']['input']>;
  ownerPassword?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  street?: InputMaybe<Scalars['String']['input']>;
  teamIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationSettingInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRolePermissionsInput = {
  permissionCodes: Array<Scalars['String']['input']>;
  roleId: Scalars['ID']['input'];
};

export type UpdateTeamInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateTeamMemberInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateTimeTrackingInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  isSuperAdmin?: Maybe<Scalars['Boolean']['output']>;
  lastName: Scalars['String']['output'];
  memberships: Array<Membership>;
  updatedAt: Scalars['DateTime']['output'];
  username?: Maybe<Scalars['String']['output']>;
  version: Scalars['Int']['output'];
};

export type CreateEmployeeAbsenceNoticeMutationVariables = Exact<{
  createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput;
}>;


export type CreateEmployeeAbsenceNoticeMutation = { __typename?: 'Mutation', createEmployeeAbsenceNotice: { __typename?: 'EmployeeAbsence', id: string } };

export type GetEmployeeAbsenceCategoriesByOrgIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmployeeAbsenceCategoriesByOrgIdQuery = { __typename?: 'Query', employeeAbsenceCategoriesByOrgId: Array<{ __typename?: 'EmployeeAbsenceCategory', id: string, systemCode?: SystemEmployeeAbsenceCategory | null }> };

export type CreateEmployeeMutationVariables = Exact<{
  createEmployeeInput: CreateEmployeeInput;
}>;


export type CreateEmployeeMutation = { __typename?: 'Mutation', createEmployee: { __typename?: 'Employee', id: string } };

export type GetEmployeeByIdQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
}>;


export type GetEmployeeByIdQuery = { __typename?: 'Query', employeeById: { __typename?: 'Membership', id: string, persona: Persona, user?: { __typename?: 'User', firstName: string, lastName: string, email: string } | null, employee?: { __typename?: 'Employee', timeTrackingEnabled: boolean } | null } };

export type GetEmployeesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmployeesQuery = { __typename?: 'Query', employeesByOrgId: Array<{ __typename?: 'Employee', membership: { __typename?: 'Membership', persona: Persona, employee?: { __typename?: 'Employee', isActive: boolean, timeTrackingEnabled: boolean, id: string } | null, user?: { __typename?: 'User', firstName: string, id: string, email: string, lastName: string } | null } }> };

export type CreateOrganizationSettingMutationVariables = Exact<{
  input: CreateOrganizationSettingInput;
}>;


export type CreateOrganizationSettingMutation = { __typename?: 'Mutation', createOrganizationSetting: { __typename?: 'OrganizationSettingOutput', id: string, key: string, description?: string | null, hasValue: boolean } };

export type DeleteOrganizationSettingMutationVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  key: Scalars['String']['input'];
}>;


export type DeleteOrganizationSettingMutation = { __typename?: 'Mutation', deleteOrganizationSetting: boolean };

export type GetOrganizationSettingQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  key: Scalars['String']['input'];
  decrypt: Scalars['Boolean']['input'];
}>;


export type GetOrganizationSettingQuery = { __typename?: 'Query', organizationSetting: { __typename?: 'OrganizationSettingOutput', id: string, organizationId: string, key: string, description?: string | null, hasValue: boolean, value?: string | null, version: number, createdAt: any, updatedAt: any } };

export type GetOrganizationSettingsQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
}>;


export type GetOrganizationSettingsQuery = { __typename?: 'Query', organizationSettings: Array<{ __typename?: 'OrganizationSettingOutput', id: string, organizationId: string, key: string, description?: string | null, hasValue: boolean, version: number, createdAt: any, updatedAt: any }> };

export type UpdateOrganizationSettingMutationVariables = Exact<{
  input: UpdateOrganizationSettingInput;
}>;


export type UpdateOrganizationSettingMutation = { __typename?: 'Mutation', updateOrganizationSetting: { __typename?: 'OrganizationSettingOutput', id: string, key: string, description?: string | null, hasValue: boolean } };

export type IsOrganizationSlugAvailableQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type IsOrganizationSlugAvailableQuery = { __typename?: 'Query', isOrganizationSlugAvailable: boolean };

export type CreateOrganizationMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateOrganizationMutation = { __typename?: 'Mutation', createOrganization: { __typename?: 'Organization', id: string } };

export type OrganizationQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type OrganizationQuery = { __typename?: 'Query', organization: { __typename?: 'Organization', id: string, name?: string | null, slug?: string | null, domain?: string | null, street?: string | null, zip?: string | null, city?: string | null, country?: string | null, phone?: string | null, email?: string | null, website?: string | null, timezone: string, isActive: boolean, createdAt: any, updatedAt: any } };

export type GetOrganizationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationsQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name?: string | null, slug?: string | null, domain?: string | null, isActive: boolean }> };

export type RemoveOrganizationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveOrganizationMutation = { __typename?: 'Mutation', removeOrganization: { __typename?: 'Organization', id: string } };

export type UpdateOrganizationMutationVariables = Exact<{
  updateOrganizationInput: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization: { __typename?: 'Organization', id: string, name?: string | null, slug?: string | null } };

export type GetPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPermissionsQuery = { __typename?: 'Query', permissions: Array<{ __typename?: 'Permission', id: string, code: PermissionCode, name: string, description?: string | null }> };

export type GetRolesByOrgIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRolesByOrgIdQuery = { __typename?: 'Query', rolesByOrgId: Array<{ __typename?: 'Role', id: string, name?: string | null, systemCode?: SystemRole | null, isSystem: boolean, permissions?: Array<{ __typename?: 'Permission', id: string, code: PermissionCode, name: string }> | null }> };

export type UpdateRolePermissionsMutationVariables = Exact<{
  input: UpdateRolePermissionsInput;
}>;


export type UpdateRolePermissionsMutation = { __typename?: 'Mutation', updateRolePermissions: { __typename?: 'Role', id: string, permissions?: Array<{ __typename?: 'Permission', id: string, code: PermissionCode }> | null } };

export type GetAuthContextQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthContextQuery = { __typename?: 'Query', authContext: { __typename?: 'AuthContextOutput', roles: Array<string>, permissions: Array<string>, orgId?: string | null, isSuperAdmin: boolean, user: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } } };


export const CreateEmployeeAbsenceNoticeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeAbsenceNotice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeAbsenceNoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeAbsenceNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeAbsenceInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeAbsenceNoticeMutation, CreateEmployeeAbsenceNoticeMutationVariables>;
export const GetEmployeeAbsenceCategoriesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeAbsenceCategoriesByOrgIdQuery, GetEmployeeAbsenceCategoriesByOrgIdQueryVariables>;
export const CreateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeMutation, CreateEmployeeMutationVariables>;
export const GetEmployeeByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>;
export const GetEmployeesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"persona"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeesQuery, GetEmployeesQueryVariables>;
export const CreateOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationSettingMutation, CreateOrganizationSettingMutationVariables>;
export const DeleteOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOrganizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}]}}]} as unknown as DocumentNode<DeleteOrganizationSettingMutation, DeleteOrganizationSettingMutationVariables>;
export const GetOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"decrypt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"Argument","name":{"kind":"Name","value":"decrypt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"decrypt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationSettingQuery, GetOrganizationSettingQueryVariables>;
export const GetOrganizationSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>;
export const UpdateOrganizationSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganizationSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"hasValue"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationSettingMutation, UpdateOrganizationSettingMutationVariables>;
export const IsOrganizationSlugAvailableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsOrganizationSlugAvailable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isOrganizationSlugAvailable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}]}]}}]} as unknown as DocumentNode<IsOrganizationSlugAvailableQuery, IsOrganizationSlugAvailableQueryVariables>;
export const CreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const OrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Organization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"street"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<OrganizationQuery, OrganizationQueryVariables>;
export const GetOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationsQuery, GetOrganizationsQueryVariables>;
export const RemoveOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveOrganizationMutation, RemoveOrganizationMutationVariables>;
export const UpdateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateOrganizationInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateOrganizationInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateOrganizationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const GetPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetPermissionsQuery, GetPermissionsQueryVariables>;
export const GetRolesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRolesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rolesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetRolesByOrgIdQuery, GetRolesByOrgIdQueryVariables>;
export const UpdateRolePermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRolePermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRolePermissionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRolePermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateRolePermissionsMutation, UpdateRolePermissionsMutationVariables>;
export const GetAuthContextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"orgId"}},{"kind":"Field","name":{"kind":"Name","value":"isSuperAdmin"}}]}}]}}]} as unknown as DocumentNode<GetAuthContextQuery, GetAuthContextQueryVariables>;