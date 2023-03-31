$sourceFolder = Get-Location
$outputZip = Join-Path -Path $sourceFolder -ChildPath "build.zip"

$tempFolder = Join-Path -Path $sourceFolder -ChildPath "build"
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

Copy-Item -Path "$sourceFolder\*.js" -Destination $tempFolder -Force
Copy-Item -Path "$sourceFolder\*.png" -Destination $tempFolder -Force
Copy-Item -Path "$sourceFolder\manifest.json" -Destination $tempFolder -Force

Compress-Archive -Path "$tempFolder\*" -DestinationPath $outputZip -Force

Remove-Item -Path $tempFolder -Recurse -Force

Write-Host "Build complete. Output: $outputZip"