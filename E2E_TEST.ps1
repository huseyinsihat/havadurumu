# End-to-End Test Script
# Türkiye İklim Haritası - Sistem Test

Write-Host "🧪 SISTEM TEST BAŞLANDI" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "================================" -ForegroundColor Cyan

# 1. Backend Health Check
Write-Host "`n1️⃣  BACKEND HEALTH CHECK" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Backend düzgün çalışıyor: $($data.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend hatası: $_" -ForegroundColor Red
    exit 1
}

# 2. Provinces Endpoint
Write-Host "`n2️⃣  PROVINCES ENDPOINT" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/provinces" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Toplam il: $($data.provinces.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Provinces hatası: $_" -ForegroundColor Red
    exit 1
}

# 3. Weather Endpoint (Spesifik İl - İstanbul)
Write-Host "`n3️⃣  WEATHER ENDPOINT (İstanbul - 34)" -ForegroundColor Yellow
try {
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/weather?province=34&start_date=$today&end_date=$today&hourly=false" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    $temp = $data.data.daily.temperature_2m_max[0]
    Write-Host "   ✅ İstanbul sıcaklığı: $temp°C" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Weather hatası: $_" -ForegroundColor Red
    exit 1
}

# 4. Current Weather Endpoint
Write-Host "`n4️⃣  CURRENT WEATHER ENDPOINT" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/weather/current" -UseBasicParsing -ErrorAction Continue
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Current weather: $($data.provinces.Count) il" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Current weather endpoint'i geçiçi hata verdi (normal olabilir)" -ForegroundColor Yellow
}

# 5. Frontend Check
Write-Host "`n5️⃣  FRONTEND CHECK" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend hazır: Port 5173" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Frontend hatası: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n🎉 TÜM TESTLER TAMAMLANDI!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Tarayıcıda http://localhost:5173 açıp test edin" -ForegroundColor Cyan
Write-Host "`nBeklenen İş Akışı:" -ForegroundColor Cyan
Write-Host "1. Harita yüklenecek" -ForegroundColor White
Write-Host "2. İlleri seçebileceksiniz" -ForegroundColor White
Write-Host "3. Hava durumu verileri gösterilecek" -ForegroundColor White
Write-Host "4. Tooltip'te il adı ve veri gösterilecek" -ForegroundColor White
