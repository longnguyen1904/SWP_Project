package com.tallt.marketplace.service;

import com.tallt.marketplace.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;


@Service
public class VirusTotalService {


    @Value("${virustotal.api-key}")
    private String apiKey;


    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BASE_URL = "https://www.virustotal.com/api/v3";


    public boolean isUrlMalicious(String urlToScan) {
        String analysisId;
        try {
            analysisId = submitUrl(urlToScan);
        } catch (RestClientResponseException e) {
            String detail = e.getResponseBodyAsString();
            if (detail != null && detail.contains("canonicalize")) {
                throw new AppException("VirusTotal không chấp nhận URL (Unable to canonicalize url). Vui lòng dùng URL công khai hợp lệ (http/https).");
            }
            throw new AppException("VirusTotal không chấp nhận URL hoặc lỗi quét. Mã: " + e.getStatusCode());
        }

        try {
            Thread.sleep(10000); // đợi VirusTotal phân tích
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        try {
            return checkResultOnce(analysisId);
        } catch (RestClientResponseException e) {
            throw new AppException("VirusTotal không trả về kết quả quét. Mã: " + e.getStatusCode());
        }
    }


    // Gửi URL lên VirusTotal
    private String submitUrl(String urlToScan) {


        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("url", urlToScan);


        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("x-apikey", apiKey);


        HttpEntity<LinkedMultiValueMap<String, Object>> request =
                new HttpEntity<>(body, headers);


        ResponseEntity<Map> response =
                restTemplate.postForEntity(BASE_URL + "/urls", request, Map.class);


        if (response.getBody() == null)
            throw new AppException("VirusTotal không trả về dữ liệu.");

        Map<String, Object> bodyMap = response.getBody();
        Map<String, Object> data = (Map<String, Object>) bodyMap.get("data");


        if (data == null || data.get("id") == null)
            throw new AppException("VirusTotal không trả về ID phân tích.");


        return data.get("id").toString();
    }


    // Kiểm tra kết quả
    private boolean checkResultOnce(String analysisId) {


        String url = BASE_URL + "/analyses/" + analysisId;


        HttpHeaders headers = new HttpHeaders();
        headers.set("x-apikey", apiKey);


        HttpEntity<Void> request = new HttpEntity<>(headers);


        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.GET, request, Map.class);


        if (response.getBody() == null)
            throw new AppException("VirusTotal không trả về kết quả phân tích.");

        Map<String, Object> bodyMap = response.getBody();
        Map<String, Object> data = (Map<String, Object>) bodyMap.get("data");
        if (data == null)
            throw new AppException("VirusTotal thiếu dữ liệu phân tích.");
        Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");
        Map<String, Object> stats = attributes != null ? (Map<String, Object>) attributes.get("stats") : null;
        if (stats == null)
            throw new AppException("VirusTotal thiếu thống kê quét.");


        Number malicious = (Number) stats.get("malicious");
        int maliciousCount = malicious != null ? malicious.intValue() : 0;


        System.out.println("Malicious engines: " + maliciousCount);


        return maliciousCount > 0;
    }
}

