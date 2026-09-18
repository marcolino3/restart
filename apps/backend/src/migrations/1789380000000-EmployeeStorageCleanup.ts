import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmployeeStorageCleanup1789380000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      'CREATE TABLE employee_storage_cleanup (employee_id uuid PRIMARY KEY, organization_id uuid NOT NULL)',
    );
    await runner.query(
      'CREATE UNIQUE INDEX uq_employee_invitation_employee ON employee_account_invitations(employee_id)',
    );
  }
  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Pending employee cleanup must be retained; use a forward correction.',
      ),
    );
  }
}
