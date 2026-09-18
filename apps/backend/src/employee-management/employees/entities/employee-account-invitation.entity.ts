import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from './employee.entity';

@Entity('employee_account_invitations')
export class EmployeeAccountInvitation extends AbstractEntity<EmployeeAccountInvitation> {
  @Index({ unique: true })
  @Column('varchar', { length: 64, name: 'token_hash' })
  tokenHash!: string;
  @Index('uq_employee_invitation_employee', { unique: true })
  @Column('uuid', { name: 'employee_id' })
  employeeId!: string;
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;
  @Column('varchar', { length: 320 })
  email!: string;
  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;
  @Column('timestamptz', { name: 'consumed_at', nullable: true })
  consumedAt?: Date | null;
}
