import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmployeeOrganizationProfiles1789040000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id uuid, ADD COLUMN IF NOT EXISTS account_link_status varchar(20) NOT NULL DEFAULT 'UNLINKED'`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_first_name varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_last_name varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_title varchar(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_date_of_birth date`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_social_security_number varchar(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_private_email varchar(320)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_street varchar(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_house_number varchar(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_address_line_2 varchar(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_postal_code varchar(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_city varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_country varchar(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_avatar_url varchar(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_language varchar(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_email varchar(320)`,
    );
    await queryRunner.query(
      `UPDATE employees e SET organization_id = m.organization_id, account_link_status = 'LEGACY', profile_first_name = u.first_name, profile_last_name = u.last_name, profile_title = u.title, profile_date_of_birth = u.date_of_birth, profile_social_security_number = u.social_security_number, profile_private_email = u.private_email, profile_street = u.street, profile_house_number = u.house_number, profile_address_line_2 = u.address_line_2, profile_postal_code = u.postal_code, profile_city = u.city, profile_country = u.country, profile_avatar_url = u.avatar_url, profile_language = u.language, profile_email = LOWER(TRIM(ue.email)) FROM memberships m JOIN users u ON u.id = m.user_id LEFT JOIN user_emails ue ON ue.id = m.user_email_id WHERE m.employee_id = e.id AND e.organization_id IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_org_email ON employees(organization_id, profile_email) WHERE profile_email IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ALTER COLUMN organization_id SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE memberships ALTER COLUMN user_id DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_memberships_org_user ON memberships (organization_id, user_id) WHERE user_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_id_org ON employees (id, organization_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE memberships ADD CONSTRAINT fk_membership_employee_org FOREIGN KEY (employee_id, organization_id) REFERENCES employees(id, organization_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE employees ADD CONSTRAINT fk_employee_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)`,
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS employee_account_invitations (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), version integer NOT NULL DEFAULT 1,
      "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now(), "deletedAt" date,
      token_hash varchar(64) NOT NULL UNIQUE, employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      organization_id uuid NOT NULL REFERENCES organizations(id), email varchar(320) NOT NULL,
      expires_at timestamptz NOT NULL, consumed_at timestamptz,
      FOREIGN KEY (employee_id, organization_id) REFERENCES employees(id, organization_id) ON DELETE CASCADE
    )`);
  }
  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Employee profile migration is additive and cannot safely be reverted; use a forward correction.',
      ),
    );
  }
}
