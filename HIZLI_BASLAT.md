# 🚀 Hızlı Başlatma Kılavuzu

## Tek Komutla Başlatma

### Windows PowerShell
```powershell
.\start.ps1
```

## Manuel Başlatma

### 1️⃣ Backend Başlat (Terminal 1)
```powershell
cd backend
& "C:\Users\SIHAT\iklim\openaiapi\havaiklimverisi\.venv\Scripts\python.exe" -m uvicorn main:app --reload --host localhost --port 8000
```

### 2️⃣ Frontend Başlat (Terminal 2)
```powershell
cd frontend
npm run dev
```

## 🌐 Erişim URL'leri

| Uygulama | URL | Açıklama |
|----------|-----|----------|
| **Ana Arayüz** | http://localhost:5173 | React uygulaması |
| **API Docs** | http://localhost:8000/docs | Swagger arayüzü |
| **API Health** | http://localhost:8000/api/health | Sağlık kontrolü |

## 📋 Sistem Gereksinimleri

- ✅ Python 3.10+ (venv dahil)
- ✅ Node.js 18+ (npm dahil)
- ✅ 4GB RAM
- ✅ Modern web tarayıcı (Chrome, Firefox, Edge)

## 🔧 İlk Kurulum (Sadece Bir Kez)

### Backend Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies
```powershell
cd frontend
npm install
```

## 🐛 Sorun Giderme

### Backend başlamıyor?
```powershell
# venv Python yolunu kontrol et
Test-Path "C:\Users\SIHAT\iklim\openaiapi\havaiklimverisi\.venv\Scripts\python.exe"

# Requirements yükle
pip install -r backend\requirements.txt
```

### Frontend başlamıyor?
```powershell
# node_modules var mı kontrol et
cd frontend
npm install
npm run dev
```

### Port zaten kullanımda?
- Backend için: Port 8000'i kapatan uygulamayı sonlandırın
- Frontend için: Port 5173'ü kapatan uygulamayı sonlandırın

```powershell
# Port kullanımını kontrol et
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

## 📊 Özellikler

- ✅ 81 il için interaktif harita
- ✅ Tarih aralığı seçimi (1940-günümüz)
- ✅ Saatlik/Günlük hava verileri
- ✅ Sıcaklık bazlı renkli görselleştirme
- ✅ Grafiksel veri analizi
- ✅ Responsive tasarım
- ✅ Dark mode desteği

## 🎯 Kullanım

1. Uygulamayı başlatın (`start.ps1` veya manuel)
2. Tarayıcıda http://localhost:5173 açın
3. Harita üzerinden bir il seçin
4. Tarih aralığı belirleyin
5. Hava durumu verilerini inceleyin

## 📚 Daha Fazla Bilgi

- [PROJE_RAPORU.md](PROJE_RAPORU.md) - Detaylı proje raporu
- [IYILESTIRME_PLANI.md](IYILESTIRME_PLANI.md) - İyileştirme planı
- [SPEC.md](SPEC.md) - Teknik spesifikasyonlar

---

**Son Güncelleme:** 5 Şubat 2026  
**Durum:** ✅ Çalışıyor
