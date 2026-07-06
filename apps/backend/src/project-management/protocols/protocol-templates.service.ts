import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { CreateProtocolTemplateInput } from './dto/create-protocol-template.input';
import { SaveProtocolAsTemplateInput } from './dto/save-protocol-as-template.input';
import { UpdateProtocolTemplateInput } from './dto/update-protocol-template.input';
import { AgendaItem } from './entities/protocol-sections.output';
import { ProtocolTemplate } from './entities/protocol-template.entity';
import { Protocol } from './entities/protocol.entity';

@Injectable()
export class ProtocolTemplatesService {
  constructor(
    @InjectRepository(ProtocolTemplate)
    private readonly templatesRepo: Repository<ProtocolTemplate>,
    @InjectRepository(Protocol)
    private readonly protocolsRepo: Repository<Protocol>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
  ) {}

  findAll(organizationId: string): Promise<ProtocolTemplate[]> {
    return this.templatesRepo.find({
      where: { organizationId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<ProtocolTemplate> {
    const template = await this.templatesRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!template) {
      throw new NotFoundException(`Protocol template ${id} not found`);
    }
    return template;
  }

  async create(
    input: CreateProtocolTemplateInput,
    organizationId: string,
    membershipId: string | null,
  ): Promise<ProtocolTemplate> {
    return this.templatesRepo.save(
      this.templatesRepo.create({
        title: input.title.trim(),
        agendaItems: normalizeAgenda(input.agendaItems ?? []),
        defaultParticipantMembershipIds: await this.filterOrgMemberships(
          input.defaultParticipantMembershipIds ?? [],
          organizationId,
        ),
        usedCount: 0,
        organizationId,
        createdByMembershipId: membershipId ?? null,
      }),
    );
  }

  async update(
    input: UpdateProtocolTemplateInput,
    organizationId: string,
  ): Promise<ProtocolTemplate> {
    const template = await this.findOne(input.id, organizationId);
    if (input.title !== undefined) template.title = input.title.trim();
    if (input.agendaItems !== undefined)
      template.agendaItems = normalizeAgenda(input.agendaItems ?? []);
    if (input.defaultParticipantMembershipIds !== undefined)
      template.defaultParticipantMembershipIds =
        await this.filterOrgMemberships(
          input.defaultParticipantMembershipIds ?? [],
          organizationId,
        );
    return this.templatesRepo.save(template);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const template = await this.findOne(id, organizationId);
    template.isActive = false;
    await this.templatesRepo.save(template);
    return true;
  }

  /**
   * Snapshot eines bestehenden Protokolls als Vorlage: übernimmt Traktanden
   * und interne Teilnehmende (keine Inhalte wie Beschlüsse oder Notizen).
   */
  async saveProtocolAsTemplate(
    input: SaveProtocolAsTemplateInput,
    organizationId: string,
    membershipId: string | null,
  ): Promise<ProtocolTemplate> {
    const protocol = await this.protocolsRepo.findOne({
      where: { id: input.protocolId, organizationId, isActive: true },
      relations: { participants: true },
    });
    if (!protocol) {
      throw new NotFoundException(`Protocol ${input.protocolId} not found`);
    }

    return this.templatesRepo.save(
      this.templatesRepo.create({
        title: input.title.trim(),
        agendaItems: normalizeAgenda(protocol.sections?.agendaItems ?? []),
        defaultParticipantMembershipIds: (protocol.participants ?? [])
          .filter((p) => p.isActive)
          .map((p) => p.membershipId),
        usedCount: 0,
        organizationId,
        createdByMembershipId: membershipId ?? null,
      }),
    );
  }

  /**
   * Anwendung beim Protokoll-Erstellen: liefert Traktanden + noch existierende
   * Standard-Teilnehmende und zählt die Verwendung hoch.
   */
  async apply(
    templateId: string,
    organizationId: string,
  ): Promise<{
    agendaItems: AgendaItem[];
    participantMembershipIds: string[];
  }> {
    const template = await this.findOne(templateId, organizationId);
    await this.templatesRepo.increment(
      { id: template.id, organizationId },
      'usedCount',
      1,
    );
    return {
      agendaItems: normalizeAgenda(template.agendaItems ?? []),
      participantMembershipIds: await this.filterOrgMemberships(
        template.defaultParticipantMembershipIds ?? [],
        organizationId,
      ),
    };
  }

  /** Nur Memberships der aktiven Org übernehmen — fremde/gelöschte fallen raus. */
  private async filterOrgMemberships(
    membershipIds: string[],
    organizationId: string,
  ): Promise<string[]> {
    const unique = [...new Set(membershipIds)];
    if (unique.length === 0) return [];
    const found = await this.membershipsRepo.find({
      where: { id: In(unique), organizationId },
      select: ['id'],
    });
    const foundIds = new Set(found.map((m) => m.id));
    return unique.filter((id) => foundIds.has(id));
  }
}

/** Traktanden durchnummerieren und leere Topics verwerfen. */
function normalizeAgenda(items: AgendaItem[]): AgendaItem[] {
  return items
    .filter((item) => item.topic.trim().length > 0)
    .map((item, index) => ({
      no: index + 1,
      topic: item.topic.trim(),
      goal: item.goal ?? null,
    }));
}
