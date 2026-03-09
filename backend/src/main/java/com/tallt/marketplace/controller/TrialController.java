package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.trial.TrialStartRequest;
import com.tallt.marketplace.dto.trial.TrialStartResponse;
import com.tallt.marketplace.service.TrialService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trials")
public class TrialController {

    @Autowired
    private TrialService trialService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<TrialStartResponse>> startTrial(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody TrialStartRequest request) {
        TrialStartResponse response = trialService.startTrial(userId, request.getProductId());
        return ResponseEntity.ok(ApiResponse.success("Start trial thành công", response));
    }
}
