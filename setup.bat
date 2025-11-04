@echo off
chcp 65001 >nul
echo 메모 공유 앱 Git 설정 스크립트
echo.

cd /d "%~dp0"

echo Git 초기화 중...
if exist .git (
    echo .git 폴더가 이미 존재합니다.
) else (
    git init
    echo Git 저장소가 초기화되었습니다.
)

echo.
echo 원격 저장소 설정 중...
git remote remove origin 2>nul
git remote add origin https://github.com/wjy1814-droid/woops.git
echo 원격 저장소가 설정되었습니다.

echo.
echo 파일 추가 중...
git add .gitignore
git add README.md
git add frontend/
git add backend/
git add docs/

echo.
echo Git 상태:
git status

echo.
echo 다음 명령어로 커밋하고 푸시하세요:
echo   git commit -m "Initial commit: 구름 메모장 앱"
echo   git push -u origin master
echo.
pause

