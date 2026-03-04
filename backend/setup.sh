#!/bin/bash

# Marketplace Backend Docker Setup Script for Linux/Mac (Remote MySQL VPS)
# This script sets up Docker environment connecting to remote MySQL VPS and runs Code First schema generation

echo "🚀 Setting up Marketplace Backend Docker Environment (Remote MySQL VPS - Port 8081)..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "� Building and starting Docker container with remote MySQL connection..."

# Stop any existing containers
docker-compose down

# Build and start application (connects to remote MySQL VPS)
docker-compose up --build -d

echo "⏳ Waiting for application to start..."
sleep 30

# Check if application is ready and can connect to remote database
echo "🔍 Checking application health and database connection..."
while ! curl -f http://localhost:8081/actuator/health &> /dev/null; do
    echo "Application not ready yet... waiting..."
    sleep 10
done

echo "✅ Application is ready and connected to remote MySQL VPS!"

echo ""
echo "🎉 Setup complete! Your service is running:"
echo "📱 Spring Boot Application: http://localhost:8081"
echo "🗄️  Remote MySQL VPS: 42.96.18.227:3306"
echo "📚 Swagger UI: http://localhost:8081/swagger-ui/index.html"
echo ""
echo "📋 Remote Database Connection Info:"
echo "   Host: 42.96.18.227"
echo "   Port: 3306"
echo "   Database: TALLT_SoftwareMarket"
echo "   Username: root"
echo "   Password: MySQLStrong!Passw0rd"
echo ""
echo "🔧 Code First Schema Generation:"
echo "   - JPA/Hibernate will auto-generate tables"
echo "   - Schema updates based on Entity classes"
echo "   - Check application logs for DDL statements"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose logs -f marketplace-app"
echo "   Stop service: docker-compose down"
echo "   Restart service: docker-compose restart"
echo "   Access container: docker-compose exec marketplace-app bash"
echo ""
