import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import {
  CONTRACT_TYPE_RULES,
  assertContractTypeFields,
  clearHiddenContractFields,
  contractTypeRules,
  missingRequiredContractFields,
} from './contract-type-rules';
import { EmployeeContractType } from './entities/employee-contract.entity';

describe('contract-type-rules', () => {
  it('covers every contract type', () => {
    for (const type of Object.values(EmployeeContractType)) {
      expect(CONTRACT_TYPE_RULES[type]).toBeDefined();
    }
  });

  it('treats an unset contract type as fully optional', () => {
    const rules = contractTypeRules(null);
    expect(Object.values(rules).every((mode) => mode === 'optional')).toBe(
      true,
    );
    expect(missingRequiredContractFields({}, null)).toEqual([]);
  });

  describe('required fields', () => {
    it('requires an end date for fixed-term contracts', () => {
      expect(
        missingRequiredContractFields(
          { grossSalary: 6000 },
          EmployeeContractType.TEMPORARY,
        ),
      ).toEqual(['endDate']);
    });

    it('accepts a fixed-term contract with end date and salary', () => {
      expect(
        missingRequiredContractFields(
          { endDate: '2027-07-31', grossSalary: 6000 },
          EmployeeContractType.TEMPORARY,
        ),
      ).toEqual([]);
    });

    it('requires a gross salary for permanent contracts', () => {
      expect(
        missingRequiredContractFields({}, EmployeeContractType.PERMANENT),
      ).toEqual(['grossSalary']);
    });

    it('requires an hourly rate instead of a salary for hourly contracts', () => {
      expect(
        missingRequiredContractFields(
          { grossSalary: 6000 },
          EmployeeContractType.HOURLY,
        ),
      ).toEqual(['hourlyRate']);
      expect(
        missingRequiredContractFields(
          { hourlyRate: 45 },
          EmployeeContractType.HOURLY,
        ),
      ).toEqual([]);
    });

    it('requires end date and hourly rate for substitutes', () => {
      expect(
        missingRequiredContractFields({}, EmployeeContractType.SUBSTITUTE),
      ).toEqual(['endDate', 'hourlyRate']);
    });

    it('requires nothing beyond the defaults for freelance contracts', () => {
      expect(
        missingRequiredContractFields({}, EmployeeContractType.EXTERNAL),
      ).toEqual([]);
    });

    it('treats empty strings as missing', () => {
      expect(
        missingRequiredContractFields(
          { endDate: '', grossSalary: 6000 },
          EmployeeContractType.TEMPORARY,
        ),
      ).toEqual(['endDate']);
    });

    it('accepts a zero gross salary as a deliberate value', () => {
      expect(
        missingRequiredContractFields(
          { grossSalary: 0 },
          EmployeeContractType.PERMANENT,
        ),
      ).toEqual([]);
    });
  });

  describe('assertContractTypeFields', () => {
    it('throws with the missing field names', () => {
      expect(() =>
        assertContractTypeFields({}, EmployeeContractType.SUBSTITUTE),
      ).toThrow(BadRequestException);
      expect(() =>
        assertContractTypeFields({}, EmployeeContractType.SUBSTITUTE),
      ).toThrow(/endDate, hourlyRate/);
    });

    it('passes when all required fields are present', () => {
      expect(() =>
        assertContractTypeFields(
          { endDate: '2027-01-31', hourlyRate: 50 },
          EmployeeContractType.SUBSTITUTE,
        ),
      ).not.toThrow();
    });
  });

  describe('workload percentage', () => {
    it('does not apply to staff paid by the hour', () => {
      for (const type of [
        EmployeeContractType.HOURLY,
        EmployeeContractType.SUBSTITUTE,
        EmployeeContractType.EXTERNAL,
      ]) {
        expect(contractTypeRules(type).workloadPercent).toBe('hidden');
      }
    });

    it('applies to salaried contracts', () => {
      for (const type of [
        EmployeeContractType.PERMANENT,
        EmployeeContractType.TEMPORARY,
        EmployeeContractType.INTERNSHIP,
        EmployeeContractType.APPRENTICESHIP,
      ]) {
        expect(contractTypeRules(type).workloadPercent).toBe('optional');
      }
    });

    it('is never required, since it can be derived from the weekly schedule', () => {
      for (const type of Object.values(EmployeeContractType)) {
        expect(contractTypeRules(type).workloadPercent).not.toBe('required');
      }
    });
  });

  describe('clearHiddenContractFields', () => {
    it('drops salary, vacation days, workload and weekly hours on hourly contracts', () => {
      const values = {
        endDate: '2027-01-31',
        probationEndDate: '2026-10-31',
        grossSalary: 6000,
        hourlyRate: 45,
        paymentInterval: 'MONTHLY_X12',
        has13thSalary: true,
        annualVacationDays: 25,
        workloadPercent: 53.2,
        weeklyHours: '42',
      };

      clearHiddenContractFields(values, EmployeeContractType.HOURLY);

      expect(values).toEqual({
        endDate: '2027-01-31',
        probationEndDate: null,
        grossSalary: null,
        hourlyRate: 45,
        paymentInterval: null,
        has13thSalary: null,
        annualVacationDays: null,
        workloadPercent: null,
        weeklyHours: null,
      });
    });

    it('keeps the workload on salaried contracts', () => {
      const values = { workloadPercent: 53.2, grossSalary: 6000 };

      clearHiddenContractFields(values, EmployeeContractType.PERMANENT);

      expect(values.workloadPercent).toBe(53.2);
    });

    it('drops the hourly rate on permanent contracts', () => {
      const values = { grossSalary: 6000, hourlyRate: 45 };

      clearHiddenContractFields(values, EmployeeContractType.PERMANENT);

      expect(values).toEqual({ grossSalary: 6000, hourlyRate: null });
    });

    it('keeps everything when no contract type is set', () => {
      const values = { grossSalary: 6000, hourlyRate: 45 };

      clearHiddenContractFields(values, null);

      expect(values).toEqual({ grossSalary: 6000, hourlyRate: 45 });
    });
  });
});

