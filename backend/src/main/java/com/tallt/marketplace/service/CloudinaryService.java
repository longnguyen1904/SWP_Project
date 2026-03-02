package com.tallt.marketplace.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.tallt.marketplace.exception.AppException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload file lên Cloudinary
     * @param file MultipartFile (image hoặc PDF)
     * @param folder thư mục trên Cloudinary (VD: "products/images", "vendors/docs")
     * @return URL public của file đã upload
     */
    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new AppException("File không được để trống");
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto"
            ));
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
