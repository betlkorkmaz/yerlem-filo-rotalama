// OpenAPI 3.1 sözleşmesi. /api/docs adresinde Swagger arayüzüyle, /api/openapi.json adresinde ham
// olarak sunulur. Kod ile aynı depoda tutulur ki uç değişince doküman da aynı commit'te güncellensin.

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const error = (description: string) => ({ description, content: json(ref('Error')) });
const uuidParam = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Yerlem Filo ve Rotalama API',
    version: '1.0.0',
    description:
      'Araçlar tek bir filo kaynağında tutulur; rota planları araç bilgisini kopyalamaz, `vehicleId` ile ilişki kurar. ' +
      'Tüm hatalar aynı biçimde döner: `{ "error": { "code", "message", "details" } }`.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Araçlar', description: 'Ortak filo kaynağı' },
    { name: 'Rota planları', description: 'Taslak rota planları ve durakları' },
    { name: 'Rota servisi', description: 'Dış servisler (OSRM, Nominatim) üzerinden hesaplama ve arama' },
    { name: 'Sistem' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Sistem'],
        summary: 'Servis ve veritabanı durumu',
        responses: {
          200: { description: 'Çalışıyor', content: json({ type: 'object', example: { status: 'ok', database: 'up' } }) },
          503: { description: 'Veritabanına ulaşılamıyor' },
        },
      },
    },
    '/api/vehicles': {
      get: {
        tags: ['Araçlar'],
        summary: 'Araç listesi',
        parameters: [
          { name: 'search', in: 'query', description: 'Plaka veya ad içinde arama (plaka normalize edilerek aranır)', schema: { type: 'string', maxLength: 50 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'active', 'inactive'], default: 'all' } },
        ],
        responses: {
          200: { description: 'Araçlar (en yeni önce)', content: json({ type: 'array', items: ref('Vehicle') }) },
          400: error('Geçersiz sorgu parametresi'),
        },
      },
      post: {
        tags: ['Araçlar'],
        summary: 'Araç ekleme',
        description: 'Plaka normalize edilir (" 34 abc 123 " → "34ABC123") ve bu değer üzerinden benzersizdir.',
        requestBody: { required: true, content: json(ref('VehicleInput')) },
        responses: {
          201: { description: 'Oluşturuldu', content: json(ref('Vehicle')) },
          400: error('Doğrulama hatası (alan bazlı `details`)'),
          409: error('PLATE_TAKEN: plaka zaten kayıtlı'),
        },
      },
    },
    '/api/vehicles/{id}': {
      parameters: [uuidParam('id', 'Araç kimliği')],
      get: {
        tags: ['Araçlar'],
        summary: 'Araç detayı',
        responses: { 200: { description: 'Araç', content: json(ref('Vehicle')) }, 400: error('Geçersiz kimlik'), 404: error('VEHICLE_NOT_FOUND') },
      },
      patch: {
        tags: ['Araçlar'],
        summary: 'Araç düzenleme / aktif-pasif yapma',
        description:
          'Yalnızca gönderilen alanlar değişir. Fiziksel silme ucu bilerek yoktur: araç geçmiş planlarda kullanıldığı için pasif yapılır.',
        requestBody: { required: true, content: json({ ...ref('VehicleInput'), description: 'Alanların hepsi isteğe bağlı, en az biri gerekli' }) },
        responses: {
          200: { description: 'Güncellendi', content: json(ref('Vehicle')) },
          400: error('Doğrulama hatası veya boş güncelleme'),
          404: error('VEHICLE_NOT_FOUND'),
          409: error('PLATE_TAKEN'),
        },
      },
    },
    '/api/route-plans': {
      get: {
        tags: ['Rota planları'],
        summary: 'Plan listesi',
        description: 'Araç bilgisi plandan değil ilişkiden (JOIN) gelir; araç pasif yapılsa da plan listede kalır.',
        parameters: [{ name: 'vehicleId', in: 'query', description: 'Belirli bir aracın planları', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Planlar (son güncellenen önce)', content: json({ type: 'array', items: ref('RoutePlanSummary') }) } },
      },
      post: {
        tags: ['Rota planları'],
        summary: 'Taslak plan oluşturma',
        description:
          'Araç kayıt anında yeniden kontrol edilir (transaction içinde satır kilidiyle). `clientRequestId` ile aynı istek tekrar gelirse yeni plan açılmaz, mevcut plan 200 ile döner.',
        requestBody: {
          required: true,
          content: json({
            allOf: [ref('RoutePlanInput'), { type: 'object', properties: { clientRequestId: { type: 'string', format: 'uuid' } } }],
          }),
        },
        responses: {
          201: { description: 'Oluşturuldu', content: json(ref('RoutePlanDetail')) },
          200: { description: 'Aynı clientRequestId ile daha önce oluşturulmuş plan', content: json(ref('RoutePlanDetail')) },
          400: error('Doğrulama hatası veya VEHICLE_NOT_FOUND'),
          409: error('VEHICLE_INACTIVE: seçilen araç pasif'),
        },
      },
    },
    '/api/route-plans/{id}': {
      parameters: [uuidParam('id', 'Plan kimliği')],
      get: {
        tags: ['Rota planları'],
        summary: 'Plan detayı (sıralı duraklar ve rota çizgisi)',
        responses: { 200: { description: 'Plan', content: json(ref('RoutePlanDetail')) }, 404: error('ROUTE_PLAN_NOT_FOUND') },
      },
      put: {
        tags: ['Rota planları'],
        summary: 'Taslak planı güncelleme',
        description: 'Duraklar listedeki sırayla 0..n olarak yeniden yazılır; silme/sıralama sonrası sequence boşluksuz kalır.',
        requestBody: { required: true, content: json(ref('RoutePlanInput')) },
        responses: {
          200: { description: 'Güncellendi', content: json(ref('RoutePlanDetail')) },
          400: error('Doğrulama hatası'),
          404: error('ROUTE_PLAN_NOT_FOUND'),
          409: error('VEHICLE_INACTIVE'),
        },
      },
    },
    '/api/routing/calculate': {
      post: {
        tags: ['Rota servisi'],
        summary: 'Rota hesaplama (OSRM) — kaydetmez',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['stops'],
            properties: {
              stops: { type: 'array', minItems: 2, maxItems: 25, items: { type: 'object', required: ['latitude', 'longitude'], properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } } },
            },
          }),
        },
        responses: {
          200: { description: 'Hesaplanan rota', content: json(ref('RouteResult')) },
          400: error('Doğrulama hatası'),
          422: error('ROUTE_NOT_FOUND veya STOP_OFF_ROAD (details.stopIndex)'),
          502: error('ROUTING_UNAVAILABLE / ROUTING_BAD_RESPONSE'),
          504: error('ROUTING_TIMEOUT'),
        },
      },
    },
    '/api/geocoding/search': {
      get: {
        tags: ['Rota servisi'],
        summary: 'Adresten konum arama (Nominatim)',
        description: 'Saniyede en fazla 1 istek gönderilir, sonuçlar 1 saat önbellekte tutulur. Sonuç yoksa boş liste döner.',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 3, maxLength: 100 }, example: 'Kadıköy İskele' }],
        responses: {
          200: { description: 'En fazla 5 sonuç', content: json({ type: 'array', items: ref('Place') }) },
          400: error('Arama metni geçersiz'),
          502: error('GEOCODING_UNAVAILABLE / GEOCODING_BAD_RESPONSE'),
          503: error('GEOCODING_BUSY'),
          504: error('GEOCODING_TIMEOUT'),
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'PLATE_TAKEN' },
              message: { type: 'string', example: 'Bu plaka zaten kayıtlı.' },
              details: { description: 'Doğrulamada [{ field, message }], iş kuralında { field } gibi ek bilgi' },
            },
          },
        },
      },
      VehicleInput: {
        type: 'object',
        required: ['plate', 'name', 'type', 'capacity'],
        properties: {
          plate: { type: 'string', example: '34 ABC 123', description: 'İl kodu (01–81) + 1–3 harf + 2–4 rakam' },
          name: { type: 'string', maxLength: 50, example: 'SRV-01' },
          type: { type: 'string', enum: ['bus', 'midibus', 'minibus', 'van'] },
          capacity: { type: 'integer', minimum: 1, maximum: 100, example: 50 },
          isActive: { type: 'boolean', default: true },
        },
      },
      Vehicle: {
        allOf: [
          ref('VehicleInput'),
          {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              plate: { type: 'string', example: '34ABC123', description: 'Normalize edilmiş' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Stop: {
        type: 'object',
        required: ['name', 'latitude', 'longitude'],
        properties: {
          name: { type: 'string', maxLength: 100, example: 'Kadıköy İskele' },
          latitude: { type: 'number', minimum: -90, maximum: 90, example: 40.9907 },
          longitude: { type: 'number', minimum: -180, maximum: 180, example: 29.0236 },
        },
      },
      Geometry: {
        type: 'object',
        description: 'GeoJSON LineString; koordinat sırası [boylam, enlem]',
        properties: { type: { const: 'LineString' }, coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } } } },
      },
      RouteResult: {
        type: 'object',
        properties: { distanceM: { type: 'integer' }, durationS: { type: 'integer' }, geometry: ref('Geometry') },
      },
      RoutePlanInput: {
        type: 'object',
        required: ['name', 'vehicleId', 'stops'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          vehicleId: { type: 'string', format: 'uuid' },
          stops: {
            type: 'array',
            minItems: 2,
            maxItems: 25,
            description: 'İlk durak başlangıç, son durak bitiş; aradakiler isteğe bağlı ara duraklar. Sıra = dizideki sıra.',
            items: ref('Stop'),
          },
          distanceM: { type: ['integer', 'null'], description: 'Rota hesaplanmadıysa null' },
          durationS: { type: ['integer', 'null'] },
          geometry: { oneOf: [ref('Geometry'), { type: 'null' }] },
        },
      },
      PlanVehicle: {
        type: 'object',
        description: 'Aracın güncel bilgisi (ilişkiden okunur, plana kopyalanmaz)',
        properties: {
          id: { type: 'string', format: 'uuid' },
          plate: { type: 'string' },
          name: { type: 'string' },
          capacity: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
      RoutePlanSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['draft'] },
          distanceM: { type: ['integer', 'null'] },
          durationS: { type: ['integer', 'null'] },
          stopCount: { type: 'integer' },
          vehicle: ref('PlanVehicle'),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RoutePlanDetail: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['draft'] },
          distanceM: { type: ['integer', 'null'] },
          durationS: { type: ['integer', 'null'] },
          geometry: { oneOf: [ref('Geometry'), { type: 'null' }] },
          vehicle: ref('PlanVehicle'),
          stops: {
            type: 'array',
            items: { allOf: [ref('Stop'), { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, sequence: { type: 'integer', minimum: 0 } } }] },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Place: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'İskele (Kadıköy)' },
          displayName: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
      },
    },
  },
};
