package com.tallt.marketplace.service;

import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.VendorFollower;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.repository.VendorFollowerRepository;
import com.tallt.marketplace.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VendorFollowerService {

    @Autowired
    private VendorFollowerRepository vendorFollowerRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Map<String, Object> toggleFollow(Integer userId, Integer vendorId) {
        if (userId == null) {
            throw new AppException("You must be logged in to follow a vendor");
        }

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new AppException("Vendor does not exist"));

        // Không cho vendor tự follow chính mình
        if (vendor.getUser().getUserID().equals(userId)) {
            throw new AppException("You cannot follow your own shop");
        }

        boolean wasFollowing = vendorFollowerRepository
                .existsByUser_UserIDAndVendor_VendorID(userId, vendorId);

        if (wasFollowing) {
            vendorFollowerRepository.findByUser_UserIDAndVendor_VendorID(userId, vendorId)
                    .ifPresent(vendorFollowerRepository::delete);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException("User does not exist"));

            VendorFollower follower = new VendorFollower();
            follower.setUser(user);
            follower.setVendor(vendor);
            vendorFollowerRepository.save(follower);
        }

        long newCount = vendorFollowerRepository.countByVendor_VendorID(vendorId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("following", !wasFollowing);
        result.put("followerCount", newCount);
        return result;
    }

    public Map<String, Object> checkFollow(Integer userId, Integer vendorId) {
        boolean following = false;
        if (userId != null) {
            following = vendorFollowerRepository
                    .existsByUser_UserIDAndVendor_VendorID(userId, vendorId);
        }
        long count = vendorFollowerRepository.countByVendor_VendorID(vendorId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("following", following);
        result.put("followerCount", count);
        return result;
    }

    public List<Map<String, Object>> getMyFollowedVendors(Integer userId) {
        if (userId == null) return List.of();

        List<VendorFollower> follows = vendorFollowerRepository.findByUser_UserID(userId);
        List<Map<String, Object>> list = new java.util.ArrayList<>();

        for (VendorFollower vf : follows) {
            Vendor v = vf.getVendor();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("vendorId", v.getVendorID());
            item.put("companyName", v.getCompanyName());
            item.put("displayName", v.getUser() != null ? v.getUser().getFullName() : "Vendor");
            item.put("type", v.getType().name());
            item.put("followedAt", vf.getCreatedAt());
            list.add(item);
        }
        return list;
    }
}
