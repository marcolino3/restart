import { defineConfig } from 'vitest/config'
import base from './vitest.config'

const files = [
  'features/employees/actions/employee-onboarding.actions.ts',
  'features/employees/components/wizard/EmployeeOnboardingWizard.tsx',
  'features/employees/lib/to-onboarding-input.ts',
  'features/employees/lib/map-employee-to-onboarding-form.ts',
]
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: files.map((file) => file.replace(/\.(tsx?)$/, '.test.$1')),
    coverage: {
      provider: 'v8',
      enabled: true,
      include: files,
      reportsDirectory: 'coverage/employee',
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: { perFile: true, lines: 90, branches: 85 },
    },
  },
})
