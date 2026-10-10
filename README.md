# Yerlem — Filo ve Rotalama

Araçların tek bir ortak filo kaynağından yönetildiği, aynı araçlarla duraklı rota planlarının
hazırlandığı web uygulaması. 360 px telefon ekranından masaüstüne kadar kullanılabilir.

**Teknolojiler:** React · Material UI · Zustand · Node.js (Express + TypeScript) · PostgreSQL (Knex) · Docker

---

## 📍 Geliştirme Durumu

> Proje geliştirilmeye devam ediyor. Bu bölüm, ara kontrol için mevcut durumu gösterir.

| Bölüm | Durum |
|---|---|
| Analiz, veri modeli, ekran akışı ([docs/analiz.md](docs/analiz.md)) | ✅ Tamamlandı |
| Docker ile tek komutla kurulum, migration ve seed | ✅ Tamamlandı |
| Filo API'si (listeleme, arama, ekleme, düzenleme, aktif/pasif) | ✅ Tamamlandı |
| Filo ekranları (liste, form, detay; mobil kart görünümü) | ✅ Tamamlandı |
| Backend iş kuralı testleri (plaka normalizasyonu, doğrulama) | ✅ Tamamlandı |
| Rota planı API'si ve OSRM entegrasyonu | ✅ Tamamlandı |
| Rota ekranları (liste, oluşturma/düzenleme, harita) | ✅ Tamamlandı |
| Entegrasyon testleri ve frontend kullanıcı akışı testi | ⏳ Planlandı |
| OpenAPI (Swagger) dokümanı | ⏳ Planlandı |

---

## 🚀 Kurulum ve Çalıştırma

Tek gereksinim **Docker** (Docker Desktop veya Docker Engine + Compose v2).

```bash
git clone <repo-adresi>
cd yerlem-filo-rotalama
docker compose up --build
```

İlk açılışta veritabanı tabloları otomatik oluşturulur ve örnek veri eklenir. Ek bir kurulum
veya `.env` dosyası gerekmez.

| Adres | Açıklama |
|---|---|
| http://localhost:8080 | Uygulama |
| http://localhost:8080/api/health | Servis ve veritabanı durumu |
| http://localhost:3000/api | Backend (doğrudan erişim) |

**Örnek veri:** 5 araç (biri pasif) ve 2 rota planı. Planlardan biri bilerek pasif araca bağlıdır;
pasif aracın geçmiş planda görünmeye devam ettiği bu sayede hemen görülebilir.

```bash
docker compose down        # durdur
docker compose down -v     # durdur ve veritabanını sıfırla (seed tekrar çalışır)
```

Portları veya veritabanı bilgilerini değiştirmek için `.env.example` dosyasını `.env` olarak kopyalayıp düzenleyin.

---

## 🌐 Kullanılan Dış Servisler

Hiçbiri API anahtarı gerektirmez; adresleri ortam değişkenleriyle değiştirilebilir.

| Servis | Kullanım | Ortam değişkeni |
|---|---|---|
| OpenStreetMap karoları | Harita görüntüsü (Leaflet) | — |
| OSRM | Rota mesafesi, süresi ve çizgisi | `OSRM_URL` |
| Nominatim | Adresten konum bulma | `NOMINATIM_URL` |

Rota ve adres servislerine tarayıcıdan değil backend'den gidilir: zaman aşımı ve hata dönüşümü
tek yerde yönetilir, ileride anahtarlı bir servise geçilirse anahtar tarayıcıya sızmaz.

## 🧱 Mimari

```
Tarayıcı ──> frontend (nginx :8080) ──/api──> backend (Express :3000) ──> PostgreSQL
```

- **Tek kaynak:** Araçlar yalnızca `vehicles` tablosunda tutulur. Rota planları araç bilgisini
  kopyalamaz, `vehicle_id` ile ilişki kurar. Filo ve rotalama ekranları aynı API'den ve
  istemcide aynı Zustand store'undan okur.
- **Backend katmanları:** `routes` (HTTP + doğrulama) → `service` (iş kuralları) → `repository` (SQL).
  Tüm hatalar tek biçimde döner: `{ "error": { "code", "message", "details" } }`.
- **Frontend:** Özellik tabanlı klasörler (`features/fleet`, `features/routing`). HTTP çağrıları
  yalnızca `src/api/` katmanında yapılır; ekranlar ağ ayrıntısını bilmez.

