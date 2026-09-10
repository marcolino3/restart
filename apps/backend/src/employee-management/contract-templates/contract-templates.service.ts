import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { renderTemplate } from '@/common/util/render-template';
import { sanitizeRichHtml } from '@/common/util/sanitize-rich-html';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { buildContractVariables } from './contract-placeholders';
import { CreateContractTemplateInput } from './dto/create-contract-template.input';
import { UpdateContractTemplateInput } from './dto/update-contract-template.input';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractDocumentPreview } from './dto/contract-document-preview.output';

@Injectable()
export class ContractTemplatesService {
  constructor(
    @InjectRepository(ContractTemplate)
    private readonly repo: Repository<ContractTemplate>,
    @InjectRepository(EmployeeContract)
    private readonly contractsRepo: Repository<EmployeeContract>,
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,
  ) {}

  findForOrg(organizationId: string): Promise<ContractTemplate[]> {
    return this.repo.find({
      where: { organizationId },
      relations: ['createdByMembership', 'createdByMembership.user'],
      order: { name: 'ASC' },
    });
  }

  async findOneForOrg(
    id: string,
    organizationId: string,
  ): Promise<ContractTemplate> {
    const template = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!template) {
      throw new NotFoundException(`Contract template ${id} not found`);
    }
    return template;
  }

  create(
    input: CreateContractTemplateInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<ContractTemplate> {
    const entity = this.repo.create({
      organizationId,
      name: input.name.trim(),
      bodyHtml: sanitizeRichHtml(input.bodyHtml),
      headerHtml: input.headerHtml ? sanitizeRichHtml(input.headerHtml) : null,
      footerHtml: input.footerHtml ? sanitizeRichHtml(input.footerHtml) : null,
      showLogo: input.showLogo ?? true,
      description: input.description?.trim() || null,
      createdByMembershipId: createdByMembershipId ?? null,
    });
    return this.repo.save(entity);
  }

  async update(
    input: UpdateContractTemplateInput,
    organizationId: string,
  ): Promise<ContractTemplate> {
    const existing = await this.findOneForOrg(input.id, organizationId);

    if (input.name !== undefined) existing.name = input.name.trim();
    if (input.bodyHtml !== undefined) {
      existing.bodyHtml = sanitizeRichHtml(input.bodyHtml);
    }
    if (input.headerHtml !== undefined) {
      existing.headerHtml = input.headerHtml
        ? sanitizeRichHtml(input.headerHtml)
        : null;
    }
    if (input.footerHtml !== undefined) {
      existing.footerHtml = input.footerHtml
        ? sanitizeRichHtml(input.footerHtml)
        : null;
    }
    if (input.showLogo !== undefined) existing.showLogo = input.showLogo;
    if (input.description !== undefined) {
      existing.description = input.description?.trim() || null;
    }

    return this.repo.save(existing);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    // Verify ownership before deleting — prevents cross-tenant deletes.
    await this.findOneForOrg(id, organizationId);
    await this.repo.delete({ id, organizationId });
    return true;
  }

  /** Org-scoped contract with everything the placeholder map needs. */
  async loadContractForOrg(
    contractId: string,
    organizationId: string,
  ): Promise<EmployeeContract> {
    const contract = await this.contractsRepo.findOne({
      where: { id: contractId, organizationId },
      relations: [
        'employee',
        'employee.membership',
        'employee.membership.user',
      ],
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }
    return contract;
  }

  /**
   * Renders a template against one contract: placeholders resolved, HTML
   * ready for the review editor. Both template and contract are org-scoped.
   */
  async preview(
    contractId: string,
    templateId: string,
    organizationId: string,
  ): Promise<ContractDocumentPreview> {
    const [template, contract, organization] = await Promise.all([
      this.findOneForOrg(templateId, organizationId),
      this.loadContractForOrg(contractId, organizationId),
      this.orgsRepo.findOne({ where: { id: organizationId } }),
    ]);

    const variables = buildContractVariables(contract, organization);
    return {
      bodyHtml: renderTemplate(template.bodyHtml, variables),
      headerHtml: template.headerHtml
        ? renderTemplate(template.headerHtml, variables)
        : null,
      footerHtml: template.footerHtml
        ? renderTemplate(template.footerHtml, variables)
        : null,
      showLogo: template.showLogo,
    };
  }
}
