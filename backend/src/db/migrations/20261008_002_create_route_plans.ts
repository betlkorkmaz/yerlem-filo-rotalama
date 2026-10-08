import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('route_plans', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    // Araç bilgisi kopyalanmaz, ilişki kurulur. RESTRICT: plana bağlı araç silinemez,
    // böylece geçmiş planların aracı hiçbir zaman kaybolmaz.
    t.uuid('vehicle_id').notNullable().references('id').inTable('vehicles').onDelete('RESTRICT');
    t.text('status').notNullable().defaultTo('draft');
    // Null = rota henüz hesaplanmadı; rota servisi çalışmasa da taslak kaydedilebilir.
    t.integer('distance_m');
    t.integer('duration_s');
    t.jsonb('geometry');
    // Aynı "Kaydet" isteğinin tekrarında ikinci plan oluşmasın diye istemcinin ürettiği anahtar.
    t.uuid('client_request_id').unique();
    t.timestamps(true, true);
    t.index('vehicle_id');
  });

  await knex.raw(`
    ALTER TABLE route_plans
      ADD CONSTRAINT route_plans_status_valid CHECK (status IN ('draft')),
      ADD CONSTRAINT route_plans_distance_non_negative CHECK (distance_m IS NULL OR distance_m >= 0),
      ADD CONSTRAINT route_plans_duration_non_negative CHECK (duration_s IS NULL OR duration_s >= 0)
  `);

  await knex.schema.createTable('route_stops', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // Durak plana aittir; plan silinirse durakları da silinir.
    t.uuid('route_plan_id').notNullable().references('id').inTable('route_plans').onDelete('CASCADE');
    t.text('name').notNullable();
    t.decimal('latitude', 9, 6).notNullable();
    t.decimal('longitude', 9, 6).notNullable();
    t.integer('sequence').notNullable();
    t.unique(['route_plan_id', 'sequence']);
  });

  await knex.raw(`
    ALTER TABLE route_stops
      ADD CONSTRAINT route_stops_latitude_range CHECK (latitude BETWEEN -90 AND 90),
      ADD CONSTRAINT route_stops_longitude_range CHECK (longitude BETWEEN -180 AND 180),
      ADD CONSTRAINT route_stops_sequence_non_negative CHECK (sequence >= 0)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('route_stops');
  await knex.schema.dropTable('route_plans');
}
