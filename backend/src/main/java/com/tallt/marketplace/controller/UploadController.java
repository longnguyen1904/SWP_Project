package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Controller upload file lên Cloudinary
 * - Upload ảnh (image)
 * - Upload tài liệu (PDF, doc)
 */
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private CloudinaryService cloudinaryService;

    /**
     * Upload 1 ảnh
     * POST /api/upload/image
     * Content-Type: multipart/form-data
     * @param file file ảnh (jpg, png, gif, webp)
     * @return URL ảnh trên Cloudinary
     */
    @PostMapping("/image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        validateImageFile(file);
        String url = cloudinaryService.uploadFile(file, "marketplace/images");
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", Map.of("url", url)));
    }

    /**
     * Upload nhiều ảnh cùng lúc
     * POST /api/upload/images
     * Content-Type: multipart/form-data
     * @param files danh sách file ảnh
     * @return danh sách URL ảnh trên Cloudinary
     */
    @PostMapping("/images")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMultipleImages(
            @RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Phải chọn ít nhất 1 ảnh"));
        }
        if (files.size() > 10) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Tối đa 10 ảnh mỗi lần upload"));
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            validateImageFile(file);
            String url = cloudinaryService.uploadFile(file, "marketplace/images");
            urls.add(url);
        }

        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công",
                Map.of("urls", urls, "count", urls.size())));
    }

    /**
     * Upload tài liệu (PDF, doc)
     * POST /api/upload/document
     * Content-Type: multipart/form-data
     * @param file file tài liệu
     * @return URL tài liệu trên Cloudinary
     */
    @PostMapping("/document")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadDocument(
            @RequestParam("file") MultipartFile file) {
        validateDocumentFile(file);
        String url = cloudinaryService.uploadFile(file, "marketplace/documents");
        return ResponseEntity.ok(ApiResponse.success("Upload tài liệu thành công", Map.of("url", url)));
    }

    /**
     * Upload file cài đặt phần mềm (exe, zip, msi, ...) cho Product Version.
     * POST /api/upload/installer
     * @return URL file trên Cloudinary (vendor gửi URL này vào CreateVersionRequest.fileUrl).
     */
    @PostMapping("/installer")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadInstaller(
            @RequestParam("file") MultipartFile file) {
        validateInstallerFile(file);
        String url = cloudinaryService.uploadFile(file, "marketplace/installers");
        return ResponseEntity.ok(ApiResponse.success("Upload file cài đặt thành công", Map.of("url", url)));
    }

    private void validateInstallerFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new com.tallt.marketplace.exception.AppException("File không được để trống");
        }
        if (file.getSize() > 500 * 1024 * 1024) {
            throw new com.tallt.marketplace.exception.AppException("File cài đặt không được vượt quá 500MB");
        }
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            throw new com.tallt.marketplace.exception.AppException("Tên file không hợp lệ");
        }
        String lower = name.toLowerCase();
        if (!lower.endsWith(".exe") && !lower.endsWith(".zip") && !lower.endsWith(".msi")
                && !lower.endsWith(".dmg") && !lower.endsWith(".pkg") && !lower.endsWith(".jar")) {
            throw new com.tallt.marketplace.exception.AppException(
                    "Chỉ chấp nhận file cài đặt: exe, zip, msi, dmg, pkg, jar");
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new com.tallt.marketplace.exception.AppException("File không được để trống");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new com.tallt.marketplace.exception.AppException(
                    "File phải là ảnh (jpg, png, gif, webp). Loại file hiện tại: " + contentType);
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new com.tallt.marketplace.exception.AppException("Ảnh không được vượt quá 10MB");
        }
    }

    private void validateDocumentFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new com.tallt.marketplace.exception.AppException("File không được để trống");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf")
                && !contentType.equals("application/msword")
                && !contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
            throw new com.tallt.marketplace.exception.AppException(
                    "File phải là tài liệu (PDF, DOC, DOCX). Loại file hiện tại: " + contentType);
        }
        if (file.getSize() > 50 * 1024 * 1024) {
            throw new com.tallt.marketplace.exception.AppException("Tài liệu không được vượt quá 50MB");
        }
    }
}
