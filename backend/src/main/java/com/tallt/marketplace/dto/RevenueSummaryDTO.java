package com.tallt.marketplace.dto;
import java.math.BigDecimal;

public record RevenueSummaryDTO(
    BigDecimal totalRevenue,
    Long totalOrders
) {}

