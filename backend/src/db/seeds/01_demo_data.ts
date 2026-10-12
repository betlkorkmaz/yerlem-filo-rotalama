import type { Knex } from 'knex';

// OSRM'den alınmış sadeleştirilmiş rota çizgisi ([boylam, enlem]); seed'in internete bağımlı olmaması için sabit.
const KADIKOY_LEVENT_ROUTE: [number, number][] = [
  [29.02331,40.99085],
  [29.02475,40.99228],
  [29.02465,40.996],
  [29.02954,40.99862],
  [29.02984,41.00022],
  [29.02027,41.01266],
  [29.02374,41.01346],
  [29.02575,41.01627],
  [29.01741,41.02074],
  [29.01499,41.02671],
  [29.01545,41.02569],
  [29.01514,41.02684],
  [29.01811,41.02967],
  [29.03414,41.03934],
  [29.03869,41.0392],
  [29.04102,41.04051],
  [29.04395,41.03782],
  [29.04318,41.0374],
  [29.041,41.03926],
  [29.02626,41.05329],
  [29.01702,41.05908],
  [29.01407,41.06771],
  [29.0147,41.06855],
  [29.01786,41.06807],
  [29.0143,41.06883],
  [29.0128,41.06734],
  [29.01147,41.06907],
  [29.01524,41.07001],
  [29.0161,41.0727],
  [29.01019,41.08335],
  [29.01385,41.07715],
  [29.01182,41.07697],
];

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

    // İlk plan, rota servisi (OSRM) ile önceden hesaplanmış rotasıyla gelir: uygulama açılır açılmaz
    // haritada çizili bir rota görülür. İkinci plan bilerek rotasızdır: rota servisi çalışmasa da
    // taslağın kaydedilebildiğini ve aracı pasif olan geçmiş planın nasıl göründüğünü gösterir.
    const [morning, evening] = await trx('route_plans')
      .insert([
        {
          name: 'Kadıköy – Levent Sabah Servisi',
          vehicle_id: idOf('34ABC123'),
          status: 'draft',
          distance_m: 17334,
          duration_s: 1284,
          geometry: JSON.stringify({ type: 'LineString', coordinates: KADIKOY_LEVENT_ROUTE }),
        },
        { name: 'Beşiktaş – Ataşehir Akşam Servisi', vehicle_id: idOf('16NPR345'), status: 'draft' },
      ])
      .returning(['id']);

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
