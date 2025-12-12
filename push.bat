@echo off
setlocal enabledelayedexpansion

REM =============================================================================
REM Smart Push Script for Ouse Passar Monorepo (Windows)
REM =============================================================================
REM This script automatically pushes changes to the correct repositories based
REM on which packages were modified in the commits.
REM
REM Repositories:
REM   - packages/site    -^> https://github.com/deviuno/site-ouse
REM   - packages/questoes -^> https://github.com/deviuno/Ouse-Questoes
REM =============================================================================

echo ========================================
echo    Ouse Passar - Smart Push Script
echo ========================================
echo.

REM Check if we're in a git repository
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo Error: Not a git repository
    exit /b 1
)

REM Get changed files
for /f "delims=" %%i in ('git diff --name-only origin/main...HEAD 2^>nul') do set "CHANGES=!CHANGES! %%i"
if "!CHANGES!"=="" (
    for /f "delims=" %%i in ('git diff --name-only HEAD~1 HEAD') do set "CHANGES=!CHANGES! %%i"
)

REM Check which packages have changes
set SITE_CHANGED=0
set QUESTOES_CHANGED=0

echo !CHANGES! | findstr /C:"packages/site/" >nul && set SITE_CHANGED=1
echo !CHANGES! | findstr /C:"packages/questoes/" >nul && set QUESTOES_CHANGED=1

echo Analyzing changes...
echo.

REM Push to origin (monorepo) first
echo [1/3] Pushing to origin (monorepo)...
git push origin main 2>nul
if errorlevel 1 (
    echo   - origin/main already up to date or error
) else (
    echo   + origin/main updated
)
echo.

REM Push to site repository if site package changed
echo [2/3] Checking site package...
if !SITE_CHANGED!==1 (
    echo   Site changes detected, pushing to site-ouse...
    git push site main 2>nul
    if errorlevel 1 (
        echo   - Trying force push...
        git push site main --force
    )
    echo   + site-ouse updated
) else (
    echo   - No changes in packages/site
)
echo.

REM Push to questoes repository if questoes package changed
echo [3/3] Checking questoes package...
if !QUESTOES_CHANGED!==1 (
    echo   Questoes changes detected, pushing to Ouse-Questoes...
    git push questoes main 2>nul
    if errorlevel 1 (
        echo   - Trying force push...
        git push questoes main --force
    )
    echo   + Ouse-Questoes updated
) else (
    echo   - No changes in packages/questoes
)

echo.
echo ========================================
echo    Push completed!
echo ========================================

endlocal
