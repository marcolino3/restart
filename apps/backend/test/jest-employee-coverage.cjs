const path = require('node:path');
const base = require('../package.json').jest;

// The mixed legacy service remains in the report, including its contract paths.
// Thresholds apply to the isolated basis/security logic; do not exclude its failures.
const critical = [
  'employee-management/employees/employee-basis-patch.ts',
  'employee-management/employees/employee-csv.ts',
  'employee-management/employees/employee-account.controller.ts',
  'employee-management/employees/account-email.controller.ts',
  'employee-management/employees/employee-invitation.service.ts',
  'employee-management/employees/employee-storage-cleanup.service.ts',
  'roles/membership-role-assignment.ts',
  'auth/middleware/field-permission.middleware.ts',
];
module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, '../src'),
  testRegex:
    '(employee-management/employees/.*|roles/membership-role-assignment|auth/middleware/field-permission.middleware|user-emails/user-emails.resolver)\\.spec\\.ts$',
  collectCoverage: true,
  collectCoverageFrom: [
    ...critical,
    'employee-management/employees/employees.service.ts',
    'user-emails/user-emails.resolver.ts',
  ],
  coverageDirectory: path.resolve(__dirname, '../coverage/employee'),
  coverageReporters: ['text', 'json-summary', 'lcov'],
  coverageThreshold: Object.fromEntries(
    critical.map((file) => [
      path.resolve(__dirname, '../src', file),
      { lines: 90, branches: 85 },
    ]),
  ),
};
