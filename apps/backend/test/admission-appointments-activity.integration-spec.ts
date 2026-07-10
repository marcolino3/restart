/**
 * Integration test: creating/updating an admission appointment must also
 * create/sync a mirror MEETING activity so the appointment shows up in the
 * application's activity chronicle. Reads straight from the DB to prove the rows
 * (and their linkage) actually exist — a mock-based unit test cannot verify the
 * cross-table transaction.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=admission-appointments-activity
 */
import { join } from 'path';
import { config } from 'dotenv';
import { DataSource, Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseModule } from '@/database/database.module';
import { AdmissionAppointmentsService } from '@/school-management/admissions/admission-appointments.service';
import { AdmissionAppointment } from '@/school-management/admissions/entities/admission-appointment.entity';
import { AdmissionActivity } from '@/school-management/admissions/entities/admission-activity.entity';
import { AdmissionActivityType } from '@/school-management/admissions/enums/admission-activity-type.enum';
import { AdmissionApplication } from '@/school-management/admissions/entities/admission-application.entity';
import { AdmissionAppointmentType } from '@/school-management/admission-appointment-types/entities/admission-appointment-type.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { AdmissionStageType } from '@/school-management/admission-stages/enums/admission-stage-type.enum';
import { Family } from '@/school-management/families/entities/family.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { cleanDatabase } from './test-utils';

config({ path: join(__dirname, '.env.test') });

