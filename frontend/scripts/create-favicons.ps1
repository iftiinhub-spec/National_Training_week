Add-Type -AssemblyName System.Drawing

function Export-NtwFavicon {
  param(
    [string]$Source,
    [string]$Destination
  )

  $sourcePath = (Resolve-Path -LiteralPath $Source).Path
  $bitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)
  try {
    # The official combined website logo places NTW in its right half.
    $startX = [Math]::Floor($bitmap.Width * 0.53)
    $minX = $bitmap.Width
    $minY = $bitmap.Height
    $maxX = -1
    $maxY = -1

    for ($y = 0; $y -lt $bitmap.Height; $y++) {
      for ($x = $startX; $x -lt $bitmap.Width; $x++) {
        if ($bitmap.GetPixel($x, $y).A -gt 8) {
          if ($x -lt $minX) { $minX = $x }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }

    if ($maxX -lt $minX -or $maxY -lt $minY) {
      throw "The NTW mark could not be located in $Source"
    }

    $markWidth = $maxX - $minX + 1
    $markHeight = $maxY - $minY + 1
    $canvasSize = 256
    $padding = 18
    $available = $canvasSize - (2 * $padding)
    $scale = [Math]::Min($available / $markWidth, $available / $markHeight)
    $drawWidth = [Math]::Round($markWidth * $scale)
    $drawHeight = [Math]::Round($markHeight * $scale)
    $drawX = [Math]::Round(($canvasSize - $drawWidth) / 2)
    $drawY = [Math]::Round(($canvasSize - $drawHeight) / 2)

    $favicon = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($favicon)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $sourceRect = New-Object System.Drawing.Rectangle($minX, $minY, $markWidth, $markHeight)
        $destinationRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawWidth, $drawHeight)
        $graphics.DrawImage($bitmap, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
      }
      $destinationPath = Join-Path (Get-Location) $Destination
      $favicon.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $favicon.Dispose()
    }
  } finally {
    $bitmap.Dispose()
  }
}

Export-NtwFavicon -Source 'public\logo.png' -Destination 'public\favicon-light.png'
Export-NtwFavicon -Source 'public\logo-dark.png' -Destination 'public\favicon-dark.png'
