package com.tallt.marketplace.controller;

import java.security.SecureRandom;

public class LicenseKeyGenerator {
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    public static String generateKey(Integer productID) {

        StringBuilder key = new StringBuilder();

        for (int group = 0; group < 4; group++) {

            StringBuilder id = new StringBuilder();
            if (productID < 10) {
                id.append("0").append(productID) ;  
            }else {id.append(productID) ; }

            if (group > 0)
                key.append(id).append("-");

            for (int i = 0; i < 4; i++) {
                key.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
        }

        return key.toString();
    }
}
