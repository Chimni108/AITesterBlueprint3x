package com.salesforce.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class HomePage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    @FindBy(xpath = "//div[contains(@class,'oneHeader')]")
    private WebElement globalHeader;

    @FindBy(xpath = "//button[contains(@class,'branding-userProfile-button')]")
    private WebElement userProfileButton;

    public HomePage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
        PageFactory.initElements(driver, this);
    }

    public boolean isLoaded() {
        try {
            wait.until(ExpectedConditions.visibilityOf(globalHeader));
            return globalHeader.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isOnDashboard() {
        try {
            wait.until(ExpectedConditions.not(
                ExpectedConditions.urlContains("login.salesforce.com")
            ));
            return driver.getCurrentUrl().contains("salesforce.com");
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isUserProfileVisible() {
        try {
            wait.until(ExpectedConditions.visibilityOf(userProfileButton));
            return userProfileButton.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
