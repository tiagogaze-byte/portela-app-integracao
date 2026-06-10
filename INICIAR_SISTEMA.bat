@echo off
echo ===================================================
echo        INICIANDO O SISTEMA PORTELA.APP
echo ===================================================
echo.
echo Por favor, nao feche esta janela.
echo O seu navegador vai abrir automaticamente em instantes...
echo.

:: Aguarda 3 segundos antes de abrir o navegador para dar tempo do servidor iniciar
start "" "http://localhost:3001"

:: Inicia o servidor do projeto
npm run dev
