import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { buildContractVariables } from './contract-placeholders';

const contract = (partial: Partial<EmployeeContract>): EmployeeContract =>
  partial as EmployeeContract;

describe('buildContractVariables', () => {
  it('formats dates, money and numbers in Swiss conventions', () => {
    const vars = buildContractVariables(
      contract({
        startDate: '2026-09-01',
        endDate: null,
        probationEndDate: '2026-11-30',
        grossSalary: 7250.5,
        hourlyRate: null,
        workloadPercent: 80,
        weeklyHours: '33.6',
        annualVacationDays: 25,
        contractType: 'PERMANENT' as EmployeeContract['contractType'],
        position: 'Lehrperson',
        employee: {
          membership: {
            user: {
              firstName: 'Anna',
              lastName: 'Muster',
              street: 'Bahnhofstrasse',
              houseNumber: '12',
              postalCode: '8000',
              city: 'Zürich',
              dateOfBirth: '1990-05-04',
              socialSecurityNumber: '756.1234.5678.97',
            },
          },
        },
      } as unknown as Partial<EmployeeContract>),
      {
        name: 'Schule X',
        street: 'Weg 1',
        zip: '3000',
        city: 'Bern',
      } as Organization,
    );

    expect(vars.employeeFullName).toBe('Anna Muster');
    expect(vars.employeeAddress).toBe('Bahnhofstrasse 12, 8000 Zürich');
    expect(vars.employeeDateOfBirth).toBe('04.05.1990');
    expect(vars.employeeSsn).toBe('756.1234.5678.97');
    expect(vars.startDate).toBe('01.09.2026');
    expect(vars.endDate).toBe('');
    expect(vars.probationEndDate).toBe('30.11.2026');
    expect(vars.grossSalary).toContain('7');
    expect(vars.grossSalary).toContain('250.50');
    expect(vars.hourlyRate).toBe('');
    expect(vars.workloadPercent).toBe('80 %');
    expect(vars.weeklyHours).toBe('33.6');
    expect(vars.annualVacationDays).toBe('25');
    expect(vars.contractType).toBe('Unbefristet');
    expect(vars.orgName).toBe('Schule X');
    expect(vars.orgAddress).toBe('Weg 1, 3000 Bern');
    expect(vars.todayDate).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it('maps missing relations and null fields to empty strings', () => {
    const vars = buildContractVariables(
      contract({ startDate: '2026-01-01' }),
      null,
    );
    expect(vars.employeeFullName).toBe('');
    expect(vars.employeeAddress).toBe('');
    expect(vars.grossSalary).toBe('');
    expect(vars.orgName).toBe('');
    expect(vars.orgAddress).toBe('');
  });
});
