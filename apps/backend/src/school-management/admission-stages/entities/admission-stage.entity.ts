import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionStageType } from '../enums/admission-stage-type.enum';
import { IAdmissionStage } from '../interfaces/admission-stage.interface';

@ObjectType()
@Entity('admission_stages')
@Index('idx_admission_stages_org', ['organizationId'])
@Index('UQ_admission_stage_org_slug', ['organizationId', 'slug'], {
  unique: true,
})
export class AdmissionStage
  extends AbstractEntity<AdmissionStage>
  implements IAdmissionStage
{
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String)
  @Column('text')
  slug: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => AdmissionStageType)
  @Column('enum', {
    enum: AdmissionStageType,
    name: 'stage_type',
    default: AdmissionStageType.IN_PROGRESS,
  })
  stageType: AdmissionStageType;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_default', default: false })
  isDefault: boolean;

  /**
   * Per-stage list of optional card field keys to display on the Kanban card.
   * `null` falls back to the frontend default set. See `admission-field-keys.ts`.
   */
  @Field(() => [String], { nullable: true })
  @Column('jsonb', { name: 'card_fields', nullable: true })
  cardFields?: string[] | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
