import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateStudentNotes1778932800000 implements MigrationInterface {
  name = 'CreateStudentNotes1778932800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_notes_category_enum') THEN
          CREATE TYPE "student_notes_category_enum" AS ENUM (
            'GENERAL', 'ACADEMIC', 'BEHAVIOR', 'MEETING', 'HEALTH', 'PARENT_CONTACT', 'OTHER'
          );
        END IF;
      END$$;
    `);

    const hasTable = await queryRunner.hasTable('student_notes');
    if (hasTable) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'student_notes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'version', type: 'integer', default: 1 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'isArchived', type: 'boolean', default: false },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          { name: 'deletedAt', type: 'date', isNullable: true },
          { name: 'student_id', type: 'uuid' },
          { name: 'organization_id', type: 'uuid' },
          { name: 'author_membership_id', type: 'uuid', isNullable: true },
          {
            name: 'category',
            type: 'student_notes_category_enum',
            default: `'GENERAL'`,
          },
          { name: 'title', type: 'varchar', length: '200' },
          { name: 'content', type: 'text' },
          { name: 'is_confidential', type: 'boolean', default: false },
          { name: 'date', type: 'date' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'student_notes',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'student_notes',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'student_notes',
      new TableForeignKey({
        columnNames: ['author_membership_id'],
        referencedTableName: 'memberships',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'student_notes',
      new TableIndex({
        name: 'idx_student_notes_student',
        columnNames: ['student_id'],
      }),
    );

    await queryRunner.createIndex(
      'student_notes',
      new TableIndex({
        name: 'idx_student_notes_org',
        columnNames: ['organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'student_notes',
      new TableIndex({
        name: 'idx_student_notes_date',
        columnNames: ['date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('student_notes', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "student_notes_category_enum"`);
  }
}