/**
 * The web forms are driven by a copy of this table in
 * `packages/shared-schemas` — the backend cannot import that ESM/Zod package.
 * Drift would make the UI offer fields the server rejects or clears, so the
 * copy is compared here by reading its source.
 */
describe('contract-type-rules parity with shared-schemas', () => {
  const SHARED_RULES_PATH = join(
    __dirname,
    '../../../../../packages/shared-schemas/src/employees/contract-type-rules.ts',
  );

  /**
   * Extracts the `CONTRACT_TYPE_RULES` literal from the shared source. Relies on
   * the repo-wide Prettier formatting (two spaces per level, double quotes); if
   * the parse ever comes up empty the assertion below fails loudly rather than
   * silently passing.
   */
  function parseSharedRules(): Record<string, Record<string, string>> {
    const source = readFileSync(SHARED_RULES_PATH, 'utf8');
    const start = source.indexOf('export const CONTRACT_TYPE_RULES');
    const end = source.indexOf('export const UNSPECIFIED_CONTRACT_TYPE_RULES');
    const table = source.slice(start, end);

    const parsed: Record<string, Record<string, string>> = {};
    let current: Record<string, string> | null = null;
    for (const line of table.split('\n')) {
      const typeStart = /^ {2}(\w+): \{$/.exec(line);
      if (typeStart) {
        current = {};
        parsed[typeStart[1]] = current;
        continue;
      }
      const field = /^ {4}(\w+): "(\w+)",$/.exec(line);
      if (field && current) current[field[1]] = field[2];
    }
    return parsed;
  }

  it('mirrors the backend table field by field', () => {
    const shared = parseSharedRules();

    expect(Object.keys(shared).sort()).toEqual(
      Object.values(EmployeeContractType).sort(),
    );
    expect(shared).toEqual(CONTRACT_TYPE_RULES);
  });
});
