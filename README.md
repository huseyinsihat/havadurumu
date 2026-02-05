# 🌦️ Türkiye Hava Durumu Haritası

Modern ve interaktif Türkiye hava durumu platformu. 81 il için gerçek zamanlı ve geçmiş iklim verileri.

## ✨ Özellikler

- 🗺️ **İnteraktif Harita** - 81 il için coğrafi görselleştirme
- 📅 **Tarih Seçimi** - 1940'tan bugüne geçmiş veriler
- 📊 **Detaylı Grafikler** - Sıcaklık, yağış, rüzgar, nem analizi
- 🌓 **Dark/Light Mod** - Modern ve şık arayüz
- 📱 **Mobil Uyumlu** - Tüm cihazlarda mükemmel deneyim
- ⚡ **Ücretsiz API** - Open-Meteo (API key gerektirmez)

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Python 3.11+
- Node.js 18+
- Git

### Kurulum ve Çalıştırma

```bash
# Repository'yi klonlayın
git clone https://github.com/huseyinsihat/havadurumu.git
cd havadurumu

# Otomatik başlatma (Windows PowerShell)
.\start.ps1
```

**Manuel Kurulum:**

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

Uygulama şu adreslerde çalışacak:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

## 🛠️ Teknolojiler

**Backend**
- FastAPI
- Python 3.11+
- Open-Meteo API

**Frontend**
- React 18
- TypeScript
- Leaflet.js
- Chart.js
- Tailwind CSS
- Zustand

## 📁 Proje Yapısı

```
├── backend/          # FastAPI backend
│   ├── app/          # Uygulama modülleri
│   └── main.py       # Ana uygulama
├── frontend/         # React frontend
│   └── src/          # Kaynak dosyalar
└── data/             # İl verileri ve GeoJSON
```

## 📄 Lisans

MIT License

## 👤 Geliştirici

[Hüseyin Sihat](https://github.com/huseyinsihat)
