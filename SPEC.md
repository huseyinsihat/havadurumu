# 🌦️ Türkiye Hava Durumu Haritası - Teknik Spesifikasyon

## 📋 Proje Özeti

**Proje Adı:** Türkiye Hava Durumu Haritası (Turkey Weather Map)  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 5 Şubat 2026  
**Amaç:** Türkiye'nin 81 ili için interaktif, tarih seçilebilir, görsel hava durumu haritası ve detaylı meteorolojik veri analizi platformu

---

## 🎯 Ana Özellikler

### 1. İnteraktif Türkiye Haritası
- 81 ilin coğrafi sınırları ile görselleştirme
- Hover (üzerine gelme) ile anlık bilgi
- Click (tıklama) ile il seçimi ve detay paneli
- Renk kodlu hava durumu gösterimi
- Responsive (mobil uyumlu) tasarım

### 2. Tarih Seçici (Takvim)
- Tarih aralığı seçimi (başlangıç - bitiş)
- Saatlik / günlük veri görünümü
- Geçmiş veri erişimi (1940'tan günümüze)
- Anlık hava durumu
- Gelecek 7 gün tahmini

### 3. Veri Görselleştirme
- Sıcaklık grafikleri (°C)
- Yağış miktarı (mm)
- Rüzgar hızı ve yönü (km/h)
- Nem oranı (%)
- Basınç (hPa)
- Görüş mesafesi (km)

### 4. Modern Arayüz
- Sade ve minimalist tasarım
- Dark/Light mode
- Smooth animasyonlar
- Kolay kullanım (UX odaklı)

---

## 🏗️ Sistem Mimarisi

### Mimari Modeli: Client-Server (SPA - Single Page Application)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Leaflet.js  │  │   Chart.js   │      │
│  │  Components  │  │   Map Layer  │  │   Graphics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
│                    Axios HTTP Client                        │
└─────────────────────────────────────────────────────────────┘
                            │
                      REST API (JSON)
                            │
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FastAPI Application                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Routes     │  │  Services   │  │  Models     │  │  │
│  │  │  /weather   │  │  Weather    │  │  Province   │  │  │
│  │  │  /provinces │  │  GeoData    │  │  Weather    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                    Cache Layer (Redis)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                    External APIs
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│  Open-Meteo    │                    │   GeoJSON       │
│  Weather API   │                    │   Static Data   │
└────────────────┘                    └─────────────────┘
```

---

## 💻 Teknoloji Stack

### Frontend
| Kategori | Teknoloji | Versiyon | Amaç |
|----------|-----------|----------|------|
| **Framework** | React | 18.x | UI Framework |
| **Language** | TypeScript | 5.x | Type Safety |
| **Build Tool** | Vite | 5.x | Fast Development |
| **Styling** | Tailwind CSS | 3.x | Modern CSS Framework |
| **Map** | Leaflet.js | 1.9.x | Interaktif Harita |
| **Charts** | Chart.js | 4.x | Grafikler |
| **HTTP Client** | Axios | 1.6.x | API İstekleri |
| **State** | Zustand | 4.x | State Management |
| **Icons** | Lucide React | 0.x | Modern İkonlar |
| **Date** | date-fns | 3.x | Tarih İşlemleri |

### Backend
| Kategori | Teknoloji | Versiyon | Amaç |
|----------|-----------|----------|------|
| **Framework** | FastAPI | 0.109.x | API Framework |
| **Language** | Python | 3.11+ | Backend Logic |
| **HTTP Client** | httpx | 0.26.x | Async API Calls |
| **Validation** | Pydantic | 2.x | Data Validation |
| **Cache** | Redis (optional) | 7.x | Caching |
| **CORS** | fastapi-cors | - | Cross-Origin |

### DevOps & Tools
- **Version Control:** Git
- **Package Manager (FE):** npm / pnpm
- **Package Manager (BE):** pip / poetry
- **Code Quality:** ESLint, Prettier, Black
- **Testing:** Vitest (FE), Pytest (BE)

---

## 📁 Proje Yapısı

```
havaiklimverisi/
│
├── 📄 README.md                    # Proje açıklaması
├── 📄 SPEC.md                      # Bu dosya
├── 📄 TASKS.md                     # Görev listesi
├── 📄 .gitignore
│
├── 📂 frontend/                    # React Frontend
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 vite.config.ts
│   ├── 📄 tailwind.config.js
│   ├── 📄 index.html
│   │
│   ├── 📂 src/
│   │   ├── 📄 main.tsx            # Entry point
│   │   ├── 📄 App.tsx             # Ana component
│   │   ├── 📄 index.css           # Global styles
│   │   │
│   │   ├── 📂 components/         # UI Bileşenleri
│   │   │   ├── 📂 Map/
│   │   │   │   ├── TurkeyMap.tsx
│   │   │   │   ├── ProvinceLayer.tsx
│   │   │   │   └── MapControls.tsx
│   │   │   │
│   │   │   ├── 📂 Calendar/
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── DateRangePicker.tsx
│   │   │   │   └── TimeSelector.tsx
│   │   │   │
│   │   │   ├── 📂 Weather/
│   │   │   │   ├── WeatherPanel.tsx
│   │   │   │   ├── WeatherCard.tsx
│   │   │   │   ├── WeatherCharts.tsx
│   │   │   │   └── WeatherMetrics.tsx
│   │   │   │
│   │   │   ├── 📂 UI/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   └── ThemeToggle.tsx
│   │   │   │
│   │   │   └── 📂 Layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── 📂 services/           # API Services
│   │   │   ├── weatherApi.ts
│   │   │   └── geoApi.ts
│   │   │
│   │   ├── 📂 store/              # State Management
│   │   │   ├── useWeatherStore.ts
│   │   │   └── useUIStore.ts
│   │   │
│   │   ├── 📂 types/              # TypeScript Types
│   │   │   ├── weather.ts
│   │   │   ├── province.ts
│   │   │   └── api.ts
│   │   │
│   │   ├── 📂 utils/              # Helper Functions
│   │   │   ├── formatters.ts
│   │   │   ├── colors.ts
│   │   │   └── constants.ts
│   │   │
│   │   └── 📂 hooks/              # Custom Hooks
│   │       ├── useWeather.ts
│   │       └── useProvinces.ts
│   │
│   └── 📂 public/
│       └── 📂 data/
│           └── turkey_provinces.geojson
│
├── 📂 backend/                     # FastAPI Backend
│   ├── 📄 requirements.txt
│   ├── 📄 pyproject.toml
│   ├── 📄 main.py                 # Entry point
│   │
│   ├── 📂 app/
│   │   ├── 📄 __init__.py
│   │   ├── 📄 config.py           # Ayarlar
│   │   │
│   │   ├── 📂 api/                # API Endpoints
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 weather.py
│   │   │   ├── 📄 provinces.py
│   │   │   └── 📄 health.py
│   │   │
│   │   ├── 📂 services/           # İş Mantığı
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 open_meteo.py
│   │   │   ├── 📄 geo_service.py
│   │   │   └── 📄 cache_service.py
│   │   │
│   │   ├── 📂 models/             # Veri Modelleri
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 weather.py
│   │   │   └── 📄 province.py
│   │   │
│   │   └── 📂 utils/              # Yardımcı Fonksiyonlar
│   │       ├── 📄 __init__.py
│   │       └── 📄 helpers.py
│   │
│   └── 📂 tests/                  # Test Dosyaları
│       └── test_weather_api.py
│
└── 📂 data/                        # Statik Veri
    ├── turkey_provinces.geojson
    └── province_coordinates.json
```

---

## 🗺️ Veri Katmanı

### 1. GeoJSON - Türkiye İl Sınırları

**Dosya:** `turkey_provinces.geojson`

**Yapı:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Ankara",
        "name_tr": "Ankara",
        "plate_code": "06",
        "region": "İç Anadolu",
        "population": 5663000,
        "area_km2": 25706
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[32.5, 39.8], ...]]
      }
    }
  ]
}
```

### 2. İl Koordinatları

**Dosya:** `province_coordinates.json`

**Amaç:** Her ilin merkez koordinatı (hava durumu API için)

```json
{
  "provinces": [
    {
      "name": "Ankara",
      "plate_code": "06",
      "latitude": 39.9334,
      "longitude": 32.8597,
      "elevation": 938
    }
  ]
}
```

---

## 🔌 API Spesifikasyonu

### Backend Endpoints

#### 1. Hava Durumu Verisi
```
GET /api/weather
```

**Query Parameters:**
- `province` (string, required): İl plaka kodu (örn: "06")
- `start_date` (string, required): Başlangıç tarihi (YYYY-MM-DD)
- `end_date` (string, optional): Bitiş tarihi
- `metrics` (array, optional): İstenen metrikler

**Response:**
```json
{
  "province": "Ankara",
  "coordinates": {
    "latitude": 39.9334,
    "longitude": 32.8597
  },
  "timezone": "Europe/Istanbul",
  "data": {
    "hourly": {
      "time": ["2026-02-05T00:00", "2026-02-05T01:00", ...],
      "temperature_2m": [8.2, 7.8, ...],
      "precipitation": [0.0, 0.0, ...],
      "wind_speed_10m": [12.5, 11.8, ...],
      "relative_humidity_2m": [65, 68, ...]
    },
    "daily": {
      "time": ["2026-02-05", "2026-02-06", ...],
      "temperature_2m_max": [15.2, 16.1, ...],
      "temperature_2m_min": [5.8, 6.2, ...],
      "precipitation_sum": [0.5, 1.2, ...]
    }
  }
}
```

#### 2. İl Listesi
```
GET /api/provinces
```

**Response:**
```json
{
  "provinces": [
    {
      "name": "Ankara",
      "plate_code": "06",
      "region": "İç Anadolu",
      "latitude": 39.9334,
      "longitude": 32.8597
    }
  ]
}
```

#### 3. Anlık Hava Durumu (Tüm İller)
```
GET /api/weather/current
```

**Response:**
```json
{
  "timestamp": "2026-02-05T14:30:00",
  "provinces": [
    {
      "plate_code": "06",
      "name": "Ankara",
      "temperature": 12.5,
      "precipitation": 0.0,
      "icon": "partly-cloudy"
    }
  ]
}
```

#### 4. Sağlık Kontrolü
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600
}
```

### External API: Open-Meteo

**Base URL:** `https://api.open-meteo.com/v1/forecast`  
**Archive URL:** `https://archive-api.open-meteo.com/v1/archive`