Ayrıntılı veri modeli, iş kuralları ve kararların gerekçeleri: **[docs/analiz.md](docs/analiz.md)**

### Klasör yapısı

```
backend/src/
├── db/            migration, seed, bağlantı
├── modules/       özellik bazlı modüller (vehicles, health)
│   └── vehicles/  *.routes.ts · *.service.ts · *.repository.ts · *.schema.ts
├── middleware/    ortak hata yönetimi
└── lib/
frontend/src/
├── api/           HTTP istemcisi ve uç fonksiyonları
├── app/           tema, yönlendirme, ana yerleşim
├── features/
│   ├── fleet/     store · hooks · components · pages
│   └── routing/
└── shared/        ortak bileşenler (durum görünümleri, sayfa başlığı, bildirim)
```

### Zustand store sınırları

| Store | Sorumluluk |
|---|---|
| `useVehicleStore` | Sunucudan gelen araç listesi (filonun istemcideki tek kopyası) |
| `useNotificationStore` | Kısa arayüz bildirimleri |
| `useRoutePlanStore` | Kayıtlı rota planlarının özet listesi |
| `useRouteEditorStore` | Düzenlenen, henüz kaydedilmemiş plan: duraklar, seçili `vehicleId`, hesaplanan rota |

Liste filtreleri store yerine adres çubuğunda (`?q=&status=`) tutulur; form değerleri ilgili bileşende kalır.

---

## 🔌 API

| Metot | Uç | Açıklama | Başarılı | Hatalar |
|---|---|---|---|---|
| GET | `/api/health` | Servis durumu | 200 | 503 |
| GET | `/api/vehicles?search=&status=all\|active\|inactive` | Araç listesi | 200 | 400 |
| GET | `/api/vehicles/:id` | Araç detayı | 200 | 400, 404 |
| POST | `/api/vehicles` | Araç ekleme | 201 | 400, 409 |
| PATCH | `/api/vehicles/:id` | Düzenleme / aktif-pasif | 200 | 400, 404, 409 |
| GET | `/api/route-plans?vehicleId=` | Plan listesi (durak sayısı, aracın güncel bilgisi) | 200 | 400 |
| GET | `/api/route-plans/:id` | Plan + sıralı duraklar + rota çizgisi | 200 | 400, 404 |
| POST | `/api/route-plans` | Taslak plan oluşturma | 201 (tekrar isteğinde 200) | 400, 409 |
| PUT | `/api/route-plans/:id` | Taslak planı güncelleme | 200 | 400, 404, 409 |
| POST | `/api/routing/calculate` | OSRM ile rota hesabı (kaydetmez) | 200 | 400, 422, 502, 504 |
| GET | `/api/geocoding/search?q=` | Adresten konum arama (Nominatim) | 200 | 400, 502, 503, 504 |

Araçlar için silme ucu bilerek yoktur; geçmiş planları korumak için araçlar pasif yapılır.

<details>
<summary>Örnek istek ve hata cevabı</summary>

```bash
curl -X POST http://localhost:8080/api/vehicles \
  -H 'Content-Type: application/json' \
  -d '{"plate":" 34 abc 123 ","name":"SRV-01","type":"bus","capacity":50}'
```

```json
{ "error": { "code": "PLATE_TAKEN", "message": "Bu plaka zaten kayıtlı.", "details": { "field": "plate" } } }
```

</details>

---

## 🛠️ Yerel Geliştirme

Docker dışında geliştirmek için Node.js 22+ gerekir.

```bash
# Veritabanı (Docker ile)
docker compose up -d db

# Backend
cd backend
npm install
npm run db:migrate    # migration + seed
npm run dev           # http://localhost:3000

# Frontend (ayrı terminalde)
cd frontend
npm install
npm run dev           # http://localhost:5173 (/api istekleri backend'e yönlendirilir)
```

| Komut | backend | frontend |
|---|---|---|
| Lint | `npm run lint` | `npm run lint` |
| Tip kontrolü | `npm run typecheck` | `npm run typecheck` |
| Test | `npm test` | `npm test` |

---

## 📌 Varsayımlar

- Tek bir operasyon ekibi kullanır; kimlik doğrulama ve rol ayrımı kapsam dışıdır.
- Plakalar Türkiye biçimindedir (il kodu 01–81 + 1–3 harf + 2–4 rakam) ve boşluksuz, büyük harfle
  saklanır. `34 abc 123`, `34ABC123` ve ` 34 Abc 123 ` aynı plaka sayılır.
