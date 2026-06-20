package com.salesforce.tests;

import com.salesforce.pages.HomePage;
import com.salesforce.pages.LoginPage;
import com.salesforce.utils.DriverManager;
import org.testng.Assert;
import org.testng.annotations.Test;

public class LoginValidTest extends DriverManager {

    private static final String VALID_USERNAME = "your-valid-email@domain.com";
    private static final String VALID_PASSWORD = "YourValidPassword123!";

    @Test
    public void verifySuccessfulLoginWithValidCredentials() {
        LoginPage loginPage = new LoginPage(driver, wait);
        HomePage homePage = new HomePage(driver, wait);

        try {
            loginPage.doLogin(VALID_USERNAME, VALID_PASSWORD);
            Assert.assertTrue(homePage.isOnDashboard(), "URL did not redirect away from login page after valid login");
            Assert.assertTrue(homePage.isLoaded(), "Salesforce dashboard global header not visible after valid login");
        } catch (Exception e) {
            Assert.fail("Valid login test failed with exception: " + e.getMessage());
        }
    }
}
