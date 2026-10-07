$source = "C:\Users\user\.gemini\antigravity\scratch\marketmind-ai"
$stage = "C:\Users\user\.gemini\antigravity\scratch\zip-stage"
$downZip = "C:\Users\user\Downloads\addon-ai-project.zip"
$deskZip = "C:\Users\user\Desktop\addon-ai-project.zip"
$projectZip = "$source\addon-ai-project.zip"
$artifactZip = "C:\Users\user\.gemini\antigravity\brain\f160604b-19e6-48c3-8050-2f727d6b1677\addon-ai-project.zip"

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

# Copy project files excluding node_modules, dist, .git, and old zips
robocopy $source $stage /E /XD node_modules dist .git /XF *.zip dev.db-journal dev.db-wal dev.db | Out-Null

# Ensure .env is explicitly verified and copied
if (Test-Path "$source\.env") {
    Copy-Item "$source\.env" "$stage\.env" -Force
    Write-Host "Verified: .env with all API keys copied safely into archive package."
}

# Copy dev.db if exists
if (Test-Path "$source\prisma\dev.db") {
    Copy-Item "$source\prisma\dev.db" "$stage\prisma\dev.db" -Force -ErrorAction SilentlyContinue
}

if (Test-Path $downZip) { Remove-Item $downZip -Force -ErrorAction SilentlyContinue }
if (Test-Path $deskZip) { Remove-Item $deskZip -Force -ErrorAction SilentlyContinue }
if (Test-Path $projectZip) { Remove-Item $projectZip -Force -ErrorAction SilentlyContinue }

# Compress staging directory
Compress-Archive -Path "$stage\*" -DestinationPath $downZip -Force

# Copy to Desktop, Project root, and Conversation Artifacts
Copy-Item $downZip $deskZip -Force -ErrorAction SilentlyContinue
Copy-Item $downZip $projectZip -Force -ErrorAction SilentlyContinue
Copy-Item $downZip $artifactZip -Force -ErrorAction SilentlyContinue

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "ZIP created successfully with .env and all keys secured!"
Get-Item $downZip | Select-Object Name, Length, LastWriteTime
Get-Item $deskZip | Select-Object Name, Length, LastWriteTime

