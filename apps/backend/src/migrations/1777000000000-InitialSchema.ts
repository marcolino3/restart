import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1777000000000 implements MigrationInterface {
  name = 'InitialSchema1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid-ossp liefert uuid_generate_v4(), das unten als Spalten-Default
    // genutzt wird. TypeORM legt die Extension sonst nur implizit beim
    // Connect an (afterConnect) — hier explizit + idempotent, damit der
    // Prod-Migrate-Job nicht von diesem Seiteneffekt abhängt. Setzt CREATE-
    // Rechte des DB-Users voraus ODER eine vorab als Superuser angelegte
    // Extension (siehe Prod-Runbook).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "organization_id" uuid NOT NULL, CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_team_org_name" ON "teams" ("organization_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."permissions_code_enum" AS ENUM('ORG_DELETE', 'ORG_TRANSFER_OWNERSHIP', 'BILLING_MANAGE', 'USER_INVITE', 'USER_REMOVE', 'ROLE_CREATE', 'ROLE_DELETE', 'ROLE_ASSIGN', 'TEAM_CREATE', 'TEAM_DELETE', 'TEAM_MANAGE', 'EMPLOYEE_READ', 'EMPLOYEE_WRITE', 'EMPLOYEE_ABSENCE_CATEGORY_READ', 'EMPLOYEE_ABSENCE_CATEGORY_MANAGE', 'TIMESHEET_READ', 'TIMESHEET_WRITE', 'SCHOOL_CLASS_READ', 'SCHOOL_CLASS_WRITE', 'SCHOOL_CLASS_DELETE', 'CONTACT_PERSON_READ', 'CONTACT_PERSON_WRITE', 'CONTACT_PERSON_DELETE', 'ADMISSION_STAGE_READ', 'ADMISSION_STAGE_MANAGE', 'ADMISSION_APPLICATION_READ', 'ADMISSION_APPLICATION_WRITE', 'ADMISSION_APPLICATION_MOVE', 'ADMISSION_APPLICATION_ENROLL', 'ADMISSION_APPLICATION_DELETE', 'FAMILY_READ', 'FAMILY_WRITE', 'CURRICULUM_LEVEL_READ', 'CURRICULUM_LEVEL_MANAGE', 'CURRICULUM_READ', 'CURRICULUM_MANAGE', 'RECORD_KEEPING_READ', 'RECORD_KEEPING_WRITE', 'RECORD_KEEPING_SETTINGS_MANAGE', 'ADDRESS_READ', 'ADDRESS_WRITE', 'ADDRESS_DELETE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "code" "public"."permissions_code_enum" NOT NULL, "description" text, CONSTRAINT "uq_permissions_code" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."roles_system_code_enum" AS ENUM('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text, "description" text, "organization_id" uuid NOT NULL, "system_code" "public"."roles_system_code_enum", "is_system" boolean NOT NULL DEFAULT false, CONSTRAINT "uq_roles_org_name" UNIQUE ("organization_id", "name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_roles_org_system_code_not_null" ON "roles" ("organization_id", "system_code") WHERE system_code IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_roles_org" ON "roles" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" character varying(200), "subdomain" character varying(120), "domain" character varying(255), "street" character varying(200), "zip" character varying(20), "city" character varying(100), "country" character varying(100), "phone" character varying(50), "email" character varying(200), "website" character varying(500), "timezone" character varying(100) NOT NULL DEFAULT 'Europe/Berlin', "latitude" double precision, "longitude" double precision, "location" point, "bvg_provider" character varying(200), "bvg_contact_phone" character varying(60), "uvg_provider" character varying(200), "uvg_contact_phone" character varying(60), "daily_sickness_provider" character varying(200), "daily_sickness_contact_phone" character varying(60), CONSTRAINT "UQ_0660118ba6c48a1781452f75b63" UNIQUE ("subdomain"), CONSTRAINT "UQ_98678ed828cc71e4f8a58c95d6b" UNIQUE ("domain"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organizations_location" ON "organizations" USING GiST ("location") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_organizations_domain" ON "organizations" ("domain") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_organizations_subdomain" ON "organizations" ("subdomain") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_absence_category_translations_locale_enum" AS ENUM('DE', 'FR', 'IT', 'EN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_absence_category_translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "category_id" uuid NOT NULL, "locale" "public"."employee_absence_category_translations_locale_enum" NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_03fa70b97e9269e64f88a344482" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_employee_absence_category_translation" ON "employee_absence_category_translations" ("category_id", "locale") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_absence_categories_system_code_enum" AS ENUM('SICKNESS', 'ACCIDENT', 'CHILDCARE_SICK', 'TRAINING', 'FUNERAL', 'MOVE', 'MILITARY_SERVICE', 'CIVIL_SERVICE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_absence_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "system_code" "public"."employee_absence_categories_system_code_enum", "is_system" boolean NOT NULL DEFAULT false, "counts_as_work_time" boolean NOT NULL DEFAULT true, "is_paid" boolean NOT NULL DEFAULT true, "affects_vacation_balance" boolean NOT NULL DEFAULT false, "default_is_vacation_capable" boolean NOT NULL DEFAULT true, "reduces_vacation_entitlement_after_days" integer, "requires_certificate" boolean NOT NULL DEFAULT false, "certificate_required_from_day" integer, "max_days_per_year" integer, "default_percentage" integer NOT NULL DEFAULT '100', "requires_approval" boolean NOT NULL DEFAULT false, "color" character varying(7), "icon_name" character varying, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "uq_employee_absence_categories_org_systemcode" UNIQUE ("organization_id", "system_code"), CONSTRAINT "PK_81d3782ec8793dd69d5a8660867" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_absence_categories_org" ON "employee_absence_categories" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_absence_days" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "employee_absence_id" uuid NOT NULL, "absence_category_id" uuid, "employee_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_00fd01591dfd8c23ff112451f43" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_absences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "membership_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "absence_category_id" uuid NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE, "note" character varying, "isTeamInformed" boolean NOT NULL DEFAULT false, "is_vacation_capable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ef8fc475dab9339d8a9a057b2c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_notes_category_enum" AS ENUM('GENERAL', 'WARNING', 'MEETING', 'CONTRACT', 'REQUEST', 'PERFORMANCE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "employee_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "author_membership_id" uuid, "category" "public"."employee_notes_category_enum" NOT NULL DEFAULT 'GENERAL', "title" character varying(200) NOT NULL, "content" text NOT NULL, "is_confidential" boolean NOT NULL DEFAULT false, "date" date NOT NULL, CONSTRAINT "PK_6e756ba7f186b50a1d39eb276d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "team_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "team_id" uuid NOT NULL, "employee_id" uuid NOT NULL, CONSTRAINT "PK_ca3eae89dcf20c9fd95bf7460aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_team_member_team_employee" ON "team_members" ("team_id", "employee_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "time_tracking_enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."auth_accounts_provider_enum" AS ENUM('GOOGLE', 'APPLE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "user_email_id" uuid NOT NULL, "provider" "public"."auth_accounts_provider_enum" NOT NULL, "provider_id" character varying(255) NOT NULL, CONSTRAINT "PK_8c9dc84256aeaa852e4d87d782b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_auth_provider_id" ON "auth_accounts" ("provider", "provider_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_emails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "user_id" uuid NOT NULL, "email" text NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "is_verified" boolean NOT NULL DEFAULT false, "password_hash" text, "magic_link_token" text, "magic_link_expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3ef6c4be97ba94ea3ba65362ad0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_emails_email" ON "user_emails" ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_persona_enum" AS ENUM('ADMIN', 'HR', 'OFFICE', 'TEACHER', 'PARENT', 'STUDENT', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "persona" "public"."memberships_persona_enum" NOT NULL, "user_id" uuid NOT NULL, "user_email_id" uuid, "contact_phone" character varying(30), "employee_id" uuid, CONSTRAINT "REL_0b3045c0a2eae49f70f958b063" UNIQUE ("employee_id"), CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_memberships_org" ON "memberships" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_memberships_employee" ON "memberships" ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_memberships_user" ON "memberships" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" character varying(20), "first_name" character varying(120) NOT NULL, "last_name" character varying(120) NOT NULL, "username" text, "date_of_birth" date, "social_security_number" character varying(30), "street" character varying(200), "house_number" character varying(30), "address_line_2" character varying(200), "postal_code" character varying(20), "city" character varying(120), "country" character varying(80), "refresh_token" text, "is_super_admin" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_username" ON "users" ("username") WHERE "username" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organizationId" uuid NOT NULL, "key" character varying(255) NOT NULL, "encryptedValue" text NOT NULL, "iv" text NOT NULL, "authTag" text NOT NULL, "description" character varying(500), CONSTRAINT "UQ_46d8ed05c68700156f2b394dc60" UNIQUE ("organizationId", "key"), CONSTRAINT "PK_67a83a1c6256f927137c33ddd7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."curriculum_translations_locale_enum" AS ENUM('DE', 'FR', 'EN', 'IT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "curriculum_id" uuid NOT NULL, "locale" "public"."curriculum_translations_locale_enum" NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_a8f13ea54a2386a7df0222e13dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_curriculum_translation" ON "curriculum_translations" ("curriculum_id", "locale") `,
    );
    await queryRunner.query(
      `CREATE TABLE "curricula" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "slug" text NOT NULL, "position" integer NOT NULL DEFAULT '0', "organization_id" uuid NOT NULL, CONSTRAINT "PK_7c5dd2066e2bbf3b6ad0a71c567" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_curriculum_org_slug" ON "curricula" ("organization_id", "slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curricula_org" ON "curricula" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."curriculum_level_translations_locale_enum" AS ENUM('DE', 'FR', 'EN', 'IT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_level_translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "curriculum_level_id" uuid NOT NULL, "locale" "public"."curriculum_level_translations_locale_enum" NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_d319b9953bf1ce7f5dc9bcc680a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_curriculum_level_translation" ON "curriculum_level_translations" ("curriculum_level_id", "locale") `,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "slug" text NOT NULL, "position" integer NOT NULL DEFAULT '0', "curriculum_id" uuid NOT NULL, "organization_id" uuid NOT NULL, CONSTRAINT "PK_e63601ba00f76bc2aaa4fd042c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_curriculum_level_curriculum_slug" ON "curriculum_levels" ("curriculum_id", "slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curriculum_levels_curriculum" ON "curriculum_levels" ("curriculum_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curriculum_levels_org" ON "curriculum_levels" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."curriculum_node_translations_locale_enum" AS ENUM('DE', 'FR', 'EN', 'IT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_node_translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "curriculum_node_id" uuid NOT NULL, "locale" "public"."curriculum_node_translations_locale_enum" NOT NULL, "name" text NOT NULL, "notes" text, CONSTRAINT "PK_a231231e1573d2f8b03bc37fef0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_curriculum_node_translation" ON "curriculum_node_translations" ("curriculum_node_id", "locale") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."curriculum_nodes_node_type_enum" AS ENUM('AREA', 'TOPIC', 'GROUP', 'LESSON')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."curriculum_nodes_lesson_type_enum" AS ENUM('P', 'THREE_PL', 'E', 'M', 'S')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."curriculum_nodes_lesson_scale_enum" AS ENUM('MASTERABLE', 'ONGOING')`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_nodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "curriculum_id" uuid NOT NULL, "level_id" uuid NOT NULL, "parent_id" uuid, "node_type" "public"."curriculum_nodes_node_type_enum" NOT NULL, "position" integer NOT NULL DEFAULT '0', "lesson_type" "public"."curriculum_nodes_lesson_type_enum", "lesson_scale" "public"."curriculum_nodes_lesson_scale_enum", "organization_id" uuid NOT NULL, CONSTRAINT "chk_curriculum_nodes_lesson_attrs_only_for_lesson" CHECK ((node_type = 'LESSON') OR (lesson_type IS NULL AND lesson_scale IS NULL)), CONSTRAINT "PK_f19c7734cae088f045799838f3c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curriculum_nodes_parent" ON "curriculum_nodes" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curriculum_nodes_level" ON "curriculum_nodes" ("level_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curriculum_nodes_curriculum" ON "curriculum_nodes" ("curriculum_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_curriculum_nodes_org" ON "curriculum_nodes" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."country_input_templates_field_type_enum" AS ENUM('PHONE', 'IBAN', 'SSN', 'POSTAL_CODE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."country_input_templates_validator_kind_enum" AS ENUM('NONE', 'IBAN_MOD97', 'CH_SSN', 'REGEX')`,
    );
    await queryRunner.query(
      `CREATE TABLE "country_input_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "country_code" character varying(10) NOT NULL, "field_type" "public"."country_input_templates_field_type_enum" NOT NULL, "mask" character varying(100) NOT NULL, "placeholder" character varying(100), "max_length" integer, "regex" character varying(500), "prefix" character varying(20), "validator_kind" "public"."country_input_templates_validator_kind_enum" NOT NULL DEFAULT 'NONE', CONSTRAINT "uq_country_input_templates_country_field" UNIQUE ("country_code", "field_type"), CONSTRAINT "PK_fe436bfea28b4a1a99dfa004c9b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_country_input_templates_field" ON "country_input_templates" ("field_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "country" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text, "isoCode" text, "currency" text, CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "street" text, "house_number" text, "address_line_2" text, "postal_code" text, "city" text, "state" text, "organization_id" uuid NOT NULL, "country_id" uuid, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_addresses_org" ON "addresses" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_stages_stage_type_enum" AS ENUM('INITIAL', 'IN_PROGRESS', 'ACCEPTED', 'ENROLLED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admission_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "slug" text NOT NULL, "description" text, "color" text, "position" integer NOT NULL DEFAULT '0', "stage_type" "public"."admission_stages_stage_type_enum" NOT NULL DEFAULT 'IN_PROGRESS', "is_default" boolean NOT NULL DEFAULT false, "organization_id" uuid NOT NULL, CONSTRAINT "PK_0b631d6e9fc991a9df899507146" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_admission_stage_org_slug" ON "admission_stages" ("organization_id", "slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_stages_org" ON "admission_stages" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."students_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "firstName" text NOT NULL, "lastName" text NOT NULL, "dateOfBirth" date, "gender" "public"."students_gender_enum", "enrollment_date" date, "exit_date" date, "notes" text, "admission_stage_id" uuid, "admission_application_id" uuid, "organization_id" uuid NOT NULL, CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_student_org_name_dob" ON "students" ("organization_id", "firstName", "lastName", "dateOfBirth") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_students_org" ON "students" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."student_notes_category_enum" AS ENUM('GENERAL', 'ACADEMIC', 'BEHAVIOR', 'MEETING', 'HEALTH', 'PARENT_CONTACT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "student_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "author_membership_id" uuid, "category" "public"."student_notes_category_enum" NOT NULL DEFAULT 'GENERAL', "title" character varying(200) NOT NULL, "content" text NOT NULL, "is_confidential" boolean NOT NULL DEFAULT false, "date" date NOT NULL, CONSTRAINT "PK_257514e973a4a2a4a41e6e1e6f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grade_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "color" text, "sortOrder" integer NOT NULL DEFAULT '0', "organization_id" uuid NOT NULL, CONSTRAINT "PK_6acd477de8b53978fc389479713" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_grade_levels_org" ON "grade_levels" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_grade_level_org_name" ON "grade_levels" ("organization_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "color" character varying(7), "description" text, "sortOrder" integer NOT NULL DEFAULT '0', "maxCapacity" integer, "room" character varying(100), "organization_id" uuid NOT NULL, CONSTRAINT "PK_598176ed17a4f905e76f0eb4daf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_school_classes_org" ON "school_classes" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_school_class_org_name" ON "school_classes" ("organization_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_class_enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "student_id" uuid NOT NULL, "school_class_id" uuid NOT NULL, "enrolled_at" date NOT NULL, "left_at" date, "organization_id" uuid NOT NULL, CONSTRAINT "PK_f75cdead376ff90e2ef87516ab8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_enrollment_student_class_date" ON "school_class_enrollments" ("student_id", "school_class_id", "enrolled_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_enrollment_class" ON "school_class_enrollments" ("school_class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_enrollment_student" ON "school_class_enrollments" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_enrollment_org" ON "school_class_enrollments" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "families" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text, "primary_address_id" uuid, "notes" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_70414ac0c8f45664cf71324b9bb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_families_org" ON "families" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contact_persons_salutation_enum" AS ENUM('MR', 'MRS', 'DIVERSE', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contact_persons_roles_enum" AS ENUM('FATHER', 'MOTHER', 'STEP_FATHER', 'STEP_MOTHER', 'GRANDFATHER', 'GRANDMOTHER', 'SIBLING', 'NANNY', 'LEGAL_GUARDIAN', 'AUNT_UNCLE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact_persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "salutation" "public"."contact_persons_salutation_enum", "title" text, "first_name" text NOT NULL, "middle_name" text, "last_name" text NOT NULL, "email" text, "phone" text, "mobile" text, "date_of_birth" date, "social_security_number" text, "nationalities" text array, "preferred_languages" text array, "roles" "public"."contact_persons_roles_enum" array, "occupation" text, "notes" text, "address_id" uuid, "user_id" uuid, "family_id" uuid, "organization_id" uuid NOT NULL, CONSTRAINT "PK_7ac4bdd4703f21ec369f9418d98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contact_persons_family" ON "contact_persons" ("family_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contact_persons_email" ON "contact_persons" ("organization_id", "email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_contact_persons_org" ON "contact_persons" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."student_contact_persons_relationship_type_enum" AS ENUM('FATHER', 'MOTHER', 'STEP_FATHER', 'STEP_MOTHER', 'GRANDFATHER', 'GRANDMOTHER', 'SIBLING', 'NANNY', 'LEGAL_GUARDIAN', 'AUNT_UNCLE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_contact_persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "student_id" uuid NOT NULL, "contact_person_id" uuid NOT NULL, "relationship_type" "public"."student_contact_persons_relationship_type_enum" NOT NULL, "is_primary_contact" boolean NOT NULL DEFAULT false, "has_custody" boolean NOT NULL DEFAULT false, "is_pickup_authorized" boolean NOT NULL DEFAULT true, "emergency_priority" integer, "lives_with_student" boolean NOT NULL DEFAULT false, "notes" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_ae67bca79746cff3aaf068b4ac9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_scp_student_contact_relationship" ON "student_contact_persons" ("student_id", "contact_person_id", "relationship_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scp_contact_person" ON "student_contact_persons" ("contact_person_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scp_student" ON "student_contact_persons" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scp_org" ON "student_contact_persons" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_applications_child_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_applications_status_enum" AS ENUM('ACTIVE', 'REJECTED', 'ENROLLED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_applications_source_enum" AS ENUM('MANUAL', 'PUBLIC_FORM', 'OPEN_DAY', 'REFERRAL', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admission_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "family_id" uuid NOT NULL, "admission_stage_id" uuid NOT NULL, "child_first_name" text NOT NULL, "child_last_name" text NOT NULL, "child_date_of_birth" date, "child_gender" "public"."admission_applications_child_gender_enum", "child_notes" text, "desired_grade_level_id" uuid, "desired_school_class_id" uuid, "desired_enrollment_date" date, "status" "public"."admission_applications_status_enum" NOT NULL DEFAULT 'ACTIVE', "source" "public"."admission_applications_source_enum" NOT NULL DEFAULT 'MANUAL', "enrolled_student_id" uuid, "stage_entered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "position" integer NOT NULL DEFAULT '0', "rejection_reason" text, CONSTRAINT "PK_ad1210c5f52263b40753399b622" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_apps_org_stage_position" ON "admission_applications" ("organization_id", "admission_stage_id", "position") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_apps_stage" ON "admission_applications" ("admission_stage_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_apps_family" ON "admission_applications" ("family_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_apps_org" ON "admission_applications" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "admission_reminders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "application_id" uuid NOT NULL, "due_at" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(200) NOT NULL, "note" text, "assigned_to_membership_id" uuid, "created_by_membership_id" uuid, "completed_at" TIMESTAMP WITH TIME ZONE, "completed_by_membership_id" uuid, CONSTRAINT "PK_ceaa052488e5e1da78deaca5098" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_reminders_assignee_due" ON "admission_reminders" ("assigned_to_membership_id", "due_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_reminders_app" ON "admission_reminders" ("application_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_reminders_org_due" ON "admission_reminders" ("organization_id", "due_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_audit_logs_action_enum" AS ENUM('CREATED', 'STAGE_CHANGED', 'FIELD_UPDATED', 'CONTACT_ADDED', 'CONTACT_REMOVED', 'NOTE_ADDED', 'FORM_SUBMITTED', 'ENROLLED', 'REJECTED', 'ARCHIVED', 'RESTORED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admission_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "application_id" uuid NOT NULL, "actor_membership_id" uuid, "action" "public"."admission_audit_logs_action_enum" NOT NULL, "from_stage_id" uuid, "to_stage_id" uuid, "field_name" character varying(120), "old_value" text, "new_value" text, "metadata" jsonb, CONSTRAINT "PK_cc29d87eaa10c1fc88984e9021d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_audit_logs_app" ON "admission_audit_logs" ("application_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_audit_logs_org" ON "admission_audit_logs" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_activities_type_enum" AS ENUM('CALL', 'EMAIL', 'MEETING', 'NOTE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admission_activities_direction_enum" AS ENUM('INBOUND', 'OUTBOUND')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admission_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "application_id" uuid NOT NULL, "type" "public"."admission_activities_type_enum" NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "subject" character varying(200), "body" text, "direction" "public"."admission_activities_direction_enum", "duration_minutes" integer, "location" character varying(200), "created_by_membership_id" uuid, CONSTRAINT "PK_1e1f56a64505640bc84d2675cbf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_activities_app_occurred" ON "admission_activities" ("application_id", "occurred_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_admission_activities_org" ON "admission_activities" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "time_tracking_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ended_at" TIMESTAMP WITH TIME ZONE, "break_minutes" integer, "notes" text, CONSTRAINT "PK_250aa30918af4eb88cd6f2b915b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_time_tracking_employee_started" ON "time_tracking_entries" ("employee_id", "started_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_contracts_contract_type_enum" AS ENUM('PERMANENT', 'TEMPORARY', 'INTERNSHIP', 'APPRENTICESHIP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_contracts_payment_interval_enum" AS ENUM('MONTHLY_X12', 'MONTHLY_X13')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date, "probation_end_date" date, "contract_type" "public"."employee_contracts_contract_type_enum", "position" character varying(200), "supervisor_membership_id" uuid, "workload_percent" numeric(5,2), "weekly_hours" numeric(5,2), "gross_salary" numeric(12,2), "payment_interval" "public"."employee_contracts_payment_interval_enum", "has_13th_salary" boolean, "annual_vacation_days" integer, "remaining_vacation_days" numeric(5,2), "notes" text, "previous_contract_id" uuid, CONSTRAINT "PK_a04015bb4378a8825b52be4817d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_hr_profiles_residence_permit_type_enum" AS ENUM('CITIZEN', 'B', 'C', 'L', 'G', 'F', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_hr_profiles_marital_status_enum" AS ENUM('SINGLE', 'MARRIED', 'REGISTERED_PARTNERSHIP', 'SEPARATED', 'DIVORCED', 'WIDOWED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_hr_profiles_onboarding_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_hr_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "employee_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "iban" character varying(50), "bank_account_holder" character varying(200), "bank_name" character varying(200), "bvg_insurance_number" character varying(60), "withholding_tax_code" character varying(20), "nationality" character varying(80), "residence_permit_type" "public"."employee_hr_profiles_residence_permit_type_enum", "residence_permit_valid_until" date, "marital_status" "public"."employee_hr_profiles_marital_status_enum", "denomination" character varying(80), "number_of_children" integer, "onboarding_status" "public"."employee_hr_profiles_onboarding_status_enum", "nda_signed" boolean, "criminal_record_submitted" boolean, CONSTRAINT "REL_22664ba4ab93c185b31057b611" UNIQUE ("employee_id"), CONSTRAINT "PK_8b0ea03c79a84047594455d26be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_hr_profile_org" ON "employee_hr_profiles" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_employee_hr_profile_employee" ON "employee_hr_profiles" ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_emergency_profiles_contact1_relationship_enum" AS ENUM('SPOUSE', 'PARTNER', 'PARENT', 'CHILD', 'SIBLING', 'FRIEND', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_emergency_profiles_contact2_relationship_enum" AS ENUM('SPOUSE', 'PARTNER', 'PARENT', 'CHILD', 'SIBLING', 'FRIEND', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_emergency_profiles_blood_type_enum" AS ENUM('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_emergency_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "employee_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "contact1_name" character varying(200), "contact1_relationship" "public"."employee_emergency_profiles_contact1_relationship_enum", "contact1_phone" character varying(60), "contact1_email" character varying(200), "contact2_name" character varying(200), "contact2_relationship" "public"."employee_emergency_profiles_contact2_relationship_enum", "contact2_phone" character varying(60), "contact2_email" character varying(200), "blood_type" "public"."employee_emergency_profiles_blood_type_enum", "allergies" text, "chronic_conditions" text, "emergency_medications" text, "primary_doctor_name" character varying(200), "primary_doctor_phone" character varying(60), "pharmacy_name" character varying(200), CONSTRAINT "REL_e39c9fd536bca193d0478f3ff8" UNIQUE ("employee_id"), CONSTRAINT "PK_4b89c48f27712d1d7e55778968a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_emergency_profile_org" ON "employee_emergency_profiles" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_employee_emergency_profile_employee" ON "employee_emergency_profiles" ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employee_audit_logs_entity_type_enum" AS ENUM('USER', 'MEMBERSHIP', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "employee_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "actor_membership_id" uuid, "entity_type" "public"."employee_audit_logs_entity_type_enum" NOT NULL, "field_name" character varying(120) NOT NULL, "old_value" text, "new_value" text, CONSTRAINT "PK_0bd552c555ea17e0c77a5f63119" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_audit_logs_org" ON "employee_audit_logs" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_audit_logs_employee" ON "employee_audit_logs" ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "record_keeping_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "introduced_stuck_days" integer NOT NULL DEFAULT '30', "practiced_stuck_days" integer NOT NULL DEFAULT '90', "big_gap_days" integer NOT NULL DEFAULT '60', CONSTRAINT "PK_fa39ef26204fed870a2ec31b157" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_record_keeping_settings_org" ON "record_keeping_settings" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_status_enum" AS ENUM('PLANNING', 'INTRODUCED', 'PRACTICED', 'MASTERED', 'NEEDS_MORE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_engagement_enum" AS ENUM('FOCUSED', 'INTERESTED', 'MECHANICAL', 'RESISTANT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_difficulty_enum" AS ENUM('TOO_EASY', 'JUST_RIGHT', 'TOO_HARD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_social_form_enum" AS ENUM('ALONE', 'WITH_PARTNER', 'SMALL_GROUP', 'WITH_GUIDE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_self_assessment_enum" AS ENUM('UNDERSTOOD', 'PARTIAL', 'NEEDS_REPEAT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_teacher_preparation_enum" AS ENUM('WELL_PREPARED', 'ACCEPTABLE', 'RUSHED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_room_mood_enum" AS ENUM('CALM', 'FOCUSED', 'RESTLESS', 'DIFFICULT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_teacher_stress_level_enum" AS ENUM('RELAXED', 'NORMAL', 'STRESSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_self_confidence_enum" AS ENUM('CONFIDENT', 'TENTATIVE', 'INSECURE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_persistence_enum" AS ENUM('PERSISTS', 'SEEKS_HELP', 'GIVES_UP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_records_concentration_enum" AS ENUM('FLOW', 'PARTIAL_FOCUS', 'INTERRUPTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "student_id" uuid NOT NULL, "lesson_id" uuid NOT NULL, "recorded_at" date NOT NULL, "status" "public"."lesson_records_status_enum" NOT NULL, "note" text, "recorded_by_id" uuid, "school_class_enrollment_id" uuid, "organization_id" uuid NOT NULL, "engagement" "public"."lesson_records_engagement_enum", "difficulty" "public"."lesson_records_difficulty_enum", "social_form" "public"."lesson_records_social_form_enum", "self_assessment" "public"."lesson_records_self_assessment_enum", "self_assessment_by_child" boolean NOT NULL DEFAULT false, "lesson_clarity_confirmed" boolean, "teacher_preparation" "public"."lesson_records_teacher_preparation_enum", "room_mood" "public"."lesson_records_room_mood_enum", "teacher_stress_level" "public"."lesson_records_teacher_stress_level_enum", "self_confidence" "public"."lesson_records_self_confidence_enum", "persistence" "public"."lesson_records_persistence_enum", "concentration" "public"."lesson_records_concentration_enum", CONSTRAINT "PK_302542b59645d269a43fe0826b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lesson_records_lesson_date" ON "lesson_records" ("organization_id", "lesson_id", "recorded_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lesson_records_student_lesson_date" ON "lesson_records" ("organization_id", "student_id", "lesson_id", "recorded_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lesson_records_lesson" ON "lesson_records" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lesson_records_student" ON "lesson_records" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lesson_records_org" ON "lesson_records" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_roles" ("membership_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_9f66b1234388294e15f26799afe" PRIMARY KEY ("membership_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee7bc65abd4c38c856f1361fd" ON "membership_roles" ("membership_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c625b47ba8734dafec257d918f" ON "membership_roles" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_lesson_prerequisites" ("lesson_id" uuid NOT NULL, "prerequisite_id" uuid NOT NULL, CONSTRAINT "PK_8a1178b1ecf6ac7c7e47ce89129" PRIMARY KEY ("lesson_id", "prerequisite_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd118b1b01db123e8de27134b6" ON "curriculum_lesson_prerequisites" ("lesson_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b98e488759445d0d457411561" ON "curriculum_lesson_prerequisites" ("prerequisite_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_class_grade_levels" ("schoolClassesId" uuid NOT NULL, "gradeLevelsId" uuid NOT NULL, CONSTRAINT "PK_3f465f64f7e12e76fab646ed6d1" PRIMARY KEY ("schoolClassesId", "gradeLevelsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73846963a5f64ec3b6ee9eb714" ON "school_class_grade_levels" ("schoolClassesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02227e685b15723ebfbaa4ead8" ON "school_class_grade_levels" ("gradeLevelsId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_class_teachers" ("school_class_id" uuid NOT NULL, "employee_id" uuid NOT NULL, CONSTRAINT "PK_e25cc1dc4832a79090dfc11c637" PRIMARY KEY ("school_class_id", "employee_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41b9257b2be5948809747b1dee" ON "school_class_teachers" ("school_class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f49008770d12dda0a9db0130a1" ON "school_class_teachers" ("employee_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD CONSTRAINT "FK_fdc736f761896ccc179c823a785" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_c328a1ecd12a5f153a96df4509e" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_category_translations" ADD CONSTRAINT "FK_a3585b9965f516b2de39e1f47ef" FOREIGN KEY ("category_id") REFERENCES "employee_absence_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD CONSTRAINT "FK_60f36b14c39a92f81562e364b8f" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" ADD CONSTRAINT "FK_46a33befbd94e583a1af7a694f1" FOREIGN KEY ("employee_absence_id") REFERENCES "employee_absences"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" ADD CONSTRAINT "FK_af7df0b71afd18fada9aa5faa5b" FOREIGN KEY ("absence_category_id") REFERENCES "employee_absence_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" ADD CONSTRAINT "FK_d68a1ee8f4851fd41aba78bdef9" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" ADD CONSTRAINT "FK_70eea26c9d79ba1492ab1497e0d" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD CONSTRAINT "FK_c2c6d1df52d3bd07cb48f4b619d" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD CONSTRAINT "FK_1015e41ca4eefa1fe573970a8cf" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD CONSTRAINT "FK_23ca602c911447f128564f8ecf4" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD CONSTRAINT "FK_7b17dbbef94928733e0fed97a1c" FOREIGN KEY ("absence_category_id") REFERENCES "employee_absence_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_notes" ADD CONSTRAINT "FK_246642c428ada37e2ca0ea16ab4" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_notes" ADD CONSTRAINT "FK_38fca1bf0bb3a7ed9545ad01097" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_notes" ADD CONSTRAINT "FK_0129bf201134ced4edeef0e8fae" FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_6316cb096adabe354fa3af73388" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_fdad7d5768277e60c40e01cdcea" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_aba48de73c7fc9c20fbcfebf57f" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_accounts" ADD CONSTRAINT "FK_3883a562da62e42cfd1cc35e28c" FOREIGN KEY ("user_email_id") REFERENCES "user_emails"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_emails" ADD CONSTRAINT "FK_2e88b95787b903d46ab3cc3eb91" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_e5380c394ec7912046d07b54290" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_7c1e2fdfed4f6838e0c05ae5051" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_f2bd63962b485e73f29b96a442e" FOREIGN KEY ("user_email_id") REFERENCES "user_emails"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_0b3045c0a2eae49f70f958b063a" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" ADD CONSTRAINT "FK_c47b2784f7ab57d9ffbb6c83bb9" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_translations" ADD CONSTRAINT "FK_ab163c9acc7f03c5d5774edbcda" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curricula" ADD CONSTRAINT "FK_47ae56eb1089128fbd4cb6a83ed" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_level_translations" ADD CONSTRAINT "FK_4e4cc0b5a95b5aba0509b34e589" FOREIGN KEY ("curriculum_level_id") REFERENCES "curriculum_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_levels" ADD CONSTRAINT "FK_47f97b5af3f06c474e51a5b88c1" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_levels" ADD CONSTRAINT "FK_5216c15d35c6a7d54b9274454b3" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_node_translations" ADD CONSTRAINT "FK_db939782c1db08e03a0786eefb0" FOREIGN KEY ("curriculum_node_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" ADD CONSTRAINT "FK_2e3d18be842c4f310cd1dde6d1e" FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" ADD CONSTRAINT "FK_6d5039cd9157d993d2fb15cb815" FOREIGN KEY ("level_id") REFERENCES "curriculum_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" ADD CONSTRAINT "FK_5dd6c42285724424c715df9a312" FOREIGN KEY ("parent_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" ADD CONSTRAINT "FK_e3d20baf611f95d979014d11535" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_98e1ca336038167c7eb48c02582" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_d763e6c05412119cf00d356e664" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_stages" ADD CONSTRAINT "FK_5ff2861a989ebd639fbd9ae0aef" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_58201191dae574813c67fd0cde0" FOREIGN KEY ("admission_stage_id") REFERENCES "admission_stages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_9571384818ecf499779d3a9d141" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_notes" ADD CONSTRAINT "FK_260a8581782d7b51536ae22dfac" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_notes" ADD CONSTRAINT "FK_cdbb243c611e9916766a5f35b76" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_notes" ADD CONSTRAINT "FK_2139a2fc3def3a082fa44c79817" FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_levels" ADD CONSTRAINT "FK_8ceca7eebfad3f2ab6329c9dd4f" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_classes" ADD CONSTRAINT "FK_a10d5ef992435060f4a442de4cb" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_enrollments" ADD CONSTRAINT "FK_a27ccc85673fb488132f829cff5" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_enrollments" ADD CONSTRAINT "FK_058382e2c49bf0486e7fb171ea6" FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_enrollments" ADD CONSTRAINT "FK_9321ab76ca1909d52f48e28b3b7" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "families" ADD CONSTRAINT "FK_d41563b62b1fb122930e30992df" FOREIGN KEY ("primary_address_id") REFERENCES "addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "families" ADD CONSTRAINT "FK_41cdd4ce27c2b9e8ab21cf09ac9" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_persons" ADD CONSTRAINT "FK_a978db27710c04103344715923d" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_persons" ADD CONSTRAINT "FK_e44cd89bd652e11576d6747c7b0" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_persons" ADD CONSTRAINT "FK_81f3274500657e097ba99a4ad88" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_contact_persons" ADD CONSTRAINT "FK_a7ff23eaf987180987e892ec48c" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_contact_persons" ADD CONSTRAINT "FK_e2344583bba5052cea99ebb5aa8" FOREIGN KEY ("contact_person_id") REFERENCES "contact_persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_contact_persons" ADD CONSTRAINT "FK_a9833364d52e971db441356319a" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD CONSTRAINT "FK_dec706243aba0414172a5d95cc8" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD CONSTRAINT "FK_4a9076384566b1c8599398d718e" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD CONSTRAINT "FK_62d0a748a4c6e26765002d67cdd" FOREIGN KEY ("admission_stage_id") REFERENCES "admission_stages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD CONSTRAINT "FK_fb8f6397d3bef6550e32aac4f08" FOREIGN KEY ("desired_grade_level_id") REFERENCES "grade_levels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD CONSTRAINT "FK_9be1996e0ac9d5ae56833a14f09" FOREIGN KEY ("desired_school_class_id") REFERENCES "school_classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD CONSTRAINT "FK_a9805ff2f8ed139c859d7ab1017" FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" ADD CONSTRAINT "FK_b8d1103855d4d55ae6273264134" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" ADD CONSTRAINT "FK_daf38393f9adb4631c82f21b519" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" ADD CONSTRAINT "FK_db65f9b90c8d46ee02262d543b2" FOREIGN KEY ("assigned_to_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" ADD CONSTRAINT "FK_bd5925ad6f652d0a38b6cdae59d" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" ADD CONSTRAINT "FK_72ae1d4bf40d4a64830abf9ea87" FOREIGN KEY ("completed_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" ADD CONSTRAINT "FK_94b9290e7ec923a5c3d58380671" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" ADD CONSTRAINT "FK_18c687e2f15f86aa89d428d1ffa" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" ADD CONSTRAINT "FK_49afa806de95d98c7141d84f8fe" FOREIGN KEY ("actor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" ADD CONSTRAINT "FK_efbe65cf7f627e224285931c094" FOREIGN KEY ("from_stage_id") REFERENCES "admission_stages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" ADD CONSTRAINT "FK_79bed9ffe61cc091442eac2d7c7" FOREIGN KEY ("to_stage_id") REFERENCES "admission_stages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_activities" ADD CONSTRAINT "FK_994bb8494d93fc7a2fd1bded70a" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_activities" ADD CONSTRAINT "FK_50704f8d8714f51cfc829c4d451" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_activities" ADD CONSTRAINT "FK_4bde40a2fd087238171267bfec8" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD CONSTRAINT "FK_bd2d41d6f9fcf399bc622651b21" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD CONSTRAINT "FK_8a61603a82da7942c0de69c858b" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD CONSTRAINT "FK_58cfea941f7657971037c08634e" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD CONSTRAINT "FK_764f83b1ad1017c0210a5ab3624" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD CONSTRAINT "FK_8894bbc8734dd8aa35ac4abd966" FOREIGN KEY ("supervisor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD CONSTRAINT "FK_e9719b7e8e153c4080175cb613e" FOREIGN KEY ("previous_contract_id") REFERENCES "employee_contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_hr_profiles" ADD CONSTRAINT "FK_22664ba4ab93c185b31057b6113" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_hr_profiles" ADD CONSTRAINT "FK_625a587cfe709b6f97ee20b30d5" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_emergency_profiles" ADD CONSTRAINT "FK_e39c9fd536bca193d0478f3ff88" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_emergency_profiles" ADD CONSTRAINT "FK_69567dd8478973835bdcbbda129" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_audit_logs" ADD CONSTRAINT "FK_2d9cf5d68d837a395a803e65899" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_audit_logs" ADD CONSTRAINT "FK_ed8bd8433973471b9c5082fffdb" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_audit_logs" ADD CONSTRAINT "FK_e94e6780e4bceeadd9624485927" FOREIGN KEY ("actor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "record_keeping_settings" ADD CONSTRAINT "FK_5e69a4d3460246fef61fa4a663f" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" ADD CONSTRAINT "FK_330a8a3eca2776602909e0013c4" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" ADD CONSTRAINT "FK_9aa398bf914c3de9125646444a0" FOREIGN KEY ("lesson_id") REFERENCES "curriculum_nodes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" ADD CONSTRAINT "FK_1476cec46f620936fb60053c3cd" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" ADD CONSTRAINT "FK_588f8c33181660e25e721a76e26" FOREIGN KEY ("school_class_enrollment_id") REFERENCES "school_class_enrollments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" ADD CONSTRAINT "FK_7ee2dd1c2dc909b1fec0d3015e4" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_roles" ADD CONSTRAINT "FK_cee7bc65abd4c38c856f1361fd6" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_roles" ADD CONSTRAINT "FK_c625b47ba8734dafec257d918f7" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_lesson_prerequisites" ADD CONSTRAINT "FK_cd118b1b01db123e8de27134b64" FOREIGN KEY ("lesson_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_lesson_prerequisites" ADD CONSTRAINT "FK_4b98e488759445d0d4574115611" FOREIGN KEY ("prerequisite_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_grade_levels" ADD CONSTRAINT "FK_73846963a5f64ec3b6ee9eb7141" FOREIGN KEY ("schoolClassesId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_grade_levels" ADD CONSTRAINT "FK_02227e685b15723ebfbaa4ead82" FOREIGN KEY ("gradeLevelsId") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_teachers" ADD CONSTRAINT "FK_41b9257b2be5948809747b1dee2" FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_teachers" ADD CONSTRAINT "FK_f49008770d12dda0a9db0130a1d" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school_class_teachers" DROP CONSTRAINT "FK_f49008770d12dda0a9db0130a1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_teachers" DROP CONSTRAINT "FK_41b9257b2be5948809747b1dee2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_grade_levels" DROP CONSTRAINT "FK_02227e685b15723ebfbaa4ead82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_grade_levels" DROP CONSTRAINT "FK_73846963a5f64ec3b6ee9eb7141"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_lesson_prerequisites" DROP CONSTRAINT "FK_4b98e488759445d0d4574115611"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_lesson_prerequisites" DROP CONSTRAINT "FK_cd118b1b01db123e8de27134b64"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_roles" DROP CONSTRAINT "FK_c625b47ba8734dafec257d918f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_roles" DROP CONSTRAINT "FK_cee7bc65abd4c38c856f1361fd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" DROP CONSTRAINT "FK_7ee2dd1c2dc909b1fec0d3015e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" DROP CONSTRAINT "FK_588f8c33181660e25e721a76e26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" DROP CONSTRAINT "FK_1476cec46f620936fb60053c3cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" DROP CONSTRAINT "FK_9aa398bf914c3de9125646444a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_records" DROP CONSTRAINT "FK_330a8a3eca2776602909e0013c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "record_keeping_settings" DROP CONSTRAINT "FK_5e69a4d3460246fef61fa4a663f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_audit_logs" DROP CONSTRAINT "FK_e94e6780e4bceeadd9624485927"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_audit_logs" DROP CONSTRAINT "FK_ed8bd8433973471b9c5082fffdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_audit_logs" DROP CONSTRAINT "FK_2d9cf5d68d837a395a803e65899"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_emergency_profiles" DROP CONSTRAINT "FK_69567dd8478973835bdcbbda129"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_emergency_profiles" DROP CONSTRAINT "FK_e39c9fd536bca193d0478f3ff88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_hr_profiles" DROP CONSTRAINT "FK_625a587cfe709b6f97ee20b30d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_hr_profiles" DROP CONSTRAINT "FK_22664ba4ab93c185b31057b6113"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP CONSTRAINT "FK_e9719b7e8e153c4080175cb613e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP CONSTRAINT "FK_8894bbc8734dd8aa35ac4abd966"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP CONSTRAINT "FK_764f83b1ad1017c0210a5ab3624"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP CONSTRAINT "FK_58cfea941f7657971037c08634e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP CONSTRAINT "FK_8a61603a82da7942c0de69c858b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP CONSTRAINT "FK_bd2d41d6f9fcf399bc622651b21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_activities" DROP CONSTRAINT "FK_4bde40a2fd087238171267bfec8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_activities" DROP CONSTRAINT "FK_50704f8d8714f51cfc829c4d451"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_activities" DROP CONSTRAINT "FK_994bb8494d93fc7a2fd1bded70a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" DROP CONSTRAINT "FK_79bed9ffe61cc091442eac2d7c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" DROP CONSTRAINT "FK_efbe65cf7f627e224285931c094"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" DROP CONSTRAINT "FK_49afa806de95d98c7141d84f8fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" DROP CONSTRAINT "FK_18c687e2f15f86aa89d428d1ffa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_audit_logs" DROP CONSTRAINT "FK_94b9290e7ec923a5c3d58380671"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" DROP CONSTRAINT "FK_72ae1d4bf40d4a64830abf9ea87"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" DROP CONSTRAINT "FK_bd5925ad6f652d0a38b6cdae59d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" DROP CONSTRAINT "FK_db65f9b90c8d46ee02262d543b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" DROP CONSTRAINT "FK_daf38393f9adb4631c82f21b519"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" DROP CONSTRAINT "FK_b8d1103855d4d55ae6273264134"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT "FK_a9805ff2f8ed139c859d7ab1017"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT "FK_9be1996e0ac9d5ae56833a14f09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT "FK_fb8f6397d3bef6550e32aac4f08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT "FK_62d0a748a4c6e26765002d67cdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT "FK_4a9076384566b1c8599398d718e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT "FK_dec706243aba0414172a5d95cc8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_contact_persons" DROP CONSTRAINT "FK_a9833364d52e971db441356319a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_contact_persons" DROP CONSTRAINT "FK_e2344583bba5052cea99ebb5aa8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_contact_persons" DROP CONSTRAINT "FK_a7ff23eaf987180987e892ec48c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_persons" DROP CONSTRAINT "FK_81f3274500657e097ba99a4ad88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_persons" DROP CONSTRAINT "FK_e44cd89bd652e11576d6747c7b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_persons" DROP CONSTRAINT "FK_a978db27710c04103344715923d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "families" DROP CONSTRAINT "FK_41cdd4ce27c2b9e8ab21cf09ac9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "families" DROP CONSTRAINT "FK_d41563b62b1fb122930e30992df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_enrollments" DROP CONSTRAINT "FK_9321ab76ca1909d52f48e28b3b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_enrollments" DROP CONSTRAINT "FK_058382e2c49bf0486e7fb171ea6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_enrollments" DROP CONSTRAINT "FK_a27ccc85673fb488132f829cff5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_classes" DROP CONSTRAINT "FK_a10d5ef992435060f4a442de4cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP CONSTRAINT "FK_8ceca7eebfad3f2ab6329c9dd4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_notes" DROP CONSTRAINT "FK_2139a2fc3def3a082fa44c79817"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_notes" DROP CONSTRAINT "FK_cdbb243c611e9916766a5f35b76"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_notes" DROP CONSTRAINT "FK_260a8581782d7b51536ae22dfac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_9571384818ecf499779d3a9d141"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_58201191dae574813c67fd0cde0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_stages" DROP CONSTRAINT "FK_5ff2861a989ebd639fbd9ae0aef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP CONSTRAINT "FK_d763e6c05412119cf00d356e664"`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP CONSTRAINT "FK_98e1ca336038167c7eb48c02582"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" DROP CONSTRAINT "FK_e3d20baf611f95d979014d11535"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" DROP CONSTRAINT "FK_5dd6c42285724424c715df9a312"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" DROP CONSTRAINT "FK_6d5039cd9157d993d2fb15cb815"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_nodes" DROP CONSTRAINT "FK_2e3d18be842c4f310cd1dde6d1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_node_translations" DROP CONSTRAINT "FK_db939782c1db08e03a0786eefb0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_levels" DROP CONSTRAINT "FK_5216c15d35c6a7d54b9274454b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_levels" DROP CONSTRAINT "FK_47f97b5af3f06c474e51a5b88c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_level_translations" DROP CONSTRAINT "FK_4e4cc0b5a95b5aba0509b34e589"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curricula" DROP CONSTRAINT "FK_47ae56eb1089128fbd4cb6a83ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_translations" DROP CONSTRAINT "FK_ab163c9acc7f03c5d5774edbcda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_settings" DROP CONSTRAINT "FK_c47b2784f7ab57d9ffbb6c83bb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_0b3045c0a2eae49f70f958b063a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_f2bd63962b485e73f29b96a442e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_7c1e2fdfed4f6838e0c05ae5051"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_e5380c394ec7912046d07b54290"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_emails" DROP CONSTRAINT "FK_2e88b95787b903d46ab3cc3eb91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_accounts" DROP CONSTRAINT "FK_3883a562da62e42cfd1cc35e28c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_aba48de73c7fc9c20fbcfebf57f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_fdad7d5768277e60c40e01cdcea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_6316cb096adabe354fa3af73388"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_notes" DROP CONSTRAINT "FK_0129bf201134ced4edeef0e8fae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_notes" DROP CONSTRAINT "FK_38fca1bf0bb3a7ed9545ad01097"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_notes" DROP CONSTRAINT "FK_246642c428ada37e2ca0ea16ab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP CONSTRAINT "FK_7b17dbbef94928733e0fed97a1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP CONSTRAINT "FK_23ca602c911447f128564f8ecf4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP CONSTRAINT "FK_1015e41ca4eefa1fe573970a8cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP CONSTRAINT "FK_c2c6d1df52d3bd07cb48f4b619d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" DROP CONSTRAINT "FK_70eea26c9d79ba1492ab1497e0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" DROP CONSTRAINT "FK_d68a1ee8f4851fd41aba78bdef9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" DROP CONSTRAINT "FK_af7df0b71afd18fada9aa5faa5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_days" DROP CONSTRAINT "FK_46a33befbd94e583a1af7a694f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP CONSTRAINT "FK_60f36b14c39a92f81562e364b8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_category_translations" DROP CONSTRAINT "FK_a3585b9965f516b2de39e1f47ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_c328a1ecd12a5f153a96df4509e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" DROP CONSTRAINT "FK_fdc736f761896ccc179c823a785"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f49008770d12dda0a9db0130a1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_41b9257b2be5948809747b1dee"`,
    );
    await queryRunner.query(`DROP TABLE "school_class_teachers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_02227e685b15723ebfbaa4ead8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73846963a5f64ec3b6ee9eb714"`,
    );
    await queryRunner.query(`DROP TABLE "school_class_grade_levels"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b98e488759445d0d457411561"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd118b1b01db123e8de27134b6"`,
    );
    await queryRunner.query(`DROP TABLE "curriculum_lesson_prerequisites"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c625b47ba8734dafec257d918f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee7bc65abd4c38c856f1361fd"`,
    );
    await queryRunner.query(`DROP TABLE "membership_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`,
    );
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_lesson_records_org"`);
    await queryRunner.query(`DROP INDEX "public"."idx_lesson_records_student"`);
    await queryRunner.query(`DROP INDEX "public"."idx_lesson_records_lesson"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_lesson_records_student_lesson_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_lesson_records_lesson_date"`,
    );
    await queryRunner.query(`DROP TABLE "lesson_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_concentration_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_persistence_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_self_confidence_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_teacher_stress_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_room_mood_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_teacher_preparation_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_self_assessment_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_social_form_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_difficulty_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."lesson_records_engagement_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."lesson_records_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_record_keeping_settings_org"`,
    );
    await queryRunner.query(`DROP TABLE "record_keeping_settings"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_audit_logs_employee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_audit_logs_org"`,
    );
    await queryRunner.query(`DROP TABLE "employee_audit_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_audit_logs_entity_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_employee_emergency_profile_employee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_emergency_profile_org"`,
    );
    await queryRunner.query(`DROP TABLE "employee_emergency_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_emergency_profiles_blood_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_emergency_profiles_contact2_relationship_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_emergency_profiles_contact1_relationship_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_employee_hr_profile_employee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_hr_profile_org"`,
    );
    await queryRunner.query(`DROP TABLE "employee_hr_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_hr_profiles_onboarding_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_hr_profiles_marital_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_hr_profiles_residence_permit_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "employee_contracts"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_contracts_payment_interval_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_contracts_contract_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_time_tracking_employee_started"`,
    );
    await queryRunner.query(`DROP TABLE "time_tracking_entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_activities_org"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_activities_app_occurred"`,
    );
    await queryRunner.query(`DROP TABLE "admission_activities"`);
    await queryRunner.query(
      `DROP TYPE "public"."admission_activities_direction_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."admission_activities_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_audit_logs_org"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_audit_logs_app"`,
    );
    await queryRunner.query(`DROP TABLE "admission_audit_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."admission_audit_logs_action_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_reminders_org_due"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_reminders_app"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_reminders_assignee_due"`,
    );
    await queryRunner.query(`DROP TABLE "admission_reminders"`);
    await queryRunner.query(`DROP INDEX "public"."idx_admission_apps_org"`);
    await queryRunner.query(`DROP INDEX "public"."idx_admission_apps_family"`);
    await queryRunner.query(`DROP INDEX "public"."idx_admission_apps_stage"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_admission_apps_org_stage_position"`,
    );
    await queryRunner.query(`DROP TABLE "admission_applications"`);
    await queryRunner.query(
      `DROP TYPE "public"."admission_applications_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."admission_applications_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."admission_applications_child_gender_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_scp_org"`);
    await queryRunner.query(`DROP INDEX "public"."idx_scp_student"`);
    await queryRunner.query(`DROP INDEX "public"."idx_scp_contact_person"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_scp_student_contact_relationship"`,
    );
    await queryRunner.query(`DROP TABLE "student_contact_persons"`);
    await queryRunner.query(
      `DROP TYPE "public"."student_contact_persons_relationship_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_contact_persons_org"`);
    await queryRunner.query(`DROP INDEX "public"."idx_contact_persons_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_contact_persons_family"`);
    await queryRunner.query(`DROP TABLE "contact_persons"`);
    await queryRunner.query(`DROP TYPE "public"."contact_persons_roles_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."contact_persons_salutation_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_families_org"`);
    await queryRunner.query(`DROP TABLE "families"`);
    await queryRunner.query(`DROP INDEX "public"."idx_enrollment_org"`);
    await queryRunner.query(`DROP INDEX "public"."idx_enrollment_student"`);
    await queryRunner.query(`DROP INDEX "public"."idx_enrollment_class"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_enrollment_student_class_date"`,
    );
    await queryRunner.query(`DROP TABLE "school_class_enrollments"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_school_class_org_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_school_classes_org"`);
    await queryRunner.query(`DROP TABLE "school_classes"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_grade_level_org_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_grade_levels_org"`);
    await queryRunner.query(`DROP TABLE "grade_levels"`);
    await queryRunner.query(`DROP TABLE "student_notes"`);
    await queryRunner.query(`DROP TYPE "public"."student_notes_category_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_students_org"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_student_org_name_dob"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TYPE "public"."students_gender_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_admission_stages_org"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_admission_stage_org_slug"`,
    );
    await queryRunner.query(`DROP TABLE "admission_stages"`);
    await queryRunner.query(
      `DROP TYPE "public"."admission_stages_stage_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_addresses_org"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`DROP TABLE "country"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_country_input_templates_field"`,
    );
    await queryRunner.query(`DROP TABLE "country_input_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."country_input_templates_validator_kind_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."country_input_templates_field_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_curriculum_nodes_org"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_curriculum_nodes_curriculum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_curriculum_nodes_level"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_curriculum_nodes_parent"`,
    );
    await queryRunner.query(`DROP TABLE "curriculum_nodes"`);
    await queryRunner.query(
      `DROP TYPE "public"."curriculum_nodes_lesson_scale_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."curriculum_nodes_lesson_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."curriculum_nodes_node_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_curriculum_node_translation"`,
    );
    await queryRunner.query(`DROP TABLE "curriculum_node_translations"`);
    await queryRunner.query(
      `DROP TYPE "public"."curriculum_node_translations_locale_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_curriculum_levels_org"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_curriculum_levels_curriculum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_curriculum_level_curriculum_slug"`,
    );
    await queryRunner.query(`DROP TABLE "curriculum_levels"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_curriculum_level_translation"`,
    );
    await queryRunner.query(`DROP TABLE "curriculum_level_translations"`);
    await queryRunner.query(
      `DROP TYPE "public"."curriculum_level_translations_locale_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_curricula_org"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_curriculum_org_slug"`);
    await queryRunner.query(`DROP TABLE "curricula"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_curriculum_translation"`);
    await queryRunner.query(`DROP TABLE "curriculum_translations"`);
    await queryRunner.query(
      `DROP TYPE "public"."curriculum_translations_locale_enum"`,
    );
    await queryRunner.query(`DROP TABLE "organization_settings"`);
    await queryRunner.query(`DROP INDEX "public"."uq_users_username"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."idx_memberships_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_memberships_employee"`);
    await queryRunner.query(`DROP INDEX "public"."idx_memberships_org"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(`DROP TYPE "public"."memberships_persona_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_user_emails_email"`);
    await queryRunner.query(`DROP TABLE "user_emails"`);
    await queryRunner.query(`DROP INDEX "public"."uq_auth_provider_id"`);
    await queryRunner.query(`DROP TABLE "auth_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."auth_accounts_provider_enum"`);
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_team_member_team_employee"`,
    );
    await queryRunner.query(`DROP TABLE "team_members"`);
    await queryRunner.query(`DROP TABLE "employee_notes"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_notes_category_enum"`,
    );
    await queryRunner.query(`DROP TABLE "employee_absences"`);
    await queryRunner.query(`DROP TABLE "employee_absence_days"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_absence_categories_org"`,
    );
    await queryRunner.query(`DROP TABLE "employee_absence_categories"`);
    await queryRunner.query(
      `DROP TYPE "public"."employee_absence_categories_system_code_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_employee_absence_category_translation"`,
    );
    await queryRunner.query(
      `DROP TABLE "employee_absence_category_translations"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employee_absence_category_translations_locale_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_organizations_subdomain"`);
    await queryRunner.query(`DROP INDEX "public"."uq_organizations_domain"`);
    await queryRunner.query(`DROP INDEX "public"."idx_organizations_location"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP INDEX "public"."idx_roles_org"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_roles_org_system_code_not_null"`,
    );
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "public"."roles_system_code_enum"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TYPE "public"."permissions_code_enum"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_team_org_name"`);
    await queryRunner.query(`DROP TABLE "teams"`);
  }
}
