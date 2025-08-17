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
    "\n  mutation CreateOrganization(\n    $createOrganizationInput: CreateOrganizationInput!\n  ) {\n    createOrganization(createOrganizationInput: $createOrganizationInput) {\n      id\n    }\n  }\n": typeof types.CreateOrganizationDocument,
    "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      isActive\n    }\n  }\n": typeof types.GetOrganizationsDocument,
    "\n  query GetCurrentUser {\n    currentUser {\n      id\n      firstName\n      lastName\n      email\n    }\n  }\n": typeof types.GetCurrentUserDocument,
};
const documents: Documents = {
    "\n  mutation CreateEmployeeAbsenceNotice(\n    $createEmployeeAbsenceInput: CreateEmployeeAbsenceNoticeInput!\n  ) {\n    createEmployeeAbsenceNotice(\n      createEmployeeAbsenceInput: $createEmployeeAbsenceInput\n    ) {\n      id\n    }\n  }\n": types.CreateEmployeeAbsenceNoticeDocument,
    "\n  query GetEmployeeAbsenceCategoriesByOrgId {\n    employeeAbsenceCategoriesByOrgId {\n      id\n      systemCode\n    }\n  }\n": types.GetEmployeeAbsenceCategoriesByOrgIdDocument,
    "\n  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {\n    createEmployee(createEmployeeInput: $createEmployeeInput) {\n      id\n    }\n  }\n": types.CreateEmployeeDocument,
    "\n  query GetEmployeeById($employeeId: ID!) {\n    employeeById(employeeId: $employeeId) {\n      id\n      user {\n        firstName\n        lastName\n        email\n      }\n      persona\n      employee {\n        timeTrackingEnabled\n      }\n    }\n  }\n": types.GetEmployeeByIdDocument,
    "\n  query GetEmployees {\n    employeesByOrgId {\n      membership {\n        employee {\n          isActive\n          timeTrackingEnabled\n          id\n        }\n        user {\n          firstName\n          id\n          email\n          lastName\n        }\n        persona\n      }\n    }\n  }\n": types.GetEmployeesDocument,
    "\n  mutation CreateOrganization(\n    $createOrganizationInput: CreateOrganizationInput!\n  ) {\n    createOrganization(createOrganizationInput: $createOrganizationInput) {\n      id\n    }\n  }\n": types.CreateOrganizationDocument,
    "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      isActive\n    }\n  }\n": types.GetOrganizationsDocument,
    "\n  query GetCurrentUser {\n    currentUser {\n      id\n      firstName\n      lastName\n      email\n    }\n  }\n": types.GetCurrentUserDocument,
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
export function graphql(source: "\n  mutation CreateOrganization(\n    $createOrganizationInput: CreateOrganizationInput!\n  ) {\n    createOrganization(createOrganizationInput: $createOrganizationInput) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOrganization(\n    $createOrganizationInput: CreateOrganizationInput!\n  ) {\n    createOrganization(createOrganizationInput: $createOrganizationInput) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      isActive\n    }\n  }\n"): (typeof documents)["\n  query GetOrganizations {\n    organizations {\n      id\n      name\n      isActive\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurrentUser {\n    currentUser {\n      id\n      firstName\n      lastName\n      email\n    }\n  }\n"): (typeof documents)["\n  query GetCurrentUser {\n    currentUser {\n      id\n      firstName\n      lastName\n      email\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;