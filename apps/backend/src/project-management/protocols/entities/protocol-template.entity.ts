import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AgendaItem } from './protocol-sections.output';

/**
 * Vorlage für Sitzungsprotokolle: definiert die Traktanden-Struktur und die
 * Standard-Teilnehmenden. Wird beim Erstellen eines Protokolls angewendet
 * (Traktanden + Teilnehmerliste kopiert) und kann aus einem bestehenden
 * Protokoll heraus gespeichert werden ("Als Vorlage speichern").
 */
@ObjectType()
@Entity('protocol_templates')
@Index('idx_protocol_templates_org', ['organizationId'])
export class ProtocolTemplate extends AbstractEntity<ProtocolTemplate> {
  @Field(() => String)
  @Column('text')
  title: string;

  // Traktanden-Struktur (gleiches Shape wie Protocol.sections.agendaItems).
  @Field(() => [AgendaItem])
  @Column('jsonb', { name: 'agenda_items', default: [] })
  agendaItems: AgendaItem[];

  // Standard-Teilnehmende; beim Anwenden gegen die Org validiert, nicht mehr
  // existierende Memberships werden still übersprungen.
  @Field(() => [ID])
  @Column('jsonb', { name: 'default_participant_membership_ids', default: [] })
  defaultParticipantMembershipIds: string[];

  // "12× verwendet" im Vorlagen-Dialog; erhöht beim Anwenden.
  @Field(() => Int)
  @Column('integer', { name: 'used_count', default: 0 })
  usedCount: number;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdBy?: Membership;
}