**Örnek İstek:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=39.9334
  &longitude=32.8597
  &hourly=temperature_2m,precipitation,wind_speed_10m
  &timezone=Europe/Istanbul
```

---

## 🎨 Arayüz Tasarımı

### Sayfa Layoutu

```
┌────────────────────────────────────────────────────────────┐
│  🌦️ Türkiye Hava Durumu Haritası    [🌙 Dark Mode] [ℹ️]  │ ← Header
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                   │    │
│  │         İNTERAKTİF TÜRKİYE HARİTASI              │    │
│  │                                                   │    │
│  │   🗺️ Leaflet Map                                 │    │
│  │   • 81 il sınırları                              │    │
│  │   • Renk kodlu hava durumu                       │    │
│  │   • Hover: tooltip                               │    │
│  │   • Click: seçim                                 │    │
│  │                                                   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📅 Tarih Seçimi:  [📆 05/02/2026] ─ [📆 12/02/2026]     │
│                    [⏰ Saatlik] [📊 Günlük]               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📍 Seçili İl: ANKARA                                     │
│                                                            │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │  🌡️ Sıcaklık │  💧 Yağış    │  💨 Rüzgar   │          │
│  │    12.5°C    │    0.0 mm    │   12 km/h    │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  📈 Grafikler:                                            │
│                                                            │
│  ┌────────────────────────────────────────────────┐      │
│  │  Sıcaklık (°C)                                 │      │
│  │  [Line Chart - Chart.js]                       │      │
│  └────────────────────────────────────────────────┘      │
│                                                            │
│  ┌────────────────────────────────────────────────┐      │
│  │  Yağış (mm)                                    │      │
│  │  [Bar Chart - Chart.js]                        │      │
│  └────────────────────────────────────────────────┘      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Renk Paleti (Modern & Minimal)

