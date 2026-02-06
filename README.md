# Turkiye Hava Durumu Haritasi

## Turkce

Modern ve interaktif Turkiye hava durumu platformu. 81 il icin gercek zamanli ve gecmis iklim verileri sunar.

### Ozellikler

- Interaktif harita ve il bazli goruntuleme
- Tarih secimi ile gecmis veriler
- Detayli grafikler (sicaklik, yagis, ruzgar, nem)
- Mobil uyumlu arayuz
- Ucretsiz API (Open-Meteo)

### Hizli Baslangic

#### Gereksinimler

- Python 3.11+
- Node.js 18+
- Git

#### Kurulum ve Calistirma

```bash
# Repository klonlama
git clone https://github.com/huseyinsihat/havadurumu.git
cd havadurumu

# Otomatik baslatma (Windows PowerShell)
.\start.ps1
```

Manuel kurulum:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (yeni terminal)
cd frontend
npm install
npm run dev
```

Uygulama adresleri:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Teknolojiler

Backend:
- FastAPI
- Python 3.11+
- Open-Meteo API

Frontend:
- React 18
- TypeScript
- Leaflet.js
- Chart.js
- Tailwind CSS
- Zustand

### Proje Yapisi

```
├── backend/          # FastAPI backend
│   ├── app/          # Uygulama modulleri
│   └── main.py       # Ana uygulama
├── frontend/         # React frontend
│   └── src/          # Kaynak dosyalar
└── data/             # Il verileri ve GeoJSON
```

### Canlı Demo

- **Frontend**: https://huseyinsihat.github.io/havadurumu
- **Backend API**: https://havadurumu-api.onrender.com

### Deployment

#### Backend (Render.com)
Backend Render.com üzerinde yayınlanır. Detaylı talimatlar için [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) dosyasına bakınız.

#### Frontend (GitHub Pages)
Frontend GitHub Pages üzerinde otomatik deploy edilir. Her `master` branch'e push yapıldığında GitHub Actions otomatik olarak deploy eder.

### Ekran Goruntuleri

#### Ana Harita Gorunumu
Interaktif Turkiye haritasi, sicaklik renk skalasi ve kritik hava durumu olaylari

![Ana Harita](screenshots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-02-06%20030732.png)

#### Il Detay Sayfasi
Secilen ilin detayli hava durumu verileri, karsilastirma ve canli grafikler

![Il Detay](screenshots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-02-06%20030747.png)

#### 24 Saatlik Grafik Analizi
Sicaklik, yagis, ruzgar, nem, basinc, gorus ve bulutluluk grafikleri

![Grafikler](screenshots/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-02-06%20030758.png)

### Ozellikler Detay

- 🗺️ **Interaktif Harita**: Turkiye haritasi uzerinden il secimi
- 🌡️ **Sicaklik Skalasi**: Renk kodlu sicaklik gorunumu
- ⚠️ **Kritik Olaylar**: Firtina, kar, asiri sicak/soguk, yuksek ruzgar uyarilari haritada gosteriliyor
- 📍 **Otomatik Konum**: Kullanici konumuna gore en yakin il otomatik seciliyor
- 📊 **4 Grafik Turu**: Sicaklik, yagis, ruzgar/nem, gorus/bulutluluk
- 🇹🇷 **Turkiye Ortalamalari**: Secilen ilin Turkiye ortalamalari ile karsilastirmasi
- 📈 **Siralamalari**: En sicak/soguk, en yagisli/kurak, en nemli/kuru iller
- 🕐 **Istanbul Saat Dilimi**: Turkiye saati ile tam uyumlu
- 📅 **Tarih Secimi**: 1940'tan gunumuze gecmis veriler
- ⏰ **Saatlik Veri**: 24 saatlik detayli analiz

### Lisans

MIT License

### Gelistirici

Huseyin Sihat: https://github.com/huseyinsihat

---

## English

Modern and interactive Turkey weather platform with real-time and historical climate data for 81 provinces.

### Features

- Interactive map with province-level visualization
- Date selection for historical data
- Detailed charts (temperature, precipitation, wind, humidity)
- Mobile-friendly interface
- Free API (Open-Meteo)

### Quick Start

#### Requirements

- Python 3.11+
- Node.js 18+
- Git

#### Install and Run

```bash
# Clone repository
git clone https://github.com/huseyinsihat/havadurumu.git
cd havadurumu

# One-click start (Windows PowerShell)
.\start.ps1
```

Manual setup:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

App URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Tech Stack

Backend:
- FastAPI
- Python 3.11+
- Open-Meteo API

Frontend:
- React 18
- TypeScript
- Leaflet.js
- Chart.js
- Tailwind CSS
- Zustand

### Project Structure

```
├── backend/          # FastAPI backend
│   ├── app/          # Application modules
│   └── main.py       # Main app
├── frontend/         # React frontend
│   └── src/          # Source files
└── data/             # Province data and GeoJSON
```

### Screenshots

<p align="center">
	<img src="frontend/src/utils/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-02-05%20233807.png" width="32%" alt="Main screen" />
	<img src="frontend/src/utils/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-02-05%20233836.png" width="32%" alt="Map and details" />
	<img src="frontend/src/utils/Ekran%20g%C3%B6r%C3%BCnt%C3%BCs%C3%BC%202026-02-05%20233846.png" width="32%" alt="Dark theme modal" />
</p>

### License

MIT License

### Author

Huseyin Sihat: https://github.com/huseyinsihat
