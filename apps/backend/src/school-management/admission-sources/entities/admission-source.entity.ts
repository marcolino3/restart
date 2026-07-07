import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IAdmissionSource } from '../interfaces/admission-source.interface';

@ObjectType()
@Entity('admission_sources')
@Index('idx_admission_sources_org', ['organizationId'])
@Index('UQ_admission_source_org_name', ['organizationId', 'name'], {
  unique: true,
})
export class AdmissionSource
  extends AbstractEntity<AdmissionSource>
  implements IAdmissionSource
{
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  /**
   * Stable key (MANUAL/PUBLIC_FORM/OPEN_DAY/REFERRAL/OTHER) for deterministic
   * backfill in migrations. Internal only — hidden from GraphQL.
   */
  @HideField()
  @Column('text', { name: 'system_key', nullable: true })
  systemKey?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
