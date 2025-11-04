# UTF-8 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "메모 공유 앱 Git 설정 스크립트" -ForegroundColor Cyan
Write-Host ""

# 현재 스크립트 디렉토리로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "현재 디렉토리: $scriptPath" -ForegroundColor Yellow
Write-Host ""

# Git 초기화
Write-Host "Git 초기화 중..." -ForegroundColor Green
if (Test-Path ".git") {
    Write-Host ".git 폴더가 이미 존재합니다." -ForegroundColor Yellow
} else {
    git init
    Write-Host "Git 저장소가 초기화되었습니다." -ForegroundColor Green
}

Write-Host ""
Write-Host "원격 저장소 설정 중..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin https://github.com/wjy1814-droid/woops.git
Write-Host "원격 저장소가 설정되었습니다." -ForegroundColor Green

Write-Host ""
Write-Host "파일 추가 중..." -ForegroundColor Green
git add .gitignore
git add README.md
git add frontend/
git add backend/
git add docs/

Write-Host ""
Write-Host "Git 상태:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "다음 명령어로 커밋하고 푸시하세요:" -ForegroundColor Yellow
Write-Host '  git commit -m "Initial commit: 구름 메모장 앱"' -ForegroundColor White
Write-Host "  git push -u origin master" -ForegroundColor White
Write-Host ""

