import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestDB {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/TALLT_SoftwareMarket";
        String user = "root";
        String pass = "root";

        try {
            Connection conn = DriverManager.getConnection(url, user, pass);
            Statement stmt = conn.createStatement();
            // Get the latest 5 licenses to see what format was actually generated
            ResultSet rs = stmt.executeQuery("SELECT license_key, is_active FROM license ORDER BY licenseid DESC LIMIT 5;");
            while(rs.next()) {
                System.out.println("Key: " + rs.getString("license_key") + " | Active: " + rs.getBoolean("is_active"));
            }
            conn.close();
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}
