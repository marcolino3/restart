import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IAdmissionAppointmentType } from '../interfaces/admission-appointment-type.interface';

@ObjectType()
@Entity('admission_appointment_types')
@Index('idx_admission_appointment_types_org', ['organizationId'])
export class AdmissionAppointmentType
  extends AbstractEntity<AdmissionAppointmentType>
  implements IAdmissionAppointmentType
{
  @Field(() => String)
  @Column('text')
  label: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
