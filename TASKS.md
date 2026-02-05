# 📋 Türkiye Hava Durumu Haritası - Görev Takip Listesi

**Proje:** Türkiye İklim Haritası  
**Başlangıç:** 5 Şubat 2026  
**Durum:** Planlama Aşaması

---

## 📊 Genel İlerleme

```
Toplam: 45 görev
✅ Tamamlanan: 0
🔄 Devam Eden: 0
⏳ Bekleyen: 45
```

---

## 🎯 Sprint 1: Proje Kurulumu & Altyapı (Tahmini: 2-3 gün)

### 1.1 Proje Başlangıç
- [ ] **T001** - Git repository oluşturma ve .gitignore konfigürasyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 15dk
  
- [ ] **T002** - README.md oluşturma (proje tanımı, kurulum, kullanım)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 30dk

### 1.2 Backend Kurulumu
- [ ] **T003** - Backend klasör yapısı oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 20dk
  - Detay: `backend/` ana klasörü, `app/`, `tests/` alt yapıları
  
- [ ] **T004** - Python sanal ortam kurulumu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 10dk
  - Komut: `python -m venv venv`
  
- [ ] **T005** - requirements.txt oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 15dk
  - Bağımlılıklar:
    ```
    fastapi==0.109.0
    uvicorn[standard]==0.27.0
    httpx==0.26.0
    pydantic==2.5.3
    python-dotenv==1.0.0
    redis==5.0.1
    ```

- [ ] **T006** - FastAPI başlangıç yapısı (main.py, config.py)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 45dk
  - Çıktı: Çalışan basit FastAPI uygulaması

- [ ] **T007** - CORS middleware konfigürasyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 15dk

### 1.3 Frontend Kurulumu
- [ ] **T008** - Vite + React + TypeScript projesi oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 20dk
  - Komut: `npm create vite@latest frontend -- --template react-ts`

- [ ] **T009** - Tailwind CSS kurulumu ve konfigürasyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 30dk
  - Dosyalar: `tailwind.config.js`, `postcss.config.js`

- [ ] **T010** - Frontend bağımlılıkları yükleme
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 25dk
  - Paketler:
    ```
    leaflet, @types/leaflet
    chart.js, react-chartjs-2
    axios
    zustand
    lucide-react
    date-fns
    ```

- [ ] **T011** - Frontend klasör yapısı oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 20dk
  - Klasörler: components/, services/, store/, types/, utils/, hooks/

- [ ] **T012** - ESLint & Prettier konfigürasyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 20dk

### 1.4 Veri Hazırlığı
- [ ] **T013** - Türkiye GeoJSON dosyası bulma/indirme
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 30dk
  - Kaynak: GADM, GitHub, data.gov.tr
  - Gereksinimler: 81 il, doğru sınırlar, properties (name, plate_code)

- [ ] **T014** - GeoJSON validasyon ve optimizasyon
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 45dk
  - Tool: geojson.io, mapshaper (simplify)

- [ ] **T015** - İl koordinatları JSON dosyası oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1 saat
  - Format: `{name, plate_code, lat, lon, elevation}`
  - 81 ilin merkez koordinatları

---

## 🎯 Sprint 2: Backend API Geliştirme (Tahmini: 3-4 gün)

### 2.1 Veri Modelleri
- [ ] **T016** - Pydantic modelleri oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1 saat
  - Dosyalar:
    - `models/province.py` - Province, ProvinceList
    - `models/weather.py` - WeatherData, WeatherRequest, WeatherResponse

### 2.2 External API Integration
- [ ] **T017** - Open-Meteo API client servisi
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2 saat
  - Dosya: `services/open_meteo.py`
  - Fonksiyonlar:
    - `get_current_weather(lat, lon)`
    - `get_historical_weather(lat, lon, start_date, end_date)`
    - `get_forecast(lat, lon, days)`

- [ ] **T018** - API error handling & retry logic
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1 saat
  - Timeout, retry (3x), fallback

- [ ] **T019** - Open-Meteo API test etme
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 30dk
  - pytest ile unit test

### 2.3 GeoData Servisi
- [ ] **T020** - GeoJSON okuma servisi
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1 saat
  - Dosya: `services/geo_service.py`
  - Fonksiyonlar:
    - `load_provinces()` - JSON'dan 81 ili yükle
    - `get_province_by_code(plate_code)`
    - `get_province_coordinates(plate_code)`

### 2.4 Cache Servisi (İsteğe Bağlı)
- [ ] **T021** - Redis cache servisi
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 1.5 saat
  - Dosya: `services/cache_service.py`
  - TTL: 1 saat (hava durumu verileri için)

### 2.5 API Endpoints
- [ ] **T022** - `/api/health` endpoint
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 20dk
  - Response: status, version, uptime

