# Script para iniciar Expo con Android SDK configurado
$env:ANDROID_HOME = 'C:\Android'
$env:Path = $env:Path + ';C:\Android\platform-tools;C:\Android\tools;C:\Android\emulator'

Write-Host "✅ Variables de entorno configuradas:" -ForegroundColor Green
Write-Host "   ANDROID_HOME = $env:ANDROID_HOME"
Write-Host ""
Write-Host "📱 Dispositivos Android disponibles:" -ForegroundColor Cyan
& adb devices
Write-Host ""
Write-Host "🚀 Iniciando Expo..." -ForegroundColor Yellow
npx expo start
