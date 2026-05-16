import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddPreviousContractIdToEmployeeContracts1779033600000
  implements MigrationInterface
{
  name = 'AddPreviousContractIdToEmployeeContracts1779033600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('employee_contracts');
    if (!hasTable) return;

    const table = await queryRunner.getTable('employee_contracts');
    const alreadyHasColumn = table?.findColumnByName('previous_contract_id');
    if (alreadyHasColumn) return;

    await queryRunner.addColumn(
      'employee_contracts',
      new TableColumn({
        name: 'previous_contract_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'employee_contracts',
      new TableForeignKey({
        columnNames: ['previous_contract_id'],
        referencedTableName: 'employee_contracts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'employee_contracts',
      new TableIndex({
        name: 'idx_employee_contracts_previous',
        columnNames: ['previous_contract_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('employee_contracts');
    if (!hasTable) return;

    const table = await queryRunner.getTable('employee_contracts');
    if (!table) return;

    const fk = table.foreignKeys.find((f) =>
      f.columnNames.includes('previous_contract_id'),
    );
    if (fk) {
      await queryRunner.dropForeignKey('employee_contracts', fk);
    }

    const idx = table.indices.find(
      (i) => i.name === 'idx_employee_contracts_previous',
    );
    if (idx) {
      await queryRunner.dropIndex('employee_contracts', idx);
    }

    if (table.findColumnByName('previous_contract_id')) {
      await queryRunner.dropColumn('employee_contracts', 'previous_contract_id');
    }
  }
}
