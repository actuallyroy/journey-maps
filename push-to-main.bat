@echo off
setlocal enabledelayedexpansion

REM Check if the commit message is provided as a parameter
if "%~1"=="" (
    echo Please provide a commit message as a parameter.
    exit /b 1
)

REM Navigate to the directory of your Git repository
cd "C:\path\to\your\repository"

REM Ensure you are on the main branch
git checkout main

REM Add all changes, commit with the provided message, and push to main
git add .
git commit -m "%~1"
git push origin main

REM Exit the script
exit /b 0
