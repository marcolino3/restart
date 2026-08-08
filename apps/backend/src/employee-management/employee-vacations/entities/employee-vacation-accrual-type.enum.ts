import { registerEnumType } from '@nestjs/graphql';

/**
 * How an individual employee vacation is accounted against the vacation
 * budget.
 *
 * - CHARGED: deducted from the employee's vacation-day balance (default).
 * - PAID_NO_CHARGE: paid time off that does not reduce the balance.
 * - UNPAID: unpaid leave, does not reduce the balance.
 */
export enum EmployeeVacationAccrualType {
  CHARGED = 'CHARGED',
  PAID_NO_CHARGE = 'PAID_NO_CHARGE',
  UNPAID = 'UNPAID',
}

registerEnumType(EmployeeVacationAccrualType, {
  name: 'EmployeeVacationAccrualType',
  description:
    'How an individual vacation is accounted against the vacation budget',
});
