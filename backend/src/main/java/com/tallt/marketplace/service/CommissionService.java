package com.tallt.marketplace.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import com.tallt.marketplace.entity.PlatformCommission;
import com.tallt.marketplace.repository.PlatformCommissionRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommissionService {

    private final PlatformCommissionRepository commissionRepository;

    public PlatformCommission setCommission(BigDecimal percent) {

        PlatformCommission commission = new PlatformCommission();

        commission.setPercentage(percent);
        commission.setEffectiveFrom(LocalDateTime.now());

        return commissionRepository.save(commission);
    }

    public BigDecimal getCurrentCommission() {

        PlatformCommission commission =
                commissionRepository.findTopByOrderByEffectiveFromDesc();

        if (commission == null) {
            return BigDecimal.ZERO;
        }

        return commission.getPercentage();
    }
}