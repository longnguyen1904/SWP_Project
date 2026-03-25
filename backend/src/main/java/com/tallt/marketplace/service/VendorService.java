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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
     * Get current user's vendor registration status
     */
    public Map<String, Object> getMyVendorStatus(Integer userId) {
        Optional<Vendor> vendorOpt = vendorRepository.findByUser_UserID(userId);
        if (vendorOpt.isEmpty()) {
            return Map.of("registered", false);
        }
        Vendor vendor = vendorOpt.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("registered", true);
        result.put("vendorId", vendor.getVendorID());
        result.put("status", vendor.getStatus().name());
        result.put("rejectionNote", vendor.getRejectionNote());
        result.put("companyName", vendor.getCompanyName());
        result.put("createdAt", vendor.getCreatedAt());
        result.put("verifiedAt", vendor.getVerifiedAt());
        return result;
    }

    /**
     * Register as a Vendor
     * - Check User exists & Role = Customer
     * - Create Vendors record (Status=PENDING)
     * - Role remains CUSTOMER until Admin approves
     * - Create Wallet for Vendor
     */
    private static final Pattern TAX_CODE_PATTERN = Pattern.compile("^\\d{10,13}$");

    @Transactional
    public VendorRegisterResponse registerVendor(Integer userId, VendorRegisterRequest request) {
        // 1. Check User exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User does not exist"));

        // 2. Check Role must be Customer
        if (user.getRole().getRoleID() != RoleConstant.CUSTOMER) {
            throw new AppException("Only Customers can register as a Vendor");
        }

        // 3. Check not already registered as Vendor
        Optional<Vendor> existingVendor = vendorRepository.findByUser_UserID(userId);
        if (existingVendor.isPresent()) {
            Vendor existing = existingVendor.get();
            if (existing.getStatus() == Vendor.VendorStatus.REJECTED) {
                // Allow re-registration: delete old rejected record
                vendorRepository.delete(existing);
                vendorRepository.flush();
            } else {
                throw new AppException("User has already registered as a Vendor");
            }
        }

        // 4. Validate type
        Vendor.VendorType vendorType;
        try {
            vendorType = Vendor.VendorType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Invalid vendor type. Accepted values: INDIVIDUAL or COMPANY");
        }

        // 5. If COMPANY then companyName is required
        if (vendorType == Vendor.VendorType.COMPANY &&
                (request.getCompanyName() == null || request.getCompanyName().isBlank())) {
            throw new AppException("Company name is required when vendor type is COMPANY");
        }

        // 6. Validate taxCode format (10-13 digits)
        if (request.getTaxCode() == null || !TAX_CODE_PATTERN.matcher(request.getTaxCode().trim()).matches()) {
            throw new AppException("Tax code must be 10-13 digits");
        }

        // 7. Validate identificationDoc URL
        if (request.getIdentificationDoc() == null ||
                (!request.getIdentificationDoc().startsWith("http://") &&
                 !request.getIdentificationDoc().startsWith("https://"))) {
            throw new AppException("Identification document must be a valid URL (http:// or https://)");
        }

        // 8. Create Vendor
        Vendor vendor = new Vendor();
        vendor.setUser(user);
        vendor.setType(vendorType);
        vendor.setCompanyName(request.getCompanyName());
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            vendor.setDescription(request.getDescription().trim());
        }
        vendor.setTaxCode(request.getTaxCode().trim());

        vendor.setIdentificationDoc(request.getIdentificationDoc().trim());
        vendor.setStatus(Vendor.VendorStatus.PENDING);
        vendorRepository.save(vendor);

        // Role remains unchanged (CUSTOMER) until Admin approves

        // 7. Create Wallet for Vendor (only if not already exists)
        if (walletRepository.findByUser_UserID(userId).isEmpty()) {
            Wallet wallet = new Wallet();
            wallet.setUser(user);
            walletRepository.save(wallet);
        }

        return new VendorRegisterResponse(
                vendor.getVendorID(),
                "PENDING_VERIFICATION",
                "Vendor registration submitted successfully"
        );
    }



    /**
     * Get list of Vendors with filter, search, paging, sort
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
                throw new AppException("Invalid vendor type");
            }
        }

        Vendor.VendorStatus vendorStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                vendorStatus = Vendor.VendorStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException("Invalid vendor status. Accepted values: PENDING, APPROVED, REJECTED");
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
     * Get Vendor by UserID
     */
    public Vendor getVendorByUserId(Integer userId) {
        return vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Vendor does not exist for this user"));
    }

    /**
     * Get Vendor by VendorID
     */
    public Vendor getVendorById(Integer vendorId) {
        return vendorRepository.findById(vendorId)
                .orElseThrow(() -> new AppException("Vendor does not exist"));
    }

    public VendorShopResponse getVendorShop(Integer vendorId) {
        Vendor vendor = getVendorById(vendorId);
        if (!Boolean.TRUE.equals(vendor.getIsActive())) {
            throw new AppException("Vendor does not exist");
        }

        VendorShopResponse response = new VendorShopResponse();
        response.setVendorId(vendor.getVendorID());
        response.setCompanyName(vendor.getCompanyName());
        response.setType(vendor.getType() != null ? vendor.getType().name() : null);
        response.setIsVerified(vendor.getIsVerified());
        response.setCreatedAt(vendor.getCreatedAt());
        response.setDescription(vendor.getDescription());

        String displayName = vendor.getCompanyName();
        if (displayName == null || displayName.isBlank()) {
            displayName = vendor.getUser() != null ? vendor.getUser().getFullName() : null;
        }
        response.setDisplayName(displayName);
        return response;
    }
    /**
     * Vendor resubmit identification after being suspended
     * - Status must be SUSPENDED
     * - Updates identificationDoc, sets status back to PENDING
     */
    @Transactional
    public Map<String, Object> resubmitIdentification(Integer userId, String identificationUrl) {
        Vendor vendor = vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Vendor does not exist for this user"));

        if (vendor.getStatus() != Vendor.VendorStatus.SUSPENDED) {
            throw new AppException("Only suspended vendors can resubmit identification");
        }

        if (identificationUrl == null || identificationUrl.trim().isEmpty()) {
            throw new AppException("Identification URL is required");
        }

        vendor.setIdentificationDoc(identificationUrl.trim());
        vendor.setStatus(Vendor.VendorStatus.PENDING);
        vendor.setRejectionNote(null);
        vendorRepository.save(vendor);

        return Map.of(
                "vendorId", vendor.getVendorID(),
                "status", vendor.getStatus().name(),
                "message", "Identification resubmitted successfully. Waiting for admin approval."
        );
    }
}
