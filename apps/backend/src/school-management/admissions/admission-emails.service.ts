import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionEmailPreview } from './dto/admission-email-preview.output';
import { SendAdmissionEmailInput } from './dto/send-admission-email.input';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionEmail } from './entities/admission-email.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { AdmissionEmailStatus } from './enums/admission-email-status.enum';
import { SmtpService } from './smtp.service';
import {
  ADMISSION_EMAIL_PLACEHOLDERS,
  renderTemplate,
  TemplateVariables,
} from './util/render-template';
import { sanitizeEmailHtml } from './util/sanitize-email-html';

@Injectable()
export class AdmissionEmailsService {
  constructor(
    @InjectRepository(AdmissionEmail)
    private readonly repo: Repository<AdmissionEmail>,
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
    @InjectRepository(EmailTemplate)
    private readonly templatesRepo: Repository<EmailTemplate>,
    @InjectRepository(ContactPerson)
    private readonly contactPersonsRepo: Repository<ContactPerson>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @InjectRepository(Organization)
    private readonly organizationsRepo: Repository<Organization>,
    private readonly smtp: SmtpService,
  ) {}

  async findByApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<AdmissionEmail[]> {
    await this.verifyApplication(applicationId, organizationId);
    return this.repo.find({
      where: { applicationId, organizationId },
      relations: ['template', 'sentByMembership', 'sentByMembership.user'],
      order: { sentAt: 'DESC' },
    });
  }

  /**
   * Resolve a template against an application: substitute `{{placeholders}}`
   * and pick a default recipient. The returned text is ready to prefill the
   * editor; the user still reviews/edits before sending.
   */
  async preview(
    applicationId: string,
    templateId: string,
    organizationId: string,
    membershipId: string | null,
  ): Promise<AdmissionEmailPreview> {
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId },
      relations: ['admissionStage', 'assignedGradeLevel', 'desiredSchoolClass'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${applicationId} not found`,
      );
    }

    const template = await this.templatesRepo.findOne({
      where: { id: templateId, organizationId },
    });
    if (!template) {
      throw new NotFoundException(`Email template ${templateId} not found`);
    }

    const recipient = await this.resolveRecipient(
      application.familyId,
      organizationId,
    );
    const senderName = await this.resolveSenderName(membershipId);
    const orgName = await this.resolveOrgName(organizationId);

    const variables = this.buildVariables(application, {
      recipientName: recipient?.name ?? '',
      senderName,
      orgName,
    });

    return {
      subject: renderTemplate(template.subject, variables),
      bodyHtml: renderTemplate(template.bodyHtml, variables),
      toEmail: recipient?.email ?? null,
      toName: recipient?.name ?? null,
      availableVariables: [...ADMISSION_EMAIL_PLACEHOLDERS],
    };
  }

  /**
   * Send a (possibly user-edited) email and persist the outcome. A failed send
   * is still recorded with status FAILED + errorMessage so it shows up in the
   * application's email history — that is the tracking guarantee.
   */
  async send(
    input: SendAdmissionEmailInput,
    organizationId: string,
    membershipId: string | null,
  ): Promise<AdmissionEmail> {
    await this.verifyApplication(input.applicationId, organizationId);

    const cleanHtml = sanitizeEmailHtml(input.bodyHtml);
    const subject = input.subject.trim();

    const record = this.repo.create({
      organizationId,
      applicationId: input.applicationId,
      templateId: input.templateId ?? null,
      toEmail: input.toEmail.trim(),
      toName: input.toName?.trim() || null,
      subject,
      bodyHtml: cleanHtml,
      sentByMembershipId: membershipId ?? null,
      sentAt: new Date(),
    });

    try {
      const { messageId } = await this.smtp.send({
        organizationId,
        to: record.toEmail,
        toName: record.toName,
        subject,
        html: cleanHtml,
      });
      record.status = AdmissionEmailStatus.SENT;
      record.providerMessageId = messageId ?? null;
    } catch (err) {
      record.status = AdmissionEmailStatus.FAILED;
      record.errorMessage =
        err instanceof Error ? err.message : 'Unknown send error';
    }

    const saved = await this.repo.save(record);
    return this.repo.findOneOrFail({
      where: { id: saved.id, organizationId },
      relations: ['template', 'sentByMembership', 'sentByMembership.user'],
    });
  }

  /**
   * Re-attempt a previously sent email (typically a FAILED one). Creates a NEW
   * tracked record from the stored recipient/subject/body so the original
   * attempt and the retry both remain visible in the history.
   */
  async resend(
    id: string,
    organizationId: string,
    membershipId: string | null,
  ): Promise<AdmissionEmail> {
    const existing = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Admission email ${id} not found`);
    }
    return this.send(
      {
        applicationId: existing.applicationId,
        templateId: existing.templateId ?? undefined,
        toEmail: existing.toEmail,
        toName: existing.toName ?? undefined,
        subject: existing.subject,
        bodyHtml: existing.bodyHtml,
      },
      organizationId,
      membershipId,
    );
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { id, organizationId },
      select: ['id'],
    });
    if (!existing) {
      throw new NotFoundException(`Admission email ${id} not found`);
    }
    await this.repo.delete({ id, organizationId });
    return true;
  }

  private async verifyApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<void> {
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${applicationId} not found`,
      );
    }
  }

  private buildVariables(
    application: AdmissionApplication,
    extras: { recipientName: string; senderName: string; orgName: string },
  ): TemplateVariables {
    const firstName = application.childFirstName ?? '';
    const lastName = application.childLastName ?? '';
    return {
      childFirstName: firstName,
      childLastName: lastName,
      childFullName: `${firstName} ${lastName}`.trim(),
      desiredGradeLevel: application.assignedGradeLevel?.name ?? '',
      desiredSchoolClass: application.desiredSchoolClass?.name ?? '',
      desiredEnrollmentDate: application.desiredEnrollmentDate ?? '',
      stageName: application.admissionStage?.name ?? '',
      recipientName: extras.recipientName,
      orgName: extras.orgName,
      senderName: extras.senderName,
    };
  }

  private async resolveRecipient(
    familyId: string,
    organizationId: string,
  ): Promise<{ email: string; name: string } | null> {
    const contacts = await this.contactPersonsRepo.find({
      where: { familyId, organizationId },
      order: { createdAt: 'ASC' },
    });
    const withEmail = contacts.find((c) => c.email && c.email.trim());
    if (!withEmail) return null;
    return {
      email: withEmail.email!.trim(),
      name: `${withEmail.firstName} ${withEmail.lastName}`.trim(),
    };
  }

  private async resolveSenderName(
    membershipId: string | null,
  ): Promise<string> {
    if (!membershipId) return '';
    const membership = await this.membershipsRepo.findOne({
      where: { id: membershipId },
      relations: ['user'],
    });
    if (!membership?.user) return '';
    return `${membership.user.firstName} ${membership.user.lastName}`.trim();
  }

  private async resolveOrgName(organizationId: string): Promise<string> {
    const organization = await this.organizationsRepo.findOne({
      where: { id: organizationId },
      select: { id: true, name: true },
    });
    return organization?.name ?? '';
  }
}