describe('AdmissionAppointmentsService mirror activity (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: AdmissionAppointmentsService;

  let orgRepo: Repository<Organization>;
  let stageRepo: Repository<AdmissionStage>;
  let appRepo: Repository<AdmissionApplication>;
  let typeRepo: Repository<AdmissionAppointmentType>;
  let familyRepo: Repository<Family>;
  let appointmentRepo: Repository<AdmissionAppointment>;
  let activityRepo: Repository<AdmissionActivity>;

  async function seedApplication(orgId: string): Promise<AdmissionApplication> {
    const stage = await stageRepo.save(
      stageRepo.create({
        organizationId: orgId,
        name: 'Erstkontakt',
        slug: `erstkontakt-${orgId.slice(0, 8)}`,
        stageType: AdmissionStageType.INITIAL,
        isDefault: true,
        position: 0,
      }),
    );
    const family = await familyRepo.save(
      familyRepo.create({ organizationId: orgId }),
    );
    return appRepo.save(
      appRepo.create({
        organizationId: orgId,
        familyId: family.id,
        childFirstName: 'Kind',
        childLastName: 'Muster',
        admissionStageId: stage.id,
      }),
    );
  }

  beforeAll(async () => {
    // Wire AppointmentsService directly against DatabaseModule (all entities) —
    // avoids AdmissionsModule -> better-auth (ESM) which ts-jest cannot load.
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: join(__dirname, '.env.test'),
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT!, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
        }),
        DatabaseModule,
      ],
      providers: [AdmissionAppointmentsService],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get(AdmissionAppointmentsService);

    orgRepo = dataSource.getRepository(Organization);
    stageRepo = dataSource.getRepository(AdmissionStage);
    appRepo = dataSource.getRepository(AdmissionApplication);
    typeRepo = dataSource.getRepository(AdmissionAppointmentType);
    familyRepo = dataSource.getRepository(Family);
    appointmentRepo = dataSource.getRepository(AdmissionAppointment);
    activityRepo = dataSource.getRepository(AdmissionActivity);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  it('creates a MEETING activity linked to the appointment (subject from title, occurredAt from scheduledAt)', async () => {
    const org = await orgRepo.save(orgRepo.create({}));
    const application = await seedApplication(org.id);

    const created = await service.create(
      {
        applicationId: application.id,
        title: 'Schnuppertag',
        scheduledAt: '2026-07-10T09:00:00.000Z',
        note: 'Bitte pünktlich erscheinen',
        durationMinutes: 120,
      },
      org.id,
      null,
    );

    // Read the activity straight from the DB, not the service response.
    const activities = await activityRepo.find({
      where: { applicationId: application.id, organizationId: org.id },
    });
    expect(activities).toHaveLength(1);
    const activity = activities[0];
    expect(activity.type).toBe(AdmissionActivityType.MEETING);
    expect(activity.subject).toBe('Schnuppertag');
    expect(activity.body).toBe('Bitte pünktlich erscheinen');
    expect(activity.durationMinutes).toBe(120);
    expect(activity.occurredAt.toISOString()).toBe('2026-07-10T09:00:00.000Z');

    // Appointment is linked back to the activity.
    const fromDb = await appointmentRepo.findOne({
      where: { id: created.id, organizationId: org.id },
    });
    expect(fromDb!.activityId).toBe(activity.id);
  });

  it('falls back to the appointment type label when no title is given', async () => {
    const org = await orgRepo.save(orgRepo.create({}));
    const application = await seedApplication(org.id);
    const type = await typeRepo.save(
      typeRepo.create({
        organizationId: org.id,
        label: 'Elterngespräch',
        position: 0,
      }),
    );

    await service.create(
      {
        applicationId: application.id,
        appointmentTypeId: type.id,
        scheduledAt: '2026-07-11T10:00:00.000Z',
      },
      org.id,
      null,
    );

    const activity = await activityRepo.findOne({
      where: { applicationId: application.id, organizationId: org.id },
    });
    expect(activity!.subject).toBe('Elterngespräch');
  });

  it('syncs the linked activity when the appointment is updated', async () => {
    const org = await orgRepo.save(orgRepo.create({}));
    const application = await seedApplication(org.id);

    const created = await service.create(
      {
        applicationId: application.id,
        title: 'Erstgespräch',
        scheduledAt: '2026-07-10T09:00:00.000Z',
        note: 'Alt',
      },
      org.id,
      null,
    );

    await service.update(
      {
        id: created.id,
        title: 'Verschobenes Gespräch',
        scheduledAt: '2026-07-12T14:00:00.000Z',
        note: 'Neu',
      },
      org.id,
    );

    const activity = await activityRepo.findOne({
      where: { applicationId: application.id, organizationId: org.id },
    });
    expect(activity!.subject).toBe('Verschobenes Gespräch');
    expect(activity!.body).toBe('Neu');
    expect(activity!.occurredAt.toISOString()).toBe('2026-07-12T14:00:00.000Z');
    // Still exactly one activity (updated in place, not duplicated).
    const count = await activityRepo.count({
      where: { applicationId: application.id, organizationId: org.id },
    });
    expect(count).toBe(1);
  });

  it('backfills a mirror activity for a legacy appointment without one', async () => {
    const org = await orgRepo.save(orgRepo.create({}));
    const application = await seedApplication(org.id);

    // Simulate a pre-feature appointment: insert directly, no activity link.
    const legacy = await appointmentRepo.save(
      appointmentRepo.create({
        organizationId: org.id,
        applicationId: application.id,
        title: 'Altbestand',
        scheduledAt: new Date('2026-07-10T09:00:00.000Z'),
      }),
    );
    expect(legacy.activityId ?? null).toBeNull();

    await service.update({ id: legacy.id, note: 'ergänzt' }, org.id);

    const fromDb = await appointmentRepo.findOne({
      where: { id: legacy.id, organizationId: org.id },
    });
    expect(fromDb!.activityId).toBeTruthy();
    const activity = await activityRepo.findOne({
      where: { id: fromDb!.activityId!, organizationId: org.id },
    });
    expect(activity!.type).toBe(AdmissionActivityType.MEETING);
    expect(activity!.subject).toBe('Altbestand');
  });

  it('deletes the mirror activity on hard remove', async () => {
    const org = await orgRepo.save(orgRepo.create({}));
    const application = await seedApplication(org.id);

    const created = await service.create(
      {
        applicationId: application.id,
        title: 'Zu löschen',
        scheduledAt: '2026-07-10T09:00:00.000Z',
      },
      org.id,
      null,
    );
    const activityId = (
      await appointmentRepo.findOneOrFail({
        where: { id: created.id },
      })
    ).activityId!;

    await service.remove(created.id, org.id);

    expect(
      await activityRepo.findOne({ where: { id: activityId } }),
    ).toBeNull();
  });

  it('does not create/read/update across organizations (multi-tenant isolation)', async () => {
    const orgA = await orgRepo.save(orgRepo.create({}));
    const orgB = await orgRepo.save(orgRepo.create({}));
    const applicationA = await seedApplication(orgA.id);

    const created = await service.create(
      {
        applicationId: applicationA.id,
        title: 'Nur Org A',
        scheduledAt: '2026-07-10T09:00:00.000Z',
      },
      orgA.id,
      null,
    );

    // Org B cannot update org A's appointment (and thus cannot touch its activity).
    await expect(
      service.update({ id: created.id, title: 'Hacked' }, orgB.id),
    ).rejects.toThrow();

    // Org B sees no activities at all; org A's activity is untouched.
    expect(
      await activityRepo.count({ where: { organizationId: orgB.id } }),
    ).toBe(0);
    const activity = await activityRepo.findOneOrFail({
      where: { organizationId: orgA.id },
    });
    expect(activity.subject).toBe('Nur Org A');

    // Org B cannot delete org A's appointment.
    await expect(service.remove(created.id, orgB.id)).rejects.toThrow();
    expect(await appointmentRepo.count({ where: { id: created.id } })).toBe(1);
  });
});