- [ ] **T023** - `/api/provinces` endpoint
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 45dk
  - Response: 81 ilin listesi (name, plate_code, coordinates)

- [ ] **T024** - `/api/weather` endpoint (ana endpoint)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2.5 saat
  - Query params: province, start_date, end_date, metrics
  - Business logic: coordinate lookup → Open-Meteo call → format response

- [ ] **T025** - `/api/weather/current` endpoint (tüm iller)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1.5 saat
  - Paralel API çağrıları (asyncio.gather)
  - Response: anlık hava durumu (81 il)

### 2.6 Backend Testing
- [ ] **T026** - API endpoint testleri (pytest)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 2 saat
  - Test coverage: > 80%

- [ ] **T027** - Postman/Thunder Client collection oluşturma
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 30dk

---

## 🎯 Sprint 3: Frontend - Harita Geliştirme (Tahmini: 3-4 gün)

### 3.1 Temel Yapı
- [ ] **T028** - TypeScript tiplerini tanımlama
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 45dk
  - Dosyalar:
    - `types/province.ts`
    - `types/weather.ts`
    - `types/api.ts`

- [ ] **T029** - Axios API client servisi
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1 saat
  - Dosya: `services/weatherApi.ts`
  - Fonksiyonlar: getProvinces(), getWeather(), getCurrentWeather()

- [ ] **T030** - Zustand state management setup
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1 saat
  - Dosyalar:
    - `store/useWeatherStore.ts` - seçili il, tarih, veri
    - `store/useUIStore.ts` - dark mode, loading, errors

### 3.2 Leaflet Harita
- [ ] **T031** - Leaflet harita component (TurkeyMap.tsx)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2 saat
  - Özellikler:
    - Türkiye merkezli (lat: 39, lon: 35, zoom: 6)
    - Responsive container
    - Base map layer (OpenStreetMap veya CartoDB)

- [ ] **T032** - GeoJSON il sınırları render etme
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2.5 saat
  - Component: `ProvinceLayer.tsx`
  - Özellikler:
    - Her il ayrı polygon
    - Renk kodlama (sıcaklık bazlı)
    - Stroke (sınır çizgileri)

- [ ] **T033** - Harita hover interaksiyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1.5 saat
  - Özellikler:
    - mouseover: sınır kalınlaştır, renk değiştir
    - Tooltip göster (il adı, sıcaklık)
    - mouseout: eski haline dön

- [ ] **T034** - Harita click (il seçimi) interaksiyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1 saat
  - Akış:
    - Click → state'e kaydet (selectedProvince)
    - İli vurgula (farklı renk/border)
    - API'den detaylı veri çek

- [ ] **T035** - Sıcaklık bazlı renk fonksiyonu
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 45dk
  - Dosya: `utils/colors.ts`
  - Fonksiyon: `getTemperatureColor(temp: number): string`

- [ ] **T036** - Harita legend (renk skalası)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 1 saat
  - Component: `MapLegend.tsx`
  - Pozisyon: sağ üst köşe

---

## 🎯 Sprint 4: Frontend - Tarih & Veri Paneli (Tahmini: 3-4 gün)

### 4.1 Tarih Seçici
- [ ] **T037** - DatePicker component
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2 saat
  - Dosya: `components/Calendar/DatePicker.tsx`
  - Kütüphane: Native HTML5 input veya react-datepicker
  - Min/Max: 1940 - bugün

- [ ] **T038** - DateRangePicker component
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2.5 saat
  - Başlangıç - bitiş tarih seçimi
  - Validasyon (bitiş > başlangıç)

- [ ] **T039** - Saatlik/Günlük toggle
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 45dk
  - Component: `TimeSelector.tsx`
  - State management ile entegrasyon

### 4.2 Hava Durumu Paneli
- [ ] **T040** - WeatherPanel ana layout
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1.5 saat
  - Dosya: `components/Weather/WeatherPanel.tsx`
  - Slide-up animasyon (seçim yapılınca)

- [ ] **T041** - WeatherCard (özet metrikler)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2 saat
  - Dosya: `components/Weather/WeatherCard.tsx`
  - Grid layout: Sıcaklık, Yağış, Rüzgar, Nem

- [ ] **T042** - WeatherCharts (grafikler)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 3 saat
  - Dosya: `components/Weather/WeatherCharts.tsx`
  - Chart.js integration:
    - Line chart (sıcaklık)
    - Bar chart (yağış)
    - Line chart (rüzgar)
    - Area chart (nem)

- [ ] **T043** - Loading & Error states
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1 saat
  - Components:
    - `UI/Loading.tsx` - Spinner/Skeleton
    - `UI/ErrorMessage.tsx` - Hata mesajları

