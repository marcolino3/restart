import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Protocol } from './protocol.entity';

@ObjectType()
@Entity('protocol_participants')
@Index('UQ_protocol_participant', ['protocolId', 'membershipId'], {
  unique: true,
})
@Index('idx_protocol_participants_membership', ['membershipId'])
export class ProtocolParticipant extends AbstractEntity<ProtocolParticipant> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'protocol_id' })
  protocolId: string;

  @Field(() => Protocol, { nullable: true })
  @ManyToOne(() => Protocol, (protocol) => protocol.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'protocol_id' })
  protocol: Protocol;

  @Field(() => ID)
  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership: Membership;
}
