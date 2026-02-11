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
    "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeAbsenceNoticeDocument,
    "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n": typeof types.GetEmployeeAbsenceCategoriesByOrgIdDocument,
    "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n": typeof types.CreateEmployeeDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      user {\n        firstName\n        lastName\n        email\n      }\n      persona\n      employee {\n        timeTrackingEnabled\n      }\n    }\n  }\n": typeof types.GetEmployeeByIdDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          email\n          lastName\n        }\n        persona\n      }\n    }\n  }\n": typeof types.GetEmployeesDocument,
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
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        email\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n": typeof types.GetAuthContextDocument,
};
const documents: Documents = {
    "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n": types.CreateEmployeeAbsenceNoticeDocument,
    "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n": types.GetEmployeeAbsenceCategoriesByOrgIdDocument,
    "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n": types.CreateEmployeeDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      user {\n        firstName\n        lastName\n        email\n      }\n      persona\n      employee {\n        timeTrackingEnabled\n      }\n    }\n  }\n": types.GetEmployeeByIdDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          email\n          lastName\n        }\n        persona\n      }\n    }\n  }\n": types.GetEmployeesDocument,
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
    "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        email\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n": types.GetAuthContextDocument,
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
export function graphql(source: "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      user {\n        firstName\n        lastName\n        email\n      }\n      persona\n      employee {\n        timeTrackingEnabled\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      user {\n        firstName\n        lastName\n        email\n      }\n      persona\n      employee {\n        timeTrackingEnabled\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          email\n          lastName\n        }\n        persona\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          email\n          lastName\n        }\n        persona\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        email\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n"): (typeof documents)["\n  query GetAuthContext {\n    authContext {\n      user {\n        id\n        firstName\n        lastName\n        email\n      }\n      roles\n      permissions\n      orgId\n      isSuperAdmin\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;