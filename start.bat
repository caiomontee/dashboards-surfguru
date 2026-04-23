@echo off
echo Iniciando SurfGuru Dashboard...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"
echo Servidores iniciados!
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