#### Light Mode
```css
--background: #FFFFFF
--surface: #F8FAFC
--primary: #3B82F6       /* Blue */
--secondary: #64748B     /* Slate */
--accent: #10B981        /* Green */
--text-primary: #1E293B
--text-secondary: #64748B
--border: #E2E8F0
```

#### Dark Mode
```css
--background: #0F172A
--surface: #1E293B
--primary: #60A5FA
--secondary: #94A3B8
--accent: #34D399
--text-primary: #F1F5F9
--text-secondary: #94A3B8
--border: #334155
```

#### Hava Durumu Renkleri (Sıcaklık Bazlı)
```
< -10°C  → #3B82F6  (Koyu Mavi - Çok Soğuk)
-10 - 0°C → #60A5FA  (Açık Mavi - Soğuk)
0 - 10°C  → #10B981  (Yeşil - Serin)
10 - 20°C → #FBBF24  (Sarı - Ilık)
20 - 30°C → #F97316  (Turuncu - Sıcak)
> 30°C    → #EF4444  (Kırmızı - Çok Sıcak)
```

### Tipografi

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem    /* 12px */
--text-sm: 0.875rem   /* 14px */
--text-base: 1rem     /* 16px */
--text-lg: 1.125rem   /* 18px */
--text-xl: 1.25rem    /* 20px */
--text-2xl: 1.5rem    /* 24px */
--text-3xl: 1.875rem  /* 30px */
```

---

## 🔄 Kullanıcı Akışı (User Flow)

### 1. İlk Yükleme
```
Kullanıcı siteyi açar
    ↓
Backend'den tüm iller için anlık hava durumu çekilir
    ↓
