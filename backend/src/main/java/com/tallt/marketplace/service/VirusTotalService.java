package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.Map;

@Service
public class VirusTotalService {

    @Value("${virustotal.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BASE_URL = "https://www.virustotal.com/api/v3";

    public boolean isFileMalicious(String filePathOrUrl) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("VirusTotal API key is missing");
        }
        if (filePathOrUrl == null || filePathOrUrl.isBlank()) {
            throw new RuntimeException("File URL/path is empty");
        }
        String normalized = filePathOrUrl.trim().toLowerCase();
        if (normalized.contains("drive.google.com/drive/folders/")) {
            throw new RuntimeException("Google Drive folder URL is not a scannable file. Use a direct file URL.");
        }

        String analysisId = isHttpUrl(filePathOrUrl)
                ? analyzeUrl(filePathOrUrl)
                : uploadFile(filePathOrUrl);
        return pollResult(analysisId);
    }

    private boolean isHttpUrl(String value) {
        if (value == null) return false;
        String normalized = value.trim().toLowerCase();
        return normalized.startsWith("http://") || normalized.startsWith("https://");
    }

    private String analyzeUrl(String targetUrl) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-apikey", apiKey);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("url", targetUrl);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/urls", request, Map.class);
        return extractAnalysisId(response.getBody());
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
        return extractAnalysisId(response.getBody());
    }

    private String extractAnalysisId(Map<String, Object> bodyMap) {
        if (bodyMap == null) {
            throw new RuntimeException("VirusTotal response is null");
        }

        Map<String, Object> data = (Map<String, Object>) bodyMap.get("data");
        if (data == null || data.get("id") == null) {
            throw new RuntimeException("Cannot get analysis ID from VirusTotal");
        }

        return data.get("id").toString();
    }

    private boolean pollResult(String analysisId) {
        int maxAttempts = 6;
        long delayMs = 5000;
        for (int i = 0; i < maxAttempts; i++) {
            AnalysisResult result = checkResult(analysisId);
            if (result.completed) {
                System.out.println("Malicious engines: " + result.maliciousCount);
                return result.maliciousCount > 0;
            }
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        throw new RuntimeException("VirusTotal analysis timeout for id: " + analysisId);
    }

    private AnalysisResult checkResult(String analysisId) {
        String url = BASE_URL + "/analyses/" + analysisId;
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-apikey", apiKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        if (response.getBody() == null) {
            throw new RuntimeException("VirusTotal analysis response is null");
        }

        Map<String, Object> bodyMap = response.getBody();
        Map<String, Object> data = (Map<String, Object>) bodyMap.get("data");
        Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");
        Map<String, Object> stats = (Map<String, Object>) attributes.get("stats");
        String status = attributes.get("status") != null ? attributes.get("status").toString() : "";

        Number malicious = (Number) stats.get("malicious");
        int maliciousCount = malicious != null ? malicious.intValue() : 0;
        boolean completed = "completed".equalsIgnoreCase(status);

        return new AnalysisResult(completed, maliciousCount);
    }

    private static final class AnalysisResult {
        private final boolean completed;
        private final int maliciousCount;

        private AnalysisResult(boolean completed, int maliciousCount) {
            this.completed = completed;
            this.maliciousCount = maliciousCount;
        }
    }
}
