Param(
  [string[]]$Inputs = @(
    "public\\brochure.pdf",
    "public\\capitolo_omaggio_sergio.pdf"
  ),
  [ValidateSet('screen','ebook','printer','prepress','default')]
  [string]$Preset = 'ebook'
)

$ErrorActionPreference = 'Stop'

function Get-Ghostscript {
  $cmd = Get-Command gswin64c -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $cmd = Get-Command gs -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  throw "Ghostscript not found. Install it (Windows: gswin64c) then re-run."
}

function MB([long]$Bytes) {
  return [math]::Round($Bytes / 1MB, 2)
}

$gs = Get-Ghostscript
Write-Host "Using Ghostscript: $gs"

foreach ($rel in $Inputs) {
  $inPath = Join-Path (Get-Location) $rel
  if (-not (Test-Path $inPath)) {
    Write-Warning "Missing: $rel (skipping)"
    continue
  }

  $tmpPath = "$inPath.tmp.pdf"

  $before = (Get-Item $inPath).Length

  $args = @(
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    "-dPDFSETTINGS=/$Preset",
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    "-sOutputFile=$tmpPath",
    $inPath
  )

  & $gs @args | Out-Null

  $after = (Get-Item $tmpPath).Length

  if ($after -lt $before) {
    Move-Item -Force $tmpPath $inPath
    Write-Host "optimized`t$rel`t$(MB $before)MB -> $(MB $after)MB"
  } else {
    Remove-Item -Force $tmpPath
    Write-Host "kept`t$rel`t$(MB $before)MB"
  }
}
