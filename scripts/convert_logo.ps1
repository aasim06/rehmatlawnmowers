Add-Type -AssemblyName System.Drawing
$inPath = Join-Path (Get-Location) "src\assets\images\rehmat-logo.jpg"
$outPath = Join-Path (Get-Location) "src-tauri\rehmat-logo.png"
$img = [System.Drawing.Image]::FromFile($inPath)
$img.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "PNG saved successfully to $outPath"
