package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;

import com.tallt.marketplace.repository.LicenseRepository;

public class LicenseCleanupService {
    @Autowired
    private LicenseRepository licenseRepository;

    @Scheduled(cron = "0 0 0 * * ?")
    public void deleteExpiredLicenses() {

        int deleted = licenseRepository.deleteExpiredLicenses();

        System.out.println("Expired licenses deleted: " + deleted);
    }
}
