package com.tallt.marketplace;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class UpdateDB {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/TALLT_SoftwareMarket?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true", 
                "root", "root"
            );
            Statement stmt = conn.createStatement();
            int rows = stmt.executeUpdate("UPDATE ProductVersions SET FileUrl = 'http://localhost:5173/AppDesktop1.zip' WHERE ProductID = 1");
            System.out.println("Updated " + rows + " rows successfully!");
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