- Araç kapasitesi 1–100 yolcu aralığındadır.
- Filo yüzlerce araç mertebesindedir; araç listesi bir kez çekilip istemcide filtrelenir.
  Daha büyük filolar için backend'deki `search` ve `status` parametreleri hazırdır.

## 🗺️ Rota Planlama Davranışı

- **Konum belirleme:** Kullanıcının koordinat bilmesi beklenmez. Her durak için **adres aranabilir**
  (seçilen sonuç adı ve koordinatı doldurur), **haritaya dokunulabilir** ya da enlem/boylam elle girilebilir.
- **Durak sırası:** Listenin ilki başlangıç, sonuncusu bitiştir. Sıralama yukarı/aşağı butonlarıyla
  yapılır (klavye ve dokunmatikte güvenilir). Kayıtta duraklar 0..n olarak yeniden numaralanır.
- **Rota hesabı ve kayıt ayrıdır:** "Rotayı hesapla" OSRM'den mesafe, süre ve çizgiyi alır;
  "Kaydet" planı bu sonuçla birlikte saklar. Rota servisi çalışmasa da plan rotasız taslak olarak
  kaydedilebilir. Duraklar değişince eski rota otomatik silinir, böylece yanlış rota kaydedilmez.
- **Pasif araç:** Yeni planda seçilemez. Ekran açıkken araç başka yerde pasif yapılırsa kayıt `409`
  ile reddedilir (kontrol, transaction içinde araç satırı `FOR SHARE` ile kilitlenerek yapılır);
  girilen duraklar kaybolmaz.
- **Geçmiş kayıtların sunumu:** Plan aracı kopyalamaz; liste ve detayda aracın **güncel** bilgisi
  ilişkiden okunur. Araç pasif yapılırsa planlar silinmez, "Araç pasif" etiketiyle görünmeye devam
  eder ve araç detay sayfasında listelenir.
- **Çift kayıt:** Kaydet butonu istek sürerken kilitlenir; ayrıca her yeni plan ekranı bir
  `clientRequestId` üretir ve aynı istek tekrar gelirse sunucu yeni kayıt açmaz.
- **Rota servisi hataları:** Zaman aşımı (504), ulaşılamama/bozuk cevap (502), rota bulunamaması veya
  durağın karayoluna çok uzak olması (422) ayrı mesajlarla gösterilir.

## ⚠️ Bilinen Eksikler

- Rota servisi olarak OSRM'in herkese açık **demo sunucusu** kullanılır; yoğunlukta yavaşlayabilir
  ve kullanım sınırı vardır. Üretimde kendi OSRM sunucusu kurulup `OSRM_URL` ile gösterilmelidir.
- Kaydedilen mesafe/süre istemcinin hesapladığı rotadan gelir; backend kayıtta rotayı yeniden
  hesaplayıp doğrulamaz (kaydın rota servisine bağımlı olmaması için).
- Aynı aracı veya planı iki kişi aynı anda düzenlerse son kaydeden kazanır (optimistic locking yok).
- Rota planları silinemez; yalnızca düzenlenebilir.
- Adres arama için OpenStreetMap **Nominatim**'in herkese açık sunucusu kullanılır. Kullanım
  politikası gereği arama yazarken otomatik yapılmaz ("Ara" / Enter ile yapılır), backend istekleri
  saniyede en fazla 1 olacak şekilde sıraya alır ve sonuçları 1 saat önbellekte tutar. Arama Türkiye
  ile sınırlıdır (`GEOCODING_COUNTRY_CODES`).

---

## 🤖 Kullanılan Araçlar ve Yardım Alınan Kısımlar

Geliştirme sürecinde yapay zekâ araçları (**Claude, ChatGPT, Gemini**) yardımcı kaynak olarak
kullanıldı: proje iskeletinin kurulması, kod yazımı, hata ayıklama ve teknik kavramların
araştırılması. Mimari kararlar, veri modeli, uç durumların ele alınışı ve testler incelenip
anlaşılarak projeye dahil edildi; kodun tamamını açıklayabilir ve değiştirebilirim.

Diğer kaynaklar: React, MUI, Zustand, Express, Knex, Zod ve PostgreSQL resmi dokümantasyonları.
