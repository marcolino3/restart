import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Org-global UI preferences for the admissions board. Currently holds the
 * column selection for the table view (the Kanban *card* fields are configured
 * per stage on `AdmissionStage.cardFields`). Exactly one row per organization.
 */
@ObjectType()
@Entity('admission_board_settings')
@Index('UQ_admission_board_settings_org', ['organizationId'], { unique: true })
export class AdmissionBoardSettings extends AbstractEntity<AdmissionBoardSettings> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  /**
   * Ordered list of table column keys. `null` falls back to the frontend
   * default set. See `apps/backend/.../admission-stages/admission-field-keys.ts`.
   */
  @Field(() => [String], { nullable: true })
  @Column('jsonb', { name: 'table_columns', nullable: true })
  tableColumns?: string[] | null;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
