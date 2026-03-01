package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.ProductDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeProductService {

    private final ProductRepository productRepository;

    public List<ProductDTO> getApprovedProducts() {

        List<Product> products = productRepository.findByStatus("PUBLISHED");

        return products.stream()
                .map(product -> new ProductDTO(
                        product.getProductName(),
                        product.getDescription(),
                        product.getBasePrice() != null
                                ? product.getBasePrice()
                                : null
                ))
                .toList();
    }
}
