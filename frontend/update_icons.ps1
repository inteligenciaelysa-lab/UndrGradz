Add-Type -AssemblyName System.Drawing

$srcPath = "logo_sin_letras.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "logo_sin_letras.png not found!"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile((Resolve-Path $srcPath).Path)

function Resize-Image {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [bool]$isForeground = $false
    )

    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if (-not $isForeground) {
        # Fill background with brand color #0a0520 for standard app icons
        $brandColor = [System.Drawing.ColorTranslator]::FromHtml("#0a0520")
        $g.Clear($brandColor)
        
        # Scale logo with slight padding inside background
        $padding = [int]($targetWidth * 0.10)
        $drawW = $targetWidth - ($padding * 2)
        $drawH = $targetHeight - ($padding * 2)
        $g.DrawImage($source, $padding, $padding, $drawW, $drawH)
    } else {
        # Transparent background for adaptive foreground icon, centered in safe zone (65% of canvas)
        $g.Clear([System.Drawing.Color]::Transparent)
        $scale = 0.65
        $drawW = [int]($targetWidth * $scale)
        $drawH = [int]($targetHeight * $scale)
        $posX = [int](($targetWidth - $drawW) / 2)
        $posY = [int](($targetHeight - $drawH) / 2)
        $g.DrawImage($source, $posX, $posY, $drawW, $drawH)
    }

    $g.Dispose()
    
    # Save as PNG format
    $pngFormat = [System.Drawing.Imaging.ImageFormat]::Png
    $destBmp.Save($outputPath, $pngFormat)
    $destBmp.Dispose()
    Write-Host "Generated: $outputPath ($targetWidth x $targetHeight)"
}

$densities = @(
    @{ name = "mipmap-mdpi";    icon = 48;  fg = 108 },
    @{ name = "mipmap-hdpi";    icon = 72;  fg = 162 },
    @{ name = "mipmap-xhdpi";   icon = 96;  fg = 216 },
    @{ name = "mipmap-xxhdpi";  icon = 144; fg = 324 },
    @{ name = "mipmap-xxxhdpi"; icon = 192; fg = 432 }
)

$resDir = "android/app/src/main/res"

foreach ($d in $densities) {
    $folder = Join-Path $resDir $d.name
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    $iconPath = Join-Path $folder "ic_launcher.png"
    $roundPath = Join-Path $folder "ic_launcher_round.png"
    $fgPath = Join-Path $folder "ic_launcher_foreground.png"

    Resize-Image -source $srcImg -targetWidth $d.icon -targetHeight $d.icon -outputPath $iconPath -isForeground $false
    Resize-Image -source $srcImg -targetWidth $d.icon -targetHeight $d.icon -outputPath $roundPath -isForeground $false
    Resize-Image -source $srcImg -targetWidth $d.fg -targetHeight $d.fg -outputPath $fgPath -isForeground $true
}

$srcImg.Dispose()
Write-Host "✅ All launcher icons updated cleanly with logo_sin_letras.png!"
