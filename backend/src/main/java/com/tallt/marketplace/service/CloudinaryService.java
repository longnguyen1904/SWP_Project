package com.tallt.marketplace.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.tallt.marketplace.exception.AppException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload file lên Cloudinary
     * @param file MultipartFile (image hoặc raw file)
     * @param folder thư mục trên Cloudinary
     * @return URL public của file đã upload
     */
    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new AppException("File không được để trống");
        }

        try {
            Map<String, Object> options = new HashMap<>();
            options.put("folder", folder);
            options.put("resource_type", "auto");

            // Giữ tên file gốc (+ extension) trong URL
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && !originalFilename.isBlank()) {
                String suffix = UUID.randomUUID().toString().substring(0, 8);
                String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._\\-]", "_");
                int dot = safeName.lastIndexOf('.');
                if (dot > 0) {
                    safeName = safeName.substring(0, dot) + "_" + suffix + safeName.substring(dot);
                } else {
                    safeName = safeName + "_" + suffix;
                }
                options.put("public_id", safeName);
            }

            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new AppException("Lỗi upload file: " + e.getMessage());
        }
    }

    /**
     * Xóa file trên Cloudinary theo public_id
     */
    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new AppException("Lỗi xóa file: " + e.getMessage());
        }
    }
}
