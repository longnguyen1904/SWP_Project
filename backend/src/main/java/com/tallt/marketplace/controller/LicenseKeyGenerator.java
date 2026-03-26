package com.tallt.marketplace.controller;

import java.security.SecureRandom;

public class LicenseKeyGenerator {
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    public static String generateKey(Integer productID) {
        StringBuilder key = new StringBuilder();

        // 1. Luôn ghép productID ở đầu tiên (đảm bảo 2 ký tự)
        if (productID < 10) {
            key.append("0").append(productID);  
        } else {
            key.append(productID); 
        }
        key.append("-");

        // 2. Sinh 4 cụm ký tự ngẫu nhiên (mỗi cụm 4 ký tự)
        for (int group = 0; group < 4; group++) {
            if (group > 0) {
                key.append("-");
            }
            for (int i = 0; i < 4; i++) {
                key.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
        }

        return key.toString();
    }
}
