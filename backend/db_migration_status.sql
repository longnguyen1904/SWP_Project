-- =====================================================
-- DB Migration: Vendor Status + Product Status
-- Database: TALLT_SoftwareMarket
-- =====================================================
-- Chạy script này trước khi khởi động ứng dụng mới.
-- Script an toàn để chạy nhiều lần (có kiểm tra IF).
-- =====================================================

-- =====================================================
-- 1. VENDORS TABLE: Thay IsVerified + IsActive bằng Status
-- =====================================================

-- 1a. Thêm cột Status (nếu chưa tồn tại)
-- Giá trị: PENDING, APPROVED, REJECTED
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'TALLT_SoftwareMarket' 
    AND TABLE_NAME = 'Vendors' 
    AND COLUMN_NAME = 'Status');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE Vendors ADD COLUMN Status VARCHAR(20) NOT NULL DEFAULT ''PENDING''',
    'SELECT ''Column Vendors.Status already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1b. Thêm cột RejectionNote (nếu chưa tồn tại)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'TALLT_SoftwareMarket' 
    AND TABLE_NAME = 'Vendors' 
    AND COLUMN_NAME = 'RejectionNote');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE Vendors ADD COLUMN RejectionNote TEXT NULL',
    'SELECT ''Column Vendors.RejectionNote already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1c. Migrate dữ liệu cũ từ IsVerified/IsActive sang Status
-- Nếu IsVerified = 1 => APPROVED
-- Nếu IsVerified = 0 AND IsActive = 0 => REJECTED  
-- Nếu IsVerified = 0 AND IsActive = 1 => PENDING (mặc định)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'TALLT_SoftwareMarket' 
    AND TABLE_NAME = 'Vendors' 
    AND COLUMN_NAME = 'IsVerified');

SET @sql = IF(@col_exists > 0,
    'UPDATE Vendors SET Status = CASE 
        WHEN IsVerified = 1 THEN ''APPROVED''
        WHEN IsVerified = 0 AND IsActive = 0 THEN ''REJECTED''
        ELSE ''PENDING''
    END WHERE Status = ''PENDING'' OR Status IS NULL',
    'SELECT ''Column IsVerified not found, skipping migration''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1d. Xóa cột cũ (TÙY CHỌN - chạy SAU khi đã kiểm tra dữ liệu đúng)
-- Bỏ comment nếu muốn xóa cột cũ:
-- ALTER TABLE Vendors DROP COLUMN IsVerified;
-- ALTER TABLE Vendors DROP COLUMN IsActive;

-- =====================================================
-- 2. PRODUCTS TABLE: Thay IsApproved bằng Status
-- =====================================================

-- 2a. Thêm cột Status (nếu chưa tồn tại)
-- Giá trị: DRAFT, PENDING, APPROVED, REJECTED
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'TALLT_SoftwareMarket' 
    AND TABLE_NAME = 'Products' 
    AND COLUMN_NAME = 'Status');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE Products ADD COLUMN Status VARCHAR(20) NOT NULL DEFAULT ''DRAFT''',
    'SELECT ''Column Products.Status already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2b. Thêm cột RejectionNote (nếu chưa tồn tại)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'TALLT_SoftwareMarket' 
    AND TABLE_NAME = 'Products' 
    AND COLUMN_NAME = 'RejectionNote');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE Products ADD COLUMN RejectionNote TEXT NULL',
    'SELECT ''Column Products.RejectionNote already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2c. Migrate dữ liệu cũ từ IsApproved sang Status
-- Nếu IsApproved = 1 => APPROVED
-- Nếu IsApproved = 0 => DRAFT (mặc định)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'TALLT_SoftwareMarket' 
    AND TABLE_NAME = 'Products' 
    AND COLUMN_NAME = 'IsApproved');

SET @sql = IF(@col_exists > 0,
    'UPDATE Products SET Status = CASE 
        WHEN IsApproved = 1 THEN ''APPROVED''
        ELSE ''DRAFT''
    END WHERE Status = ''DRAFT'' OR Status IS NULL',
    'SELECT ''Column IsApproved not found, skipping migration''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2d. Xóa cột cũ (TÙY CHỌN - chạy SAU khi đã kiểm tra dữ liệu đúng)
-- Bỏ comment nếu muốn xóa cột cũ:
-- ALTER TABLE Products DROP COLUMN IsApproved;

-- =====================================================
-- KẾT THÚC MIGRATION
-- =====================================================
-- Sau khi chạy script này, khởi động lại ứng dụng Spring Boot.
-- JPA sẽ tự map entity mới với cột Status.
-- =====================================================
