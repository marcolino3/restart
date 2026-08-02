import { MigrationInterface, QueryRunner } from 'typeorm';
import { seedOrgSystemRoles } from '@/roles/seeds/system-roles.seeder';
import { assignPermissionsToOrgSystemRoles } from '@/roles/seeds/assign-permissions-to-system-roles.seeder';

/**
 * Some organizations were created without running the system-role seeders
 * (e.g. orgs bootstrapped by ad-hoc scripts instead of
 * OrganizationsService.create), leaving them with zero roles at all. Any
 * membership in such an org has no role, so every permission check fails —
 * e.g. a TEACHER persona assigned to a school class still can't see
 * students/record-keeping because SCHOOL_CLASS_READ/STUDENT_READ/
 * RECORD_KEEPING_READ were never granted.
 *
 * This seeds the missing system roles + permissions for affected orgs, then
 * assigns the EMPLOYEE system role to any membership left without a role.
 */
export class BackfillMissingOrgSystemRoles1783120000000 implements MigrationInterface {
  name = 'BackfillMissingOrgSystemRoles1783120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orgs: { id: string }[] = await queryRunner.query(`
      SELECT o.id
      FROM organizations o
      WHERE NOT EXISTS (
        SELECT 1 FROM roles r
        WHERE r.organization_id = o.id AND r.is_system = true
      )
    `);

    for (const org of orgs) {
      await seedOrgSystemRoles(queryRunner.manager, org.id);
      await assignPermissionsToOrgSystemRoles(queryRunner.manager, org.id);
    }

    await queryRunner.query(`
      INSERT INTO "membership_roles" ("membership_id", "role_id")
      SELECT m."id", r."id"
      FROM "memberships" m
      JOIN "roles" r
        ON r."organization_id" = m."organization_id"
        AND r."is_system" = true
        AND r."system_code" = 'EMPLOYEE'
      WHERE NOT EXISTS (
        SELECT 1 FROM "membership_roles" mr WHERE mr."membership_id" = m."id"
      )
      ON CONFLICT ("membership_id", "role_id") DO NOTHING
    `);
  }

  public async down(): Promise<void> {
    // Backfill of missing data — no safe automatic rollback.
  }
}
