# Marketplace Backend - Remote MySQL VPS (Port 8081)

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed
- At least 2GB RAM available
- **Remote MySQL VPS accessible** at 42.96.18.227:3306

### Setup Instructions

#### Windows
```bash
# Navigate to backend directory
cd "d:\Apps\Github_Repo\SWP_Project\backend"

# Run setup script
.\setup.bat
```

#### Linux/Mac
```bash
# Navigate to backend directory
cd "d:\Apps\Github_Repo\SWP_Project\backend"

# Make script executable and run
chmod +x setup.sh
./setup.sh
```

#### Manual Setup
```bash
# Build and start container
docker-compose up --build -d

# Check logs
docker-compose logs -f
```

## 🌐 Access Points

| Service | URL | Port |
|---------|-----|------|
| **Spring Boot App** | http://localhost:8081 | 8081 |
| **Remote MySQL VPS** | 42.96.18.227:3306 | 3306 |
| **Swagger UI** | http://localhost:8081/swagger-ui/index.html | 8081 |

## 📋 Database Connection

| Property | Value |
|----------|-------|
| Host | 42.96.18.227 |
| Port | 3306 |
| Database | TALLT_SoftwareMarket |
| Username | root |
| Password | MySQLStrong!Passw0rd |

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure as needed:

```bash
# Spring Boot
SPRING_PROFILES_ACTIVE=docker
SERVER_PORT=8081

# Remote MySQL VPS Database
SPRING_DATASOURCE_URL=jdbc:mysql://42.96.18.227:3306/TALLT_SoftwareMarket?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=MySQLStrong!Passw0rd

# JPA Code First
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=true

# VNPay (for payment integration)
VNPAY_TMN_CODE=1A1WQ9ZN
VNPAY_HASH_SECRET=HFWWS0H1PTNNWO8C114AIRI5CR1RA9DP

# Cloudinary (for image storage)
CLOUDINARY_CLOUD_NAME=dk1911sqa
CLOUDINARY_API_KEY=461427875698879
CLOUDINARY_API_SECRET=UQuOUmhoApo-hy2qauyBDKY9ujQ
```

## 🐳 Docker Services

### Services Overview
- **marketplace-app**: Spring Boot application connecting to remote MySQL VPS
- **Code First**: JPA/Hibernate auto-generates database schema
- **Health Checks**: Application and remote database connectivity

### Port Configuration
- **Backend**: 8081 (application port)
- **Remote MySQL**: 3306 (VPS MySQL port)

### Code First Schema Generation
- **Auto-generation**: Tables created from Entity classes
- **Schema Updates**: `ddl-auto: update` for automatic migrations
- **Logging**: DDL statements visible in application logs

## 🛠️ Useful Commands

```bash
# View application logs
docker-compose logs -f marketplace-app

# View database connection logs
docker-compose logs -f marketplace-app | grep -i "database\|sql\|hibernate"

# Stop service
docker-compose down

# Restart service
docker-compose restart

# Access application container
docker-compose exec marketplace-app bash

# Rebuild application
docker-compose up --build -d marketplace-app

# Check database connection from container
docker-compose exec marketplace-app curl -f http://localhost:8081/actuator/health
```

## 📊 Health Checks & Monitoring

The setup includes automated health checks:

1. **Application Health**: Spring Boot actuator endpoint must return 200 OK
2. **Database Connectivity**: Tests connection to remote MySQL VPS
3. **Schema Generation**: Monitors JPA/Hibernate DDL operations

## 🏗️ Code First Database Approach

### Entity-Driven Schema
- **Entity Classes**: Define database structure in Java
- **JPA Annotations**: `@Entity`, `@Table`, `@Column`, `@Id`, etc.
- **Relationships**: `@ManyToOne`, `@OneToMany`, `@JoinColumn`
- **Auto-generation**: Hibernate creates/updates tables automatically

### Schema Management
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # Auto-generate/update schema
    show-sql: true      # Show DDL statements in logs
```

### Available Entities
- **User**: User accounts and authentication
- **Product**: Software product listings
- **ProductVersion**: Product versions and files
- **Order**: Purchase orders and transactions
- **Role**: User roles and permissions

## 🔍 Troubleshooting

### Common Issues

1. **Remote Database Connection**: Ensure VPS MySQL is accessible and credentials are correct
2. **Network Connectivity**: Check if Docker can reach 42.96.18.227:3306
3. **Schema Generation**: Verify Entity classes and JPA annotations
4. **Permission Issues**: Ensure MySQL user has proper privileges

### Database Connection Test
```bash
# Test connection from host machine
mysql -h 42.96.18.227 -P 3306 -u root -p TALLT_SoftwareMarket

# Test from Docker container
docker-compose exec marketplace-app bash
curl -f http://localhost:8081/actuator/health
```

### Schema Generation Verification
```bash
# View DDL statements in logs
docker-compose logs -f marketplace-app | grep -i "create table\|alter table"

# Check generated tables
mysql -h 42.96.18.227 -P 3306 -u root -p -e "SHOW TABLES FROM TALLT_SoftwareMarket;"
```

### Reset Application
```bash
# Stop and remove container
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Monitor startup
docker-compose logs -f marketplace-app
```

## 🚀 Production Deployment

For production deployment, consider:
1. **Database Security**: Use SSL connections and proper credentials
2. **Schema Management**: Consider `validate` instead of `update` for production
3. **Backups**: Implement database backup strategies
4. **Monitoring**: Add comprehensive logging and health monitoring
5. **Network Security**: Configure firewall rules for database access
