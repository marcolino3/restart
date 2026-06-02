import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AdmissionEmailsService } from './admission-emails.service';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionEmail } from './entities/admission-email.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { AdmissionEmailStatus } from './enums/admission-email-status.enum';
import { SmtpService } from './smtp.service';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';
const APP_ID = 'app-1';

const baseInput = {
  applicationId: APP_ID,
  templateId: 'tpl-1',
  toEmail: 'parent@example.com',
  toName: 'Familie Muster',
  subject: 'Willkommen',
  bodyHtml: '<p>Hallo</p><script>alert(1)</script>',
};

describe('AdmissionEmailsService', () => {
  let service: AdmissionEmailsService;
  let emailRepo: any;
  let appRepo: any;
  let templateRepo: any;
  let contactRepo: any;
  let membershipRepo: any;
  let orgRepo: any;
  let smtp: { send: jest.Mock; isConfigured: jest.Mock };

  beforeEach(async () => {
    emailRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'email-1', ...x })),
      findOneOrFail: jest.fn((opts) =>
        Promise.resolve({ id: 'email-1', ...opts.where }),
      ),
    };
    appRepo = { findOne: jest.fn() };
    templateRepo = { findOne: jest.fn() };
    contactRepo = { find: jest.fn().mockResolvedValue([]) };
    membershipRepo = { findOne: jest.fn() };
    orgRepo = { findOne: jest.fn() };
    smtp = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
      isConfigured: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionEmailsService,
        { provide: getRepositoryToken(AdmissionEmail), useValue: emailRepo },
        {
          provide: getRepositoryToken(AdmissionApplication),
          useValue: appRepo,
        },
        { provide: getRepositoryToken(EmailTemplate), useValue: templateRepo },
        { provide: getRepositoryToken(ContactPerson), useValue: contactRepo },
        { provide: getRepositoryToken(Membership), useValue: membershipRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: SmtpService, useValue: smtp },
      ],
    }).compile();

    service = module.get(AdmissionEmailsService);
  });

  describe('send', () => {
    it('persists status SENT + providerMessageId and sanitizes the body', async () => {
      appRepo.findOne.mockResolvedValue({ id: APP_ID });

      await service.send(baseInput, ORG_ID, 'membership-1');

      const saved = emailRepo.save.mock.calls[0][0];
      expect(saved.status).toBe(AdmissionEmailStatus.SENT);
      expect(saved.providerMessageId).toBe('msg-1');
      expect(saved.organizationId).toBe(ORG_ID);
      expect(saved.sentByMembershipId).toBe('membership-1');
      // <script> stripped before send + store.
      expect(saved.bodyHtml).not.toContain('<script>');
      expect(smtp.send).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: ORG_ID }),
      );
    });

    it('records status FAILED + errorMessage when the transport throws, without throwing', async () => {
      appRepo.findOne.mockResolvedValue({ id: APP_ID });
      smtp.send.mockRejectedValue(new Error('SMTP down'));

      await expect(
        service.send(baseInput, ORG_ID, 'membership-1'),
      ).resolves.toBeDefined();

      const saved = emailRepo.save.mock.calls[0][0];
      expect(saved.status).toBe(AdmissionEmailStatus.FAILED);
      expect(saved.errorMessage).toBe('SMTP down');
    });

    it('rejects sending for an application of another org', async () => {
      // App not found because the WHERE carries the foreign org id.
      appRepo.findOne.mockResolvedValue(null);
      await expect(
        service.send(baseInput, OTHER_ORG_ID, 'membership-1'),
      ).rejects.toThrow(NotFoundException);
      expect(smtp.send).not.toHaveBeenCalled();
      expect(emailRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByApplication', () => {
    it('verifies the application belongs to the org and scopes the query', async () => {
      appRepo.findOne.mockResolvedValue({ id: APP_ID });
      await service.findByApplication(APP_ID, ORG_ID);
      expect(appRepo.findOne.mock.calls[0][0].where).toEqual({
        id: APP_ID,
        organizationId: ORG_ID,
      });
      expect(emailRepo.find.mock.calls[0][0].where).toEqual({
        applicationId: APP_ID,
        organizationId: ORG_ID,
      });
    });

    it('throws when the application is not in the org', async () => {
      appRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findByApplication(APP_ID, OTHER_ORG_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes only after verifying org ownership', async () => {
      emailRepo.findOne = jest.fn().mockResolvedValue({ id: 'email-1' });
      emailRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
      await service.remove('email-1', ORG_ID);
      expect(emailRepo.findOne.mock.calls[0][0].where).toEqual({
        id: 'email-1',
        organizationId: ORG_ID,
      });
      expect(emailRepo.delete).toHaveBeenCalledWith({
        id: 'email-1',
        organizationId: ORG_ID,
      });
    });

    it('refuses to delete a foreign-org email', async () => {
      emailRepo.findOne = jest.fn().mockResolvedValue(null);
      emailRepo.delete = jest.fn();
      await expect(service.remove('email-1', OTHER_ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(emailRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('resend', () => {
    it('creates a new attempt from the stored email data', async () => {
      emailRepo.findOne = jest.fn().mockResolvedValue({
        id: 'email-old',
        applicationId: APP_ID,
        templateId: 'tpl-1',
        toEmail: 'parent@example.com',
        toName: 'Familie Muster',
        subject: 'Willkommen',
        bodyHtml: '<p>Hallo</p>',
        status: AdmissionEmailStatus.FAILED,
      });
      appRepo.findOne.mockResolvedValue({ id: APP_ID });

      await service.resend('email-old', ORG_ID, 'membership-2');

      // A brand-new record is created (not the old one mutated).
      const saved = emailRepo.save.mock.calls[0][0];
      expect(saved.applicationId).toBe(APP_ID);
      expect(saved.toEmail).toBe('parent@example.com');
      expect(saved.status).toBe(AdmissionEmailStatus.SENT);
      expect(smtp.send).toHaveBeenCalled();
    });

    it('throws for a foreign-org email', async () => {
      emailRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.resend('email-old', OTHER_ORG_ID, 'membership-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('preview', () => {
    it('resolves placeholders and picks the first contact with an email', async () => {
      appRepo.findOne.mockResolvedValue({
        id: APP_ID,
        familyId: 'fam-1',
        childFirstName: 'Mia',
        childLastName: 'Muster',
        admissionStage: { name: 'Erstgespräch' },
        desiredGradeLevel: { name: '1. Klasse' },
        desiredSchoolClass: null,
      });
      templateRepo.findOne.mockResolvedValue({
        id: 'tpl-1',
        subject: 'Hallo {{childFirstName}}',
        bodyHtml: '<p>Stufe {{stageName}} für {{childFullName}}</p>',
      });
      contactRepo.find.mockResolvedValue([
        { firstName: 'Anna', lastName: 'Muster', email: '' },
        { firstName: 'Beat', lastName: 'Muster', email: 'beat@example.com' },
      ]);
      membershipRepo.findOne.mockResolvedValue({
        user: { firstName: 'Lea', lastName: 'Lehrer' },
      });
      orgRepo.findOne.mockResolvedValue({ name: 'Colibri Schule' });

      const result = await service.preview(
        APP_ID,
        'tpl-1',
        ORG_ID,
        'membership-1',
      );

      expect(result.subject).toBe('Hallo Mia');
      expect(result.bodyHtml).toBe('<p>Stufe Erstgespräch für Mia Muster</p>');
      expect(result.toEmail).toBe('beat@example.com');
      expect(result.toName).toBe('Beat Muster');
      expect(result.availableVariables).toContain('childFirstName');
    });

    it('throws when the template belongs to another org', async () => {
      appRepo.findOne.mockResolvedValue({ id: APP_ID, familyId: 'fam-1' });
      templateRepo.findOne.mockResolvedValue(null);
      await expect(
        service.preview(APP_ID, 'tpl-1', ORG_ID, 'membership-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
