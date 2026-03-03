@echo off
REM Marketplace Backend Docker Setup Script for Windows (Remote MySQL VPS)
REM This script sets up Docker environment connecting to remote MySQL VPS and runs Code First schema generation

echo 🚀 Setting up Marketplace Backend Docker Environment (Remote MySQL VPS - Port 8081)...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo � Building and starting Docker container with remote MySQL connection...

REM Stop any existing containers
docker-compose down

REM Build and start application (connects to remote MySQL VPS)
docker-compose up --build -d

echo ⏳ Waiting for application to start...
timeout /t 30 /nobreak >nul

REM Check if application is ready and can connect to remote database
echo 🔍 Checking application health and database connection...
:check_app
curl -f http://localhost:8081/actuator/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Application not ready yet... waiting...
    timeout /t 10 /nobreak >nul
    goto check_app
)

echo ✅ Application is ready and connected to remote MySQL VPS!

echo.
echo 🎉 Setup complete! Your service is running:
echo 📱 Spring Boot Application: http://localhost:8081
echo 🗄️  Remote MySQL VPS: 42.96.18.227:3306
echo 📚 Swagger UI: http://localhost:8081/swagger-ui/index.html
echo.
echo 📋 Remote Database Connection Info:
echo    Host: 42.96.18.227
echo    Port: 3306
echo    Database: TALLT_SoftwareMarket
echo    Username: root
echo    Password: MySQLStrong!Passw0rd
echo.
echo 🔧 Code First Schema Generation:
echo    - JPA/Hibernate will auto-generate tables
echo    - Schema updates based on Entity classes
echo    - Check application logs for DDL statements
echo.
echo 🔧 Useful Commands:
echo    View logs: docker-compose logs -f marketplace-app
echo    Stop service: docker-compose down
echo    Restart service: docker-compose restart
echo    Access container: docker-compose exec marketplace-app bash
echo.
pause
