package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.service.VendorFollowerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class VendorFollowerController {

    @Autowired
    private VendorFollowerService vendorFollowerService;

    @PostMapping("/api/vendors/{vendorId}/follow")
    public ApiResponse<Map<String, Object>> toggleFollow(
            @PathVariable Integer vendorId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        Map<String, Object> result = vendorFollowerService.toggleFollow(userId, vendorId);
        return ApiResponse.success(result);
    }

    @GetMapping("/api/vendors/{vendorId}/follow/check")
    public ApiResponse<Map<String, Object>> checkFollow(
            @PathVariable Integer vendorId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        Map<String, Object> result = vendorFollowerService.checkFollow(userId, vendorId);
        return ApiResponse.success(result);
    }

    @GetMapping("/api/follow/my-vendors")
    public ApiResponse<List<Map<String, Object>>> getMyFollowedVendors(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        List<Map<String, Object>> result = vendorFollowerService.getMyFollowedVendors(userId);
        return ApiResponse.success(result);
    }
}

