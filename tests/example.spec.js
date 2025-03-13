// Import required dependencies
const { test, expect } = require('@playwright/test');
const config = require('../playwright.config.js');
const { locators } = require('../globalLocators.js');
const abPlaywright = require("alphabin-pw");

// Setup test environment before each test
test.beforeEach(async ({ browser, page }) => {
  // Navigate to the application URL
  await page.goto('https://app.intempt.com/');
  await abPlaywright.setupLogging(page);

  // Verify login page is loaded correctly
  await expect(page.locator(`//p[normalize-space()='Login to your account']`)).toBeVisible();
  await expect(page).toHaveTitle(`Welcome to Intempt!`);

  // Perform login with credentials
  await page.locator(`(//input[@placeholder='Enter your email'])[1]`).fill(`ayushm@aienger.com`);
  await page.locator(`input[name="password"]`).fill(`12qw!@QWIT`);
  await page.locator(`//button[normalize-space()='Login']`).click();

  // Verify successful login by checking welcome message
  await expect(page.locator(`//div[normalize-space()='Hello, Ayush Alphabin']`))
    .toBeVisible({ timeout: 20000 });
});

/*
// Test case for experiment creation workflow
test('Verify that an experiment creation is successful', async ({ page }) => {
  // Step 1: Navigate to experiments section
  await page.locator(locators['Div with text  Experiments  2nd']).click();
  await expect(page.locator(locators['Div in Div']))
    .toBeVisible({ timeout: 20000 });
  await expect(page.locator(locators['Div in Div']))
    .toHaveText(`ExperimentsCreate experiment`);

  // Step 2: Initialize experiment creation
  await page.locator(locators['Span with text  Create experiment']).click();
  await page.locator(locators['Menu in Div']).click();

  // Step 3: Verify experiment creation form
  await expect(page.locator(locators['P in Form']))
    .toBeVisible({ timeout: 20000 });
  await expect(page.locator(locators['P in Form']))
    .toHaveText(`Create client-side experiment`);

  // Step 4: Fill experiment details
  await page.locator(locators['Input with text  Target page']).fill(`https://example.com`);
  await page.locator(locators['P with text  Create']).click();
  
  // Step 5: Verify experiment creation success
  await expect(page.locator(locators['P with text  Variant created successfully']))
    .toBeVisible({ timeout: 20000 });
  await expect(page.locator(locators['Span with text  Variant 1']))
    .toBeVisible({ timeout: 20000 });
  await expect(page).toHaveTitle(`Web Editor | Intempt`);

  // Step 6: Navigate through editor options
  await page.locator(locators['Div with text  elements']).click();
  await page.locator(locators['Div with text  styles']).click();
  await page.locator(locators['Span with text  Back']).click();

  // Step 7: Verify editor closure
  await expect(page.locator(locators['P with text  Web editor is closed']))
    .toBeVisible({ timeout: 20000 });
  await expect(page).toHaveTitle(`Experiment | Intempt`);

  // Step 8: Perform logout
  await page.locator(locators['Span with text  A A']).click();
  await page.locator(locators['P with text  Logout']).click();

  // Step 9: Verify successful logout
  await expect(page.locator(locators['P with text  Login to your account']))
    .toBeVisible({ timeout: 20000 });
  await expect(page).toHaveTitle(`Welcome to Intempt!`);
});
*/

// Test case for experiment variant modification
test('Experiment Variant Test', async ({ page }) => {
  // Step 1: Navigate to specific experiment
  await page.locator(locators['Div with text  Experiments  2nd']).click();
  await page.locator(locators['Cell in Tbody']).click();

  // Step 2: Verify experiment page loaded
  await expect(page.locator(locators['P with text  Demo Experiment']))
    .toBeVisible({ timeout: 20000 });

  // Step 3: Access variants section
  await page.locator(locators['Span with text  Variants']).click();
  await expect(page.locator(locators['P in Form_1']))
    .toBeVisible({ timeout: 20000 });

  // Step 4: Edit Variant B content
  await page.locator(locators['Span with text  Edit  1st']).click();
  
  // Handle iframe content editing
  const frameLocator = page.frameLocator(locators["Variant iFrame"]);
  
  // Edit navigation header
  await frameLocator.locator(locators["Navigation H1 inside iFrame"]).dblclick();
  await frameLocator.locator(locators["Navigation H1 inside iFrame"]).fill('Test Cpnnetn');
  await page.keyboard.press('Escape'); // Exit edit mode
  await page.waitForTimeout(500); // Wait for editor to stabilize

  // Step 5: Switch between variants
  await frameLocator.locator(locators["Hero Content H2 inside iFrame"]).click({ force: true });
  await page.locator(locators["Span Variant B"]).click();
  await page.locator(locators["Div in Div 3rd"]).click();
  await page.locator(locators["Span Variant A"]).click();

  // Step 6: Modify variant content
  await frameLocator.locator(locators["Div H2 in iframe"]).dblclick();
  await frameLocator.locator(locators["Div H2 in iframe"]).fill('Variant A UPDATED NAV H2');
  await page.keyboard.press('Escape'); // Exit edit mode
  await page.waitForTimeout(500); // Wait for editor to stabilize

  // Step 7: Publish changes
  await page.locator(locators["Publish button"]).click();

  // Step 8: Verify successful update
  await expect(page.locator(locators['P with text  Variant created successfully']))
    .toHaveText(`Variant updated successfully`);
});
