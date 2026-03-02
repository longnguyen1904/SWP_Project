package com.tallt.marketplace.dto.review;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Integer reviewId;
    private Integer userId;
    private String fullName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
