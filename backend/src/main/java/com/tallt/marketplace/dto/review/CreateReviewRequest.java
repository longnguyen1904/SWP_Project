package com.tallt.marketplace.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReviewRequest {
    @NotNull(message = "Rating is required")
    @Min(1)
    @Max(5)
    private Integer rating;

    private String comment;
}