Harita yüklenir (81 il, renk kodlu)
    ↓
Varsayılan: Bugünün tarihi seçili
```

### 2. İl Seçimi
```
Kullanıcı haritada bir ile tıklar (örn: Ankara)
    ↓
İl vurgulanır (border + renk değişimi)
    ↓
API'den detaylı veri çekilir
    ↓
Alt panel açılır (smooth animation)
    ↓
Grafikler render edilir
```

### 3. Tarih Değişimi
```
Kullanıcı takvimden tarih aralığı seçer
    ↓
API'ye yeni istek gönderilir
    ↓
Loading state gösterilir
    ↓
Grafikler güncellenir
```

### 4. Dark Mode
```
Kullanıcı dark mode toggle'a tıklar
    ↓
localStorage'a kaydedilir
    ↓
Tüm renkler geçiş animasyonuyla değişir
```

---

## ⚡ Performans & Optimizasyon

### Frontend
- **Code Splitting:** React.lazy() ile route-based splitting
- **Image Optimization:** WebP formatı, lazy loading
- **Bundle Size:** < 500KB (gzipped)
- **Caching:** Service Worker ile offline support
- **Debounce:** Tarih seçiminde API çağrıları

### Backend
- **Redis Cache:** Sık kullanılan veriler (TTL: 1 saat)
- **Response Time:** < 500ms (95th percentile)
- **Rate Limiting:** 100 req/min per IP
- **Compression:** Gzip/Brotli
- **Connection Pool:** httpx async client

### Database/Data
- **GeoJSON:** Minimize edilmiş (< 200KB)
- **Static Assets:** CDN kullanımı
- **API Response:** Sadece gereken alanlar

---

## 🔒 Güvenlik

### API Güvenliği
- CORS policy (sadece frontend domain)
- Rate limiting (DDoS koruması)
- Input validation (Pydantic)
- Error handling (log ama detay verme)

### Frontend Güvenliği
- XSS koruması (React otomatik escape)
- HTTPS only
- Secure headers (CSP, X-Frame-Options)

---

## 📊 Metriks & İzleme

### Backend Metrics
- API response time
- Error rate
- Cache hit ratio
- External API uptime

### Frontend Metrics
- Page load time
- Time to interactive
- Bundle size
- User interactions

---

## 🚀 Deployment Stratejisi

### Development
```
Frontend: npm run dev (http://localhost:5173)
Backend: uvicorn main:app --reload (http://localhost:8000)
```

### Production

#### Option A: Single Server
```
Frontend: Nginx (static files)
Backend: uvicorn + gunicorn
Reverse Proxy: Nginx
```

#### Option B: Serverless
```
Frontend: Vercel / Netlify
Backend: Railway / Render / Fly.io
```

#### Domain Structure
```
https://turkiye-hava-durumu.com    → Frontend
https://api.turkiye-hava-durumu.com → Backend API
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Stack layout */
  /* Harita: full width */
  /* Panel: bottom sheet */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Side-by-side */
  /* Harita: 60% */
  /* Panel: 40% */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout */
  /* Harita: 70% */
  /* Panel: 30% + overlay */
}
```

---

## 🧪 Test Stratejisi

### Frontend Tests
- **Unit:** Vitest (util functions)
- **Component:** Vitest + Testing Library
- **E2E:** Playwright (critical flows)

### Backend Tests
- **Unit:** pytest (services)
- **Integration:** pytest + httpx (API endpoints)
- **Coverage:** > 80%

---

## 📈 Gelecek Özellikler (v2.0)

- [ ] Kullanıcı hesapları (favori iller)
- [ ] Karşılaştırma modu (2+ il)
- [ ] Export (PDF, Excel)
- [ ] Uyarı sistemi (aşırı hava koşulları)
- [ ] İstatistiksel analizler
- [ ] Mobil uygulama (React Native)
- [ ] Hava tahmin modelleri (ML)

---

## 📝 Notlar

### Open-Meteo API Limitleri
- **Rate Limit:** 10,000 requests/day (ücretsiz)
- **Geçmiş Veri:** 1940'tan günümüze
- **Tahmin:** 16 gün
- **Parametreler:** 50+ meteorolojik değişken

### Alternatif API'ler (Backup)
- Meteostat (istasyon bazlı)
- OpenWeatherMap (ücretli, daha detaylı)
- MGM API (Türkiye resmi, API key gerekiyor)

---

## 👥 Katkıda Bulunanlar

Bu proje açık kaynak olacak şekilde tasarlanmıştır.

---

## 📄 Lisans

MIT License (veya tercih edilen açık kaynak lisansı)

---

**Son Güncelleme:** 5 Şubat 2026  
**Doküman Versiyonu:** 1.0.0
