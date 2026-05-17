import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLessonRecords1779200200000 implements MigrationInterface {
  name = 'CreateLessonRecords1779200200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_status_enum') THEN
          CREATE TYPE "lesson_records_status_enum" AS ENUM (
            'PLANNING', 'INTRODUCED', 'PRACTICED', 'MASTERED', 'NEEDS_MORE'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "student_id" uuid NOT NULL,
        "lesson_id" uuid NOT NULL,
        "recorded_at" date NOT NULL,
        "status" "lesson_records_status_enum" NOT NULL,
        "note" text,
        "recorded_by_id" uuid,
        "school_class_enrollment_id" uuid,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_lesson_records" PRIMARY KEY ("id"),
        CONSTRAINT "fk_lesson_records_student"
          FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_lesson_records_lesson"
          FOREIGN KEY ("lesson_id") REFERENCES "curriculum_nodes"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_lesson_records_recorded_by"
          FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_lesson_records_enrollment"
          FOREIGN KEY ("school_class_enrollment_id") REFERENCES "school_class_enrollments"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_lesson_records_organization"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_records_org" ON "lesson_records" ("organization_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_records_student" ON "lesson_records" ("student_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_records_lesson" ON "lesson_records" ("lesson_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_records_student_lesson_date"
        ON "lesson_records" ("organization_id", "student_id", "lesson_id", "recorded_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_records_lesson_date"
        ON "lesson_records" ("organization_id", "lesson_id", "recorded_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_records"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_records_status_enum"`);
  }
}
