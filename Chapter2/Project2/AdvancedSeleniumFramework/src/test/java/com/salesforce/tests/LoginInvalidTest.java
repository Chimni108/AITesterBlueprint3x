package com.salesforce.tests;

import com.salesforce.pages.LoginPage;
import com.salesforce.utils.DriverManager;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class LoginInvalidTest extends DriverManager {

    private static final String LOGIN_URL = "https://login.salesforce.com/?locale=in";
    private static final String VALID_EMAIL = "your-valid-email@domain.com";
    private static final String VALID_PASSWORD = "YourValidPassword123!";
    private static final String WRONG_PASSWORD = "WrongPassword999!";
    private static final String INVALID_EMAIL_FORMAT = "not-an-email@@format";
    private static final String UNREGISTERED_EMAIL = "notregistered@unknown-domain.com";

    @BeforeMethod
    public void navigateToLoginPage() {
        driver.get(LOGIN_URL);
    }

    @Test
    public void verifyLoginWithWrongPassword() {
        LoginPage loginPage = new LoginPage(driver, wait);
        try {
            loginPage.doLogin(VALID_EMAIL, WRONG_PASSWORD);
            Assert.assertTrue(loginPage.isErrorDisplayed(), "Error message not displayed for wrong password");
        } catch (Exception e) {
            Assert.fail("Wrong password test failed with exception: " + e.getMessage());
        }
    }

    @Test
    public void verifyLoginWithInvalidEmailFormat() {
        LoginPage loginPage = new LoginPage(driver, wait);
        try {
            loginPage.doLogin(INVALID_EMAIL_FORMAT, VALID_PASSWORD);
            Assert.assertTrue(loginPage.isErrorDisplayed(), "Error message not displayed for invalid email format");
        } catch (Exception e) {
            Assert.fail("Invalid email format test failed with exception: " + e.getMessage());
        }
    }

    @Test
    public void verifyLoginWithUnregisteredEmail() {
        LoginPage loginPage = new LoginPage(driver, wait);
        try {
            loginPage.doLogin(UNREGISTERED_EMAIL, VALID_PASSWORD);
            Assert.assertTrue(loginPage.isErrorDisplayed(), "Error message not displayed for unregistered email");
        } catch (Exception e) {
            Assert.fail("Unregistered email test failed with exception: " + e.getMessage());
        }
    }

    @Test
    public void verifyLoginWithEmptyUsername() {
        LoginPage loginPage = new LoginPage(driver, wait);
        try {
            loginPage.doLogin("", VALID_PASSWORD);
            Assert.assertTrue(loginPage.isErrorDisplayed(), "Error message not displayed for empty username");
        } catch (Exception e) {
            Assert.fail("Empty username test failed with exception: " + e.getMessage());
        }
    }

    @Test
    public void verifyLoginWithEmptyCredentials() {
        LoginPage loginPage = new LoginPage(driver, wait);
        try {
            loginPage.doLogin("", "");
            Assert.assertTrue(loginPage.isErrorDisplayed(), "Error message not displayed for empty credentials");
        } catch (Exception e) {
            Assert.fail("Empty credentials test failed with exception: " + e.getMessage());
        }
    }
}
