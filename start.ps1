# Başlatma Scripti - Windows PowerShell
# Türkiye İklim Haritası Uygulaması

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\SIHAT\iklim\openaiapi\havaiklimverisi"
$pythonExe = "$projectRoot\.venv\Scripts\python.exe"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🌦️  Türkiye İklim Haritası - Başlatılıyor...      " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Python ve Node.js kontrolü
Write-Host "🔍 Ön kontroller yapılıyor..." -ForegroundColor Yellow

if (-not (Test-Path $pythonExe)) {
    Write-Host "❌ Python virtual environment bulunamadı!" -ForegroundColor Red
    Write-Host "   Path: $pythonExe" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js bulunamadı! Lütfen Node.js kurun." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python venv: OK" -ForegroundColor Green
Write-Host "✅ Node.js: OK" -ForegroundColor Green
Write-Host ""

# Backend başlatma
Write-Host "📡 Backend (FastAPI) başlatılıyor..." -ForegroundColor Green
Write-Host "   Port: 8000" -ForegroundColor Gray
Write-Host "   URL: http://localhost:8000" -ForegroundColor Gray
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor Gray

$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'Backend - FastAPI (Port 8000)'
cd '$projectRoot\backend'
Write-Host '🚀 Backend başlatılıyor...' -ForegroundColor Cyan
& '$pythonExe' -m uvicorn main:app --reload --host localhost --port 8000
"@ -PassThru

Start-Sleep -Seconds 2

# Frontend başlatma
Write-Host ""
Write-Host "🎨 Frontend (React + Vite) başlatılıyor..." -ForegroundColor Green
Write-Host "   Port: 5173" -ForegroundColor Gray
Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray

$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'Frontend - Vite (Port 5173)'
cd '$projectRoot\frontend'
Write-Host '🚀 Frontend başlatılıyor...' -ForegroundColor Cyan
npm run dev
"@ -PassThru

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ Uygulamalar başarıyla başlatıldı!              " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Arayüz:" -ForegroundColor Yellow
Write-Host "   → http://localhost:5173" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "📚 API Dokümantasyonu:" -ForegroundColor Yellow
Write-Host "   → http://localhost:8000/docs" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "⚠️  Not: Uygulamaları kapatmak için açılan terminal pencerelerini kapatın." -ForegroundColor Yellow
Write-Host ""
Write-Host "Devam etmek için herhangi bir tuşa basın..." -ForegroundColor Gray
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
