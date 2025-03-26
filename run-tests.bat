@echo off
setlocal enabledelayedexpansion
title Playwright Test Runner
color 0A

echo Playwright Test Automation Suite
echo ==============================
echo.

:menu
echo Select an option:
echo 1. Run all tests
echo 2. Run smoke tests
echo 3. Run regression tests
echo 4. Run tests in headed mode
echo 5. Run with specific browser (Chrome/Firefox/Safari)
echo 6. Debug mode
echo 7. UI mode
echo 8. Generate report
echo 9. Exit
echo.

set /p choice=Enter your choice (1-9): 

if "%choice%"=="1" goto run_all
if "%choice%"=="2" goto run_smoke
if "%choice%"=="3" goto run_regression
if "%choice%"=="4" goto run_headed
if "%choice%"=="5" goto select_browser
if "%choice%"=="6" goto debug_mode
if "%choice%"=="7" goto ui_mode
if "%choice%"=="8" goto generate_report
if "%choice%"=="9" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:run_all
echo Running all tests...
npx playwright test
goto end_run

:run_smoke
echo Running smoke tests...
npx playwright test --grep @smoke
goto end_run

:run_regression
echo Running regression tests...
npx playwright test --grep @regression
goto end_run

:run_headed
echo Running tests in headed mode...
npx playwright test --headed
goto end_run

:select_browser
echo.
echo Select browser:
echo 1. Chrome
echo 2. Firefox
echo 3. Safari
echo.
set /p browser=Enter browser choice (1-3): 

if "%browser%"=="1" (
  echo Running tests in Chrome...
  npx playwright test --project=chromium
  goto end_run
)
if "%browser%"=="2" (
  echo Running tests in Firefox...
  npx playwright test --project=firefox
  goto end_run
)
if "%browser%"=="3" (
  echo Running tests in Safari...
  npx playwright test --project=webkit
  goto end_run
)

echo Invalid browser selection.
goto select_browser

:debug_mode
echo Running in debug mode...
npx playwright test --debug
goto end_run

:ui_mode
echo Running in UI mode...
npx playwright test --ui
goto end_run

:generate_report
echo Generating HTML report...
npx playwright show-report
goto end_run

:end_run
echo.
echo Tests completed!
echo.
pause
goto menu

:end
echo Exiting...
exit /b 0