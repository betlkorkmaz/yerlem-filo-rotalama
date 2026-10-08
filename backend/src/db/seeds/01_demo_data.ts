import type { Knex } from 'knex';

// Seed her konteyner açılışında çalışır. Kullanıcının eklediği veriyi silmemek için
// sadece veritabanı boşken örnek veri eklenir.
export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex('vehicles').count<{ count: string }[]>('* as count');
  if (Number(count) > 0) return;

  await knex.transaction(async (trx) => {
    const vehicles = await trx('vehicles')
      .insert([
        { plate: '34ABC123', name: 'SRV-01', type: 'bus', capacity: 50, is_active: true },
        { plate: '34DEF456', name: 'SRV-02', type: 'midibus', capacity: 30, is_active: true },
        { plate: '06GHJ789', name: 'SRV-03', type: 'minibus', capacity: 16, is_active: true },
        { plate: '35KLM012', name: 'SRV-04', type: 'van', capacity: 8, is_active: true },
        // Pasif araç: geçmiş planda görünmeye devam ettiğini göstermek için bir plana bağlı.
        { plate: '16NPR345', name: 'SRV-05', type: 'bus', capacity: 46, is_active: false },
      ])
      .returning(['id', 'plate']);

    const idOf = (plate: string) => vehicles.find((v) => v.plate === plate)!.id;

    const [morning, evening] = await trx('route_plans')
      .insert([
        { name: 'Kadıköy – Levent Sabah Servisi', vehicle_id: idOf('34ABC123'), status: 'draft' },
        { name: 'Beşiktaş – Ataşehir Akşam Servisi', vehicle_id: idOf('16NPR345'), status: 'draft' },
      ])
      .returning(['id']);

    // Mesafe/süre seed'de boş bırakılır; plan açılıp "Rotayı hesapla" denildiğinde OSRM'den gelir.
    await trx('route_stops').insert([
      { route_plan_id: morning.id, name: 'Kadıköy İskele', latitude: 40.990700, longitude: 29.023600, sequence: 0 },
      { route_plan_id: morning.id, name: 'Üsküdar Meydan', latitude: 41.025800, longitude: 29.015000, sequence: 1 },
      { route_plan_id: morning.id, name: 'Zincirlikuyu', latitude: 41.067300, longitude: 29.012800, sequence: 2 },
      { route_plan_id: morning.id, name: 'Levent Metro', latitude: 41.077100, longitude: 29.011800, sequence: 3 },

      { route_plan_id: evening.id, name: 'Beşiktaş Meydan', latitude: 41.042700, longitude: 29.007500, sequence: 0 },
      { route_plan_id: evening.id, name: 'Altunizade', latitude: 41.022600, longitude: 29.044900, sequence: 1 },
      { route_plan_id: evening.id, name: 'Ataşehir Bulvar', latitude: 40.992300, longitude: 29.124900, sequence: 2 },
    ]);
  });
}
