import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitSchema1720000000000 implements MigrationInterface {
  name = 'InitSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(new Table({
      name: 'departments',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar' },
        { name: 'description', type: 'text', isNullable: true },
      ]
    }), true);

    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'email', type: 'varchar', isUnique: true },
        { name: 'passwordHash', type: 'varchar' },
        { name: 'role', type: 'varchar', default: "'student'" },
        { name: 'department_id', type: 'uuid', isNullable: true },
        { name: 'faculty', type: 'varchar', isNullable: true },
        { name: 'reputation_score', type: 'decimal', precision: 3, scale: 2, default: 5.0 },
      ]
    }), true);

    await queryRunner.createForeignKey('users', new TableForeignKey({
      columnNames: ['department_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'departments',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createTable(new Table({
      name: 'assets',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'category', type: 'varchar', default: "'physical'" },
        { name: 'condition', type: 'varchar', default: "'good'" },
        { name: 'status', type: 'varchar', default: "'available'" },
        { name: 'isHighValue', type: 'boolean', default: false },
        { name: 'department_id', type: 'uuid', isNullable: true },
        { name: 'bookingLeadTime', type: 'int', default: 0 },
      ]
    }), true);

    await queryRunner.createForeignKey('assets', new TableForeignKey({
      columnNames: ['department_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'departments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createTable(new Table({
      name: 'bookings',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'asset_id', type: 'uuid' },
        { name: 'user_id', type: 'uuid' },
        { name: 'start_time', type: 'timestamp' },
        { name: 'end_time', type: 'timestamp' },
        { name: 'status', type: 'varchar', default: "'pending'" },
        { name: 'managerComment', type: 'text', isNullable: true },
        { name: 'approvedBy', type: 'varchar', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    await queryRunner.createForeignKey('bookings', new TableForeignKey({ columnNames: ['asset_id'], referencedColumnNames: ['id'], referencedTableName: 'assets', onDelete: 'CASCADE' }));
    await queryRunner.createForeignKey('bookings', new TableForeignKey({ columnNames: ['user_id'], referencedColumnNames: ['id'], referencedTableName: 'users', onDelete: 'CASCADE' }));

    await queryRunner.createTable(new Table({
      name: 'peer_listings',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'owner_id', type: 'uuid' },
        { name: 'name', type: 'varchar' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'condition', type: 'varchar' },
        { name: 'status', type: 'varchar', default: "'available'" },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);
    
    await queryRunner.createForeignKey('peer_listings', new TableForeignKey({ columnNames: ['owner_id'], referencedColumnNames: ['id'], referencedTableName: 'users', onDelete: 'CASCADE' }));

    await queryRunner.createTable(new Table({
      name: 'peer_loans',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'peer_listing_id', type: 'uuid' },
        { name: 'borrower_id', type: 'uuid' },
        { name: 'start_time', type: 'timestamp' },
        { name: 'end_time', type: 'timestamp' },
        { name: 'status', type: 'varchar', default: "'pending'" },
        { name: 'lenderRating', type: 'int', isNullable: true },
        { name: 'borrowerRating', type: 'int', isNullable: true },
        { name: 'lenderReview', type: 'text', isNullable: true },
        { name: 'borrowerReview', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    await queryRunner.createForeignKey('peer_loans', new TableForeignKey({ columnNames: ['peer_listing_id'], referencedColumnNames: ['id'], referencedTableName: 'peer_listings', onDelete: 'CASCADE' }));
    await queryRunner.createForeignKey('peer_loans', new TableForeignKey({ columnNames: ['borrower_id'], referencedColumnNames: ['id'], referencedTableName: 'users', onDelete: 'CASCADE' }));

    await queryRunner.createTable(new Table({
      name: 'lost_found_items',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'reporter_id', type: 'uuid' },
        { name: 'type', type: 'varchar' },
        { name: 'name', type: 'varchar' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'location', type: 'varchar' },
        { name: 'date', type: 'timestamp' },
        { name: 'status', type: 'varchar', default: "'open'" },
        { name: 'ai_match_id', type: 'uuid', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    await queryRunner.createForeignKey('lost_found_items', new TableForeignKey({ columnNames: ['reporter_id'], referencedColumnNames: ['id'], referencedTableName: 'users', onDelete: 'CASCADE' }));

    await queryRunner.createTable(new Table({
      name: 'study_group_interests',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'user_id', type: 'uuid' },
        { name: 'module', type: 'varchar' },
        { name: 'preferredStyle', type: 'varchar' },
        { name: 'preferredSlots', type: 'jsonb' },
        { name: 'matched', type: 'boolean', default: false },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    await queryRunner.createForeignKey('study_group_interests', new TableForeignKey({ columnNames: ['user_id'], referencedColumnNames: ['id'], referencedTableName: 'users', onDelete: 'CASCADE' }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('study_group_interests');
    await queryRunner.dropTable('lost_found_items');
    await queryRunner.dropTable('peer_loans');
    await queryRunner.dropTable('peer_listings');
    await queryRunner.dropTable('bookings');
    await queryRunner.dropTable('assets');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('departments');
  }
}
