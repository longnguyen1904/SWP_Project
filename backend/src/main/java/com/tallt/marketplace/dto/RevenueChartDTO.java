package com.tallt.marketplace.dto;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueChartDTO(
    LocalDate date,
    BigDecimal revenue
) {}

