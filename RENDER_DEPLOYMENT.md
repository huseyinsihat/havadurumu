# Render Backend Deployment Guide

## 1. Render.com Hesabı Oluştur
- https://render.com adresine git
- GitHub ile giriş yap veya kayıt ol

## 2. New Web Service Oluştur
1. Dashboard → New → Web Service
2. Repository'yi seç: `huseyinsihat/havadurumi`
3. Branch: `master`
4. Root Directory: `backend`
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0`
7. Plan: Free (ücretsiz, binde 15 dakika inaktivite sonra uyku modu)

## 3. Environment Variables
Render dashboard'da Add Environment Variable:
- `PORT`: 8000 (veya Render tarafından atanacak)

## 4. Deploy
- "Create Web Service" butonuna tıkla
- Deployment başlayacak (~3-5 dakika)
- Başarılı olunca URL'i al: `https://your-app-name.onrender.com`

## 5. Frontend Konfigürasyonu
GitHub Actions secrets'a ekle (şu repodan):
1. Settings → Secrets and variables → Actions
2. New repository secret:
   - Name: `VITE_API_URL`
   - Value: `https://your-app-name.onrender.com/api`

Veya `.env.production`:
```
VITE_API_URL=https://your-app-name.onrender.com/api
VITE_BASE_URL=/
```

## 6. CORS Ayarı (Backend)
Backend'de CORS'u güncelle (main.py):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://huseyinsihat.github.io", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 7. Deploy
- Frontend değişiklik → master'a push → GitHub Actions otomatik deploy eder
- Backend değişiklik → master'a push → Render otomatik deploy eder (webhook ile)

---

## Render Free Tier Sınırlamaları
- İlk çalışmadan sonra 15 dakika inaktivite → uyku modu
- İlk istek 1-2 dakika sürebilir (wake-up)
- Bayılık 2 uygulamaya kadar yazılabilir
- Veri tabanı olmadan sadece API hostingi

Eğer daha iyi performance istersen:
- **Railway.app**: Benzer yapı, biraz daha uygun fiyat
- **Fly.io**: Global deployment, biraz daha teknik
- **Vercel**: Frontend için optimize (Next.js için ideal)
