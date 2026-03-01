package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ProductDTO;
import com.tallt.marketplace.service.HomeProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeProductController {

    private final HomeProductService homeProductService;

    @GetMapping("/products")
    public List<ProductDTO> getHomeProducts() {
        return homeProductService.getApprovedProducts();
    }
}