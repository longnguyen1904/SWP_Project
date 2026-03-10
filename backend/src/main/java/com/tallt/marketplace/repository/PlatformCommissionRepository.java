package com.tallt.marketplace.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tallt.marketplace.entity.PlatformCommission;

public interface PlatformCommissionRepository
        extends JpaRepository<PlatformCommission, Integer> {

    PlatformCommission findTopByOrderByEffectiveFromDesc();

}