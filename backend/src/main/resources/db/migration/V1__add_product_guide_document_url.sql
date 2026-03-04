-- US02: Tài liệu hướng dẫn sản phẩm
-- Chạy nếu không dùng spring.jpa.hibernate.ddl-auto=update
ALTER TABLE Products ADD COLUMN GuideDocumentUrl VARCHAR(500) NULL;
