# Re-encode downloaded Valve PNG/JPG assets to sane sizes.
# The source CDN serves some 88x63 icons as multi-megabyte 16-bit PNGs.
# Usage: pwsh -File scripts/optimize-assets.ps1
Add-Type -AssemblyName System.Drawing

$root = Join-Path $PSScriptRoot '..\assets'
$root = (Resolve-Path $root).Path
$pngs = Get-ChildItem $root -Recurse -Filter *.png
$jpgs = Get-ChildItem $root -Recurse -Filter *.jpg

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' } |
  Select-Object -First 1
$jpegParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$jpegParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, 88L
)

$before = ($pngs + $jpgs | Measure-Object Length -Sum).Sum

foreach ($file in $pngs) {
  try {
    $image = [System.Drawing.Image]::FromFile($file.FullName)
    $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
    $graphics.Dispose()
    $image.Dispose()
    $temp = $file.FullName + '.opt'
    $bitmap.Save($temp, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Move-Item -Force $temp $file.FullName
  } catch {
    Write-Warning "PNG failed: $($file.FullName) — $($_.Exception.Message)"
  }
}

foreach ($file in $jpgs) {
  try {
    $image = [System.Drawing.Image]::FromFile($file.FullName)
    $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
    $graphics.Dispose()
    $image.Dispose()
    $temp = $file.FullName + '.opt'
    $bitmap.Save($temp, $jpegCodec, $jpegParams)
    $bitmap.Dispose()
    Move-Item -Force $temp $file.FullName
  } catch {
    Write-Warning "JPG failed: $($file.FullName) — $($_.Exception.Message)"
  }
}

$after = (Get-ChildItem $root -Recurse -Include *.png,*.jpg | Measure-Object Length -Sum).Sum
Write-Output ("Optimized: {0:N1} MB -> {1:N1} MB" -f ($before / 1MB), ($after / 1MB))
