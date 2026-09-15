@echo off
echo =======================================
echo Pushing changes to GitHub (aasim06/rehmatlawnmowers)...
echo =======================================
git add .
git commit -m "Code update: %date% %time%"
git push origin main
echo.
echo =======================================
echo Done! Changes pushed to GitHub.
echo =======================================
pause
