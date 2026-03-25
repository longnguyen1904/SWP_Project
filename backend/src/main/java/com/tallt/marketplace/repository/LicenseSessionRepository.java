package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.entity.LicenseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LicenseSessionRepository extends JpaRepository<LicenseSession, Integer> {
    Optional<LicenseSession> findByLicenseAndDeviceIdentifier(License license, String deviceIdentifier);
    int countByLicenseAndIsActiveTrue(License license);
    java.util.List<LicenseSession> findByLicenseAndIsActiveTrueOrderByLastActiveAsc(License license);
    java.util.List<LicenseSession> findByLicense_LicenseKey(String licenseKey);
}
