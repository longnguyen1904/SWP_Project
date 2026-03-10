package com.tallt.marketplace.controller;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.tallt.marketplace.entity.PlatformCommission;
import com.tallt.marketplace.service.CommissionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/commission")
@RequiredArgsConstructor
public class CommissionController {

    private final CommissionService commissionService;

    @PostMapping("/set")
    public ResponseEntity<?> setCommission(@RequestParam BigDecimal percent) {

        PlatformCommission commission =
                commissionService.setCommission(percent);

        return ResponseEntity.ok(commission);
    }

    @GetMapping
    public ResponseEntity<?> getCommission() {

        return ResponseEntity.ok(
                commissionService.getCurrentCommission());
    }
}