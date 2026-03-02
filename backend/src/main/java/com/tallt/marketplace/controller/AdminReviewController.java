package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.AdminProductReviewDTO;
import com.tallt.marketplace.service.AdminReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    @GetMapping("/review")
    public List<AdminProductReviewDTO> getProducts() {
        return adminReviewService.getAllProductsForReview();
    }

    @PostMapping("/review/{id}")
    public String reviewProduct(@PathVariable Integer id) {
        return adminReviewService.reviewProduct(id);
    }
}