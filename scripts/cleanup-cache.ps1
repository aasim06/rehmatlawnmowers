# PowerShell script for clearing cache and temporary build files
Write-Host "Cleaning cache and build artifacts for Rehmat Lawnmowers..." -ForegroundColor Cyan

$pathsToClean = @(
    "node_modules\.vite",
    "dist",
    "build",
    ".eslintcache",
    "coverage"
)

foreach ($path in $pathsToClean) {
    if (Test-Path $path) {
        Write-Host "Removing: $path" -ForegroundColor Yellow
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Clearing npm/yarn cache if needed..." -ForegroundColor Cyan
# Optional npm cache verify
# npm cache verify

Write-Host "Cache cleanup complete!" -ForegroundColor Green
