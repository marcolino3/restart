import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Durable cleanup request; intentionally no FK to the deleted employee. */
@Entity('employee_storage_cleanup')
export class EmployeeStorageCleanup {
  @PrimaryColumn('uuid', { name: 'employee_id' })
  employeeId!: string;
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;
}
