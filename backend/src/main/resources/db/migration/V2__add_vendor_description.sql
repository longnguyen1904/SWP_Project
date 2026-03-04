-- Vendor Registration: mô tả doanh nghiệp / sản phẩm (tùy chọn)
-- Chạy nếu không dùng spring.jpa.hibernate.ddl-auto=update
ALTER TABLE Vendors ADD COLUMN Description TEXT NULL;
