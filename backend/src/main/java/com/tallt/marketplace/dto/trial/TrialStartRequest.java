package com.tallt.marketplace.dto.trial;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TrialStartRequest {

    @NotNull
    private Integer productId;
}
