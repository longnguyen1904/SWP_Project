package com.tallt.marketplace.service;

import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.vendor.VendorRegisterRequest;
import com.tallt.marketplace.dto.vendor.VendorRegisterResponse;
import com.tallt.marketplace.dto.vendor.VendorShopResponse;
import com.tallt.marketplace.dto.vendor.VendorVerifyRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Wallet;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private WalletRepository walletRepository;

    /**
     * Đăng ký trở thành Vendor
     * - Kiểm tra User tồn tại & Role = Customer
     * - Tạo bản ghi Vendors (IsVerified=0, IsActive=1)
     * - Cập nhật Users.RoleID = 2 (Vendor)
     * - Tạo Wallet cho Vendor
     */
    @Transactional
    public VendorRegisterResponse registerVendor(Integer userId, VendorRegisterRequest request) {
        // 1. Kiểm tra User tồn tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        // 2. Kiểm tra Role phải là Customer
        if (user.getRole().getRoleID() != RoleConstant.CUSTOMER) {
            throw new AppException("Chỉ Customer mới có thể đăng ký làm Vendor");
        }

        // 3. Kiểm tra chưa đăng ký Vendor
        if (vendorRepository.existsByUser_UserID(userId)) {
            throw new AppException("User đã đăng ký Vendor trước đó");
        }

        // 4. Validate type
        Vendor.VendorType vendorType;
        try {
            vendorType = Vendor.VendorType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Loại vendor không hợp lệ. Chỉ chấp nhận: INDIVIDUAL hoặc COMPANY");
        }

        // 5. Nếu COMPANY thì companyName bắt buộc
        if (vendorType == Vendor.VendorType.COMPANY &&
                (request.getCompanyName() == null || request.getCompanyName().isBlank())) {
            throw new AppException("Tên công ty không được để trống khi loại vendor là COMPANY");
        }

        // 6. Tạo Vendor
        Vendor vendor = new Vendor();
        vendor.setUser(user);
        vendor.setType(vendorType);
        vendor.setCompanyName(request.getCompanyName());
        vendor.setTaxCode(request.getTaxCode());
        vendor.setCitizenID(request.getCitizenId());
        vendor.setIdentificationDoc(request.getIdentificationDoc());
        vendor.setStatus(Vendor.VendorStatus.PENDING);
        vendorRepository.save(vendor);

        // 7. Cập nhật Role thành Vendor
        Role vendorRole = roleRepository.findById(RoleConstant.VENDOR)
                .orElseThrow(() -> new AppException("Role Vendor không tồn tại trong hệ thống"));
        user.setRole(vendorRole);
        userRepository.save(user);

        // 8. Tạo Wallet cho Vendor
        Wallet wallet = new Wallet();
        wallet.setUser(user);
        walletRepository.save(wallet);

        return new VendorRegisterResponse(
                vendor.getVendorID(),
                "PENDING_VERIFICATION",
                "Vendor registration submitted successfully"
        );
    }

    /**
     * Admin duyệt/từ chối Vendor
     * - Nếu approved: Status=APPROVED, VerifiedAt=now()
     * - Nếu rejected: Status=REJECTED, lưu rejection note
     */
    @Transactional
    public Map<String, Object> verifyVendor(Integer vendorId, VendorVerifyRequest request) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

        if (vendor.getStatus() == Vendor.VendorStatus.APPROVED) {
            throw new AppException("Vendor đã được xác thực trước đó");
        }

        Vendor.VendorStatus newStatus;
        try {
            newStatus = Vendor.VendorStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái không hợp lệ. Chỉ chấp nhận: APPROVED hoặc REJECTED");
        }

        if (newStatus != Vendor.VendorStatus.APPROVED && newStatus != Vendor.VendorStatus.REJECTED) {
            throw new AppException("Trạng thái không hợp lệ. Chỉ chấp nhận: APPROVED hoặc REJECTED");
        }

        vendor.setStatus(newStatus);
        if (newStatus == Vendor.VendorStatus.APPROVED) {
            vendor.setVerifiedAt(LocalDateTime.now());
        } else {
            vendor.setRejectionNote(request.getNote());
        }
        vendorRepository.save(vendor);

        return Map.of(
                "vendorId", vendor.getVendorID(),
                "status", vendor.getStatus().name(),
                "note", request.getNote() != null ? request.getNote() : ""
        );
    }

    /**
     * Lấy danh sách Vendor với filter, search, paging, sort
     */
    public PageResponse<Vendor> getVendors(String search, String status, String type,
                                           int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Vendor.VendorType vendorType = null;
        if (type != null && !type.isBlank()) {
            try {
                vendorType = Vendor.VendorType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException("Loại vendor không hợp lệ");
            }
        }

        Vendor.VendorStatus vendorStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                vendorStatus = Vendor.VendorStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException("Trạng thái vendor không hợp lệ. Chỉ chấp nhận: PENDING, APPROVED, REJECTED");
            }
        }

        Page<Vendor> vendorPage = vendorRepository.findAllWithFilters(search, vendorStatus, vendorType, pageable);

        PageResponse<Vendor> response = new PageResponse<>();
        response.setContent(vendorPage.getContent());
        response.setPage(vendorPage.getNumber());
        response.setSize(vendorPage.getSize());
        response.setTotalElements(vendorPage.getTotalElements());
        response.setTotalPages(vendorPage.getTotalPages());
        response.setLast(vendorPage.isLast());
        return response;
    }

    /**
     * Lấy Vendor theo UserID
     */
    public Vendor getVendorByUserId(Integer userId) {
        return vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Vendor không tồn tại cho user này"));
    }

    /**
     * Lấy Vendor theo VendorID
     */
    public Vendor getVendorById(Integer vendorId) {
        return vendorRepository.findById(vendorId)
                .orElseThrow(() -> new AppException("Vendor không tồn tại"));
    }

    public VendorShopResponse getVendorShop(Integer vendorId) {
        Vendor vendor = getVendorById(vendorId);
        if (!Boolean.TRUE.equals(vendor.getIsActive())) {
            throw new AppException("Vendor không tồn tại");
        }

        VendorShopResponse response = new VendorShopResponse();
        response.setVendorId(vendor.getVendorID());
        response.setCompanyName(vendor.getCompanyName());
        response.setType(vendor.getType() != null ? vendor.getType().name() : null);
        response.setIsVerified(vendor.getIsVerified());
        response.setCreatedAt(vendor.getCreatedAt());

        String displayName = vendor.getCompanyName();
        if (displayName == null || displayName.isBlank()) {
            displayName = vendor.getUser() != null ? vendor.getUser().getFullName() : null;
        }
        response.setDisplayName(displayName);
        return response;
    }
}
