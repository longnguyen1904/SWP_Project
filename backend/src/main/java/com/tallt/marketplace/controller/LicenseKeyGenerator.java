package com.tallt.marketplace.controller;


import java.security.SecureRandom;

import com.tallt.marketplace.entity.Order;
public class LicenseKeyGenerator {
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();
    

    public static String generateKey() {
        Order order = new Order() ;  
        StringBuilder key = new StringBuilder();

        for (int group = 0; group < 4; group++) {

            if (group > 0) key.append(order.getProduct().getProductID()).append("-");

            for (int i = 0; i < 4; i++) {
                key.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
        }

        return  key.toString();
    }
}
