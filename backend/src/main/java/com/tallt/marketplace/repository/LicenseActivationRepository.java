package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.LicenseActivation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LicenseActivationRepository extends JpaRepository<LicenseActivation, Integer> {
}
