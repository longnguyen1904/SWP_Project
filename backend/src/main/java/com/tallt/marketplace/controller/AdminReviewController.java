package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.AdminProductReviewDTO;
import com.tallt.marketplace.service.AdminReviewService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    @GetMapping("/review")

    public Page<AdminProductReviewDTO> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size);

        return adminReviewService
                .getAllProductsForReview(status, keyword, pageable);
    }

    @PostMapping("/review/{id}")
    public String reviewProduct(@PathVariable Integer id) {
        return adminReviewService.reviewProduct(id);
    }
}