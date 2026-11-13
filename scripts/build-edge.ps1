<#
    build-edge.ps1 - Build the Edge (Chromium MV3) extension and publish it to
    the stable edge-build/ folder that Edge loads via "Load unpacked".
    Runs automatically from .githooks/pre-push on every git push; can also be
    run manually: .\scripts\build-edge.ps1
#>

# Build the Edge extension, then mirror build/debug/edge into edge-build/.
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

# Same node flags as the package.json build scripts.
node --max-old-space-size=3072 tasks/cli.js build --debug --edge
if ($LASTEXITCODE -ne 0) {
    Write-Error "Edge build failed (exit $LASTEXITCODE); aborting push."
    exit 13
}

if (-not (Test-Path "$repo\build\debug\edge\manifest.json")) {
    Write-Error "Edge build output missing: build\debug\edge\manifest.json"
    exit 13
}

# robocopy exit codes 0-7 mean success, 8+ mean failure.
robocopy "$repo\build\debug\edge" "$repo\edge-build" /MIR /NJH /NJS /NDL /NFL
if ($LASTEXITCODE -ge 8) {
    Write-Error "Copying to edge-build failed (robocopy exit $LASTEXITCODE); aborting push."
    exit 8
}

Write-Host "Edge build ready: $repo\edge-build  (edge://extensions -> Developer mode -> Load unpacked -> reload Dark Reader)"
exit 0
