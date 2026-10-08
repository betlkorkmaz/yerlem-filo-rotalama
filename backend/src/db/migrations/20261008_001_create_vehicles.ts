import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // gen_random_uuid() PostgreSQL 13+ ile hazır gelir; ek eklenti gerekmez.
  await knex.schema.createTable('vehicles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // Plaka normalize edilmiş halde saklanır (büyük harf, boşluksuz).
    // UNIQUE kısıtı, aynı anda gelen iki istekte bile tekrarı veritabanı seviyesinde engeller.
    t.text('plate').notNullable().unique();
    t.text('name').notNullable();
    t.text('type').notNullable();
    t.integer('capacity').notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_capacity_positive CHECK (capacity > 0),
      ADD CONSTRAINT vehicles_type_valid CHECK (type IN ('bus', 'midibus', 'minibus', 'van')),
      ADD CONSTRAINT vehicles_plate_normalized CHECK (plate = upper(plate) AND plate !~ '\\s')
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('vehicles');
}
