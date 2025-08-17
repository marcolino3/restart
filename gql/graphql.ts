/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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

export type CreateOrganizationInput = {
  organizationName: Scalars['String']['input'];
  organizationSlug: Scalars['String']['input'];
  ownerEmail: Scalars['String']['input'];
  ownerFirstName: Scalars['String']['input'];
  ownerLastName: Scalars['String']['input'];
  ownerPassword: Scalars['String']['input'];
};

export type CreatePermissionInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: Scalars['Boolean']['input'];
  module?: InputMaybe<RestartModule>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRoleInput = {
  /** Example field (placeholder) */
  exampleField: Scalars['Int']['input'];
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
  createPermission: Permission;
  createRole: Role;
  createTeam: Team;
  createTeamMember: TeamMember;
  createTimeTracking: TimeTracking;
  createUser: User;
  removeAddress: Address;
  removeAuthAccount: AuthAccount;
  removeCountry: Country;
  removeEmployeeContract: EmployeeContract;
  removeOrganization: Organization;
  removePermission: Permission;
  removeRole: Role;
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
  updatePermission: Permission;
  updateRole: Role;
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


export type MutationCreateOrganizationArgs = {
  createOrganizationInput: CreateOrganizationInput;
};


export type MutationCreatePermissionArgs = {
  createPermissionInput: CreatePermissionInput;
};


export type MutationCreateRoleArgs = {
  createRoleInput: CreateRoleInput;
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


export type MutationRemovePermissionArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRemoveRoleArgs = {
  id: Scalars['Int']['input'];
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


export type MutationUpdatePermissionArgs = {
  updatePermissionInput: UpdatePermissionInput;
};


export type MutationUpdateRoleArgs = {
  updateRoleInput: UpdateRoleInput;
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
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isArchived: Scalars['Boolean']['output'];
  memberships?: Maybe<Array<Membership>>;
  name: Scalars['String']['output'];
  roles?: Maybe<Array<Role>>;
  slug: Scalars['String']['output'];
  teamIds?: Maybe<Array<Scalars['ID']['output']>>;
  teams?: Maybe<Array<Team>>;
  updatedAt: Scalars['DateTime']['output'];
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
  countries: Array<Country>;
  country: Country;
  currentUser: User;
  employeeAbsenceCategoriesByOrgId: Array<EmployeeAbsenceCategory>;
  employeeById: Membership;
  employeeContract: EmployeeContract;
  employeeContracts: Array<EmployeeContract>;
  employeesByOrgId: Array<Employee>;
  organization: Organization;
  organizations: Array<Organization>;
  permission: Permission;
  permissions: Array<Permission>;
  role: Role;
  roles: Array<Role>;
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


export type QueryOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryPermissionArgs = {
  id: Scalars['Int']['input'];
};


export type QueryRoleArgs = {
  id: Scalars['Int']['input'];
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

/** Supported Restart Modules */
export enum RestartModule {
  Employees = 'EMPLOYEES',
  RecordKeeping = 'RECORD_KEEPING'
}

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
  slug?: InputMaybe<Scalars['String']['input']>;
  teamIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type UpdatePermissionInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  module?: InputMaybe<RestartModule>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRoleInput = {
  /** Example field (placeholder) */
  exampleField?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
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

export type CreateOrganizationMutationVariables = Exact<{
  createOrganizationInput: CreateOrganizationInput;
}>;


export type CreateOrganizationMutation = { __typename?: 'Mutation', createOrganization: { __typename?: 'Organization', id: string } };

export type GetOrganizationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganizationsQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name: string, isActive: boolean }> };

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string } };


export const CreateEmployeeAbsenceNoticeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployeeAbsenceNotice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeAbsenceNoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployeeAbsenceNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeAbsenceInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeAbsenceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeAbsenceNoticeMutation, CreateEmployeeAbsenceNoticeMutationVariables>;
export const GetEmployeeAbsenceCategoriesByOrgIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeAbsenceCategoriesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"systemCode"}}]}}]}}]} as unknown as DocumentNode<GetEmployeeAbsenceCategoriesByOrgIdQuery, GetEmployeeAbsenceCategoriesByOrgIdQueryVariables>;
export const CreateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createEmployeeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createEmployeeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeMutation, CreateEmployeeMutationVariables>;
export const GetEmployeeByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployeeById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeeById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"persona"}},{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>;
export const GetEmployeesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmployees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employeesByOrgId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"membership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"timeTrackingEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"persona"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmployeesQuery, GetEmployeesQueryVariables>;
export const CreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createOrganizationInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createOrganizationInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createOrganizationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const GetOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationsQuery, GetOrganizationsQueryVariables>;
export const GetCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<GetCurrentUserQuery, GetCurrentUserQueryVariables>;