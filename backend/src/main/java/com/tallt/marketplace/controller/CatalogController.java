package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.entity.Category;
import com.tallt.marketplace.entity.Tag;
import com.tallt.marketplace.repository.CategoryRepository;
import com.tallt.marketplace.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * API public cho dropdown filter: categories, tags (programming languages).
 */
@RestController
@RequestMapping("/api")
public class CatalogController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TagRepository tagRepository;

    @GetMapping("/categories")
    public ApiResponse<List<Category>> getCategories() {
        List<Category> list = categoryRepository.findAll();
        if (list == null) {
            list = new ArrayList<>();
        }
        return ApiResponse.success(list);
    }

    @GetMapping("/tags")
    public ApiResponse<List<Tag>> getTags() {
        List<Tag> list = tagRepository.findAll();
        if (list == null) {
            list = new ArrayList<>();
        }
        return ApiResponse.success(list);
    }
}
