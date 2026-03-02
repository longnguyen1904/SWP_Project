package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.Map;

@Service
public class VirusTotalService {

    @Value("${virustotal.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BASE_URL = "https://www.virustotal.com/api/v3";

    public boolean isFileMalicious(String filePath) {

        String analysisId = uploadFile(filePath);

        // Đợi VirusTotal xử lý (Free API khá chậm)
        try {
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return checkResultOnce(analysisId);
    }


    private String uploadFile(String filePath) {

        File file = new File(filePath);

        if (!file.exists()) {
            throw new RuntimeException("File not found: " + filePath);
        }

        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(file));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("x-apikey", apiKey);

        HttpEntity<LinkedMultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/files", request, Map.class);

        if (response.getBody() == null)
            throw new RuntimeException("VirusTotal response is null");

        Map<String, Object> bodyMap = response.getBody();
        Map<String, Object> data = (Map<String, Object>) bodyMap.get("data");

        if (data == null || data.get("id") == null)
            throw new RuntimeException("Cannot get analysis ID from VirusTotal");

        return data.get("id").toString();
    }

    private boolean checkResultOnce(String analysisId) {

        String url = BASE_URL + "/analyses/" + analysisId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        if (response.getBody() == null)
            throw new RuntimeException("VirusTotal analysis response is null");

        Map<String, Object> bodyMap = response.getBody();
        Map<String, Object> data = (Map<String, Object>) bodyMap.get("data");
        Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");
        Map<String, Object> stats = (Map<String, Object>) attributes.get("stats");

        Number malicious = (Number) stats.get("malicious");

        int maliciousCount = malicious != null ? malicious.intValue() : 0;

        System.out.println("Malicious engines: " + maliciousCount);

        return maliciousCount > 0;
    }
}