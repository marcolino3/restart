import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmailTemplateInput } from './dto/create-email-template.input';
import { UpdateEmailTemplateInput } from './dto/update-email-template.input';
import { AdmissionEmail } from './entities/admission-email.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailTemplateCategory } from './enums/email-template-category.enum';
import { AdmissionEmailStatus } from './enums/admission-email-status.enum';
import { sanitizeEmailHtml } from './util/sanitize-email-html';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly repo: Repository<EmailTemplate>,
    @InjectRepository(AdmissionEmail)
    private readonly emailsRepo: Repository<AdmissionEmail>,
  ) {}

  async findForOrg(
    organizationId: string,
    category?: EmailTemplateCategory,
  ): Promise<EmailTemplate[]> {
    const templates = await this.repo.find({
      where: { organizationId, ...(category ? { category } : {}) },
      relations: ['createdByMembership', 'createdByMembership.user'],
      order: { name: 'ASC' },
    });
    await this.attachSentCounts(templates, organizationId);
    return templates;
  }

  /**
   * Populates `sentCount` on each template in a single grouped query — the
   * number of successfully sent admission emails that used it (org-scoped).
   */
  private async attachSentCounts(
    templates: EmailTemplate[],
    organizationId: string,
  ): Promise<void> {
    if (templates.length === 0) return;
    const rows = await this.emailsRepo
      .createQueryBuilder('e')
      .select('e.template_id', 'templateId')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.organization_id = :organizationId', { organizationId })
      .andWhere('e.template_id IN (:...ids)', {
        ids: templates.map((t) => t.id),
      })
      .andWhere('e.status = :status', { status: AdmissionEmailStatus.SENT })
      .groupBy('e.template_id')
      .getRawMany<{ templateId: string; count: number }>();
    const byId = new Map(rows.map((r) => [r.templateId, r.count]));
    for (const t of templates) t.sentCount = byId.get(t.id) ?? 0;
  }

  async findOneForOrg(
    id: string,
    organizationId: string,
  ): Promise<EmailTemplate> {
    const template = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!template) {
      throw new NotFoundException(`Email template ${id} not found`);
    }
    return template;
  }

  create(
    input: CreateEmailTemplateInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<EmailTemplate> {
    const entity = this.repo.create({
      organizationId,
      name: input.name.trim(),
      category: input.category ?? EmailTemplateCategory.ADMISSION,
      subject: input.subject.trim(),
      bodyHtml: sanitizeEmailHtml(input.bodyHtml),
      description: input.description?.trim() || null,
      isAutomatic: input.isAutomatic ?? false,
      createdByMembershipId: createdByMembershipId ?? null,
    });
    return this.repo.save(entity);
  }

  async update(
    input: UpdateEmailTemplateInput,
    organizationId: string,
  ): Promise<EmailTemplate> {
    const existing = await this.findOneForOrg(input.id, organizationId);

    if (input.name !== undefined) existing.name = input.name.trim();
    if (input.category !== undefined) existing.category = input.category;
    if (input.subject !== undefined) existing.subject = input.subject.trim();
    if (input.bodyHtml !== undefined) {
      existing.bodyHtml = sanitizeEmailHtml(input.bodyHtml);
    }
    if (input.description !== undefined) {
      existing.description = input.description?.trim() || null;
    }
    if (input.isAutomatic !== undefined) {
      existing.isAutomatic = input.isAutomatic;
    }

    return this.repo.save(existing);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    // Verify ownership before deleting — prevents cross-tenant deletes.
    await this.findOneForOrg(id, organizationId);
    await this.repo.delete({ id, organizationId });
    return true;
  }
}