### 4.3 UI Components
- [ ] **T044** - Header component
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1.5 saat
  - Logo, başlık, dark mode toggle, bilgi

- [ ] **T045** - ThemeToggle (dark/light mode)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1.5 saat
  - localStorage ile kalıcılık
  - CSS variables ile tema değişimi

- [ ] **T046** - Responsive tasarım (mobil)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 2.5 saat
  - Breakpoints: 640px, 1024px
  - Stack layout (mobilde dikey)

---

## 🎯 Sprint 5: Test, Optimizasyon, Deployment (Tahmini: 2-3 gün)

### 5.1 Testing
- [ ] **T047** - Frontend unit testleri (Vitest)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 2 saat

- [ ] **T048** - E2E testler (Playwright - opsiyonel)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 3 saat

### 5.2 Optimizasyon
- [ ] **T049** - Code splitting (React.lazy)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 1 saat

- [ ] **T050** - Bundle size analizi ve optimizasyon
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 1.5 saat

- [ ] **T051** - Lighthouse performans testi
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 1 saat
  - Hedef: > 90 performance score

### 5.3 Deployment
- [ ] **T052** - Backend deployment (Railway/Render)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 2 saat
  - Environment variables ayarları

- [ ] **T053** - Frontend deployment (Vercel/Netlify)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🔴 Yüksek
  - Süre: 1.5 saat
  - Environment variables (API URL)

- [ ] **T054** - Domain bağlama (opsiyonel)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟢 Düşük
  - Süre: 1 saat

- [ ] **T055** - README güncelleme (demo link, screenshots)
  - Durum: ⏳ Bekliyor
  - Öncelik: 🟡 Orta
  - Süre: 45dk

---

## 📝 Notlar & Tips

### Önemli Bağımlılıklar
```
T003 → T004 → T005 → T006
T008 → T009 → T010 → T011
T013 → T014 → T015
T016 → T017 → T024
T028 → T029 → T031
```

### Paralel Yapılabilecek Görevler
- Backend (T003-T027) ve Frontend (T028-T046) aynı anda geliştirilebilir
- T013-T015 (veri hazırlığı) erken başlatılmalı
- T021 (Redis) opsiyonel, sonradan eklenebilir

### Zaman Tasarrufu İçin
1. **Önce MVP:** T001-T015, T016-T025, T028-T034, T037-T042
2. **Sonra polish:** T036, T044-T046, T049-T051
3. **En son:** T048 (E2E), T054 (Domain)

### Dış Bağımlılıklar
- Open-Meteo API'nin çalışır durumda olması (T017'den önce test et)
- GeoJSON dosyasının bulunması (T013, kritik)

---

## 🎨 Görev Durumları

| Sembol | Durum | Açıklama |
|--------|-------|----------|
| ⏳ | Bekliyor | Henüz başlanmadı |
| 🔄 | Devam Ediyor | Aktif olarak çalışılıyor |
| ✅ | Tamamlandı | Başarıyla bitti |
| ⚠️ | Bloklı | Başka göreve bağımlı |
| ❌ | İptal | Yapılmayacak |

## 🎯 Öncelik Seviyeleri

| Sembol | Seviye | Açıklama |
|--------|--------|----------|
| 🔴 | Yüksek | Kritik, hemen yapılmalı |
| 🟡 | Orta | Önemli ama bekleyebilir |
| 🟢 | Düşük | Nice-to-have, opsiyonel |

---

## 📊 Sprint Özeti

| Sprint | Görev Sayısı | Tahmini Süre | Odak |
|--------|--------------|--------------|------|
| Sprint 1 | 15 görev | 2-3 gün | Altyapı kurulumu |
| Sprint 2 | 12 görev | 3-4 gün | Backend API |
| Sprint 3 | 9 görev | 3-4 gün | Harita geliştirme |
| Sprint 4 | 10 görev | 3-4 gün | UI & Veri paneli |
| Sprint 5 | 9 görev | 2-3 gün | Test & Deploy |
| **TOPLAM** | **55 görev** | **13-18 gün** | **Full Stack** |

---

## 🚀 Hızlı Başlangıç Checklist

Projeye yeni başlıyorsanız, bu sırayla ilerleyin:

1. ✅ SPEC.md'yi okuyun
2. ✅ Git repo oluşturun (T001)
3. ✅ Backend kurulumunu yapın (T003-T006)
4. ✅ Frontend kurulumunu yapın (T008-T011)
5. ✅ Türkiye GeoJSON'ını bulun (T013)
6. ✅ İlk API endpoint'i yazın (T022-T023)
7. ✅ İlk haritayı render edin (T031-T032)
8. 🎉 MVP tamamlandı!

---

**Güncellenme:** Her görev tamamlandığında bu dosya güncellenecek  
**Tracker:** GitHub Issues / Trello / Notion kullanılabilir
