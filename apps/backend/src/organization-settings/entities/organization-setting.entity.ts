import { Field, HideField, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';

@ObjectType()
@Entity('organization_settings')
@Unique(['organizationId', 'key'])
export class OrganizationSetting extends AbstractEntity<OrganizationSetting> {
  @Field()
  @Column('uuid')
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Field()
  @Column('varchar', { length: 255 })
  key: string;

  @HideField()
  @Column('text')
  encryptedValue: string;

  @HideField()
  @Column('text')
  iv: string;

  @HideField()
  @Column('text')
  authTag: string;

  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 500, nullable: true })
  description?: string;
}
