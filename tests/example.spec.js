const { test, expect } = require('@playwright/test');
const config = require('../playwright.config.js');
const { locators } = require('../globalLocators.js');
const abPlaywright = require("alphabin-pw");

// Create test fixtures to handle setup/teardown
test.beforeEach(async ({ browser, page }) => {
  await page.goto('https://app.intempt.com/');
  await abPlaywright.setupLogging(page);
  
  // Login process
  await expect(page.locator(`//p[normalize-space()='Login to your account']`)).toBeVisible();
  await expect(page).toHaveTitle(`Welcome to Intempt!`);
  
  await page.locator(`(//input[@placeholder='Enter your email'])[1]`).fill(`ayushm@aienger.com`);
  await page.locator(`input[name="password"]`).fill(`12qw!@QWIT`);
  await page.locator(`//button[normalize-space()='Login']`).click();
  
  await expect(page.locator(`//div[normalize-space()='Hello, Ayush Alphabin']`))
    .toBeVisible({ timeout: 20000 });
});

// No need for afterEach as Playwright handles it automatically with fixtures

test('Verify that an experiment creation is successful', async ({ page }) => {
  // Navigate to experiments
  await page.locator(locators['Div with text  Experiments  2nd']).click();
  await expect(page.locator(locators['Div in Div']))
    .toBeVisible({ timeout: 20000 });
  await expect(page.locator(locators['Div in Div']))
    .toHaveText(`ExperimentsCreate experiment`);
  
  // Create experiment
  await page.locator(locators['Span with text  Create experiment']).click();
  await page.locator(locators['Menu in Div']).click();
  
  await expect(page.locator(locators['P in Form']))
    .toBeVisible({ timeout: 20000 });
  await expect(page.locator(locators['P in Form']))
    .toHaveText(`Create client-side experiment`);
  
  await page.locator(locators['Input with text  Target page']).fill(`https://example.com`);
  await page.locator(locators['P with text  Create']).click();
  
  // Verify success
  await expect(page.locator(locators['P with text  Variant created successfully']))
    .toBeVisible({ timeout: 20000 });
  await expect(page.locator(locators['Span with text  Variant 1']))
    .toBeVisible({ timeout: 20000 });
  await expect(page).toHaveTitle(`Web Editor | Intempt`);
  
  // Navigate through editor
  await page.locator(locators['Div with text  elements']).click();
  await page.locator(locators['Div with text  styles']).click();
  await page.locator(locators['Span with text  Back']).click();
  
  await expect(page.locator(locators['P with text  Web editor is closed']))
    .toBeVisible({ timeout: 20000 });
  await expect(page).toHaveTitle(`Experiment | Intempt`);
  
  // Logout
  await page.locator(locators['Span with text  A A']).click();
  await page.locator(locators['P with text  Logout']).click();
  
  await expect(page.locator(locators['P with text  Login to your account']))
    .toBeVisible({ timeout: 20000 });
  await expect(page).toHaveTitle(`Welcome to Intempt!`);
});

test.only('Experiment Variant Test', async ({ page }) => {
  // Navigate to experiment
  await page.locator(locators['Div with text  Experiments  2nd']).click();
  await page.locator(locators['Cell in Tbody']).click();
  
  await expect(page.locator(locators['P with text  Demo Experiment']))
    .toBeVisible({ timeout: 20000 });
  
  // Navigate to variants
  await page.locator(locators['Span with text  Variants']).click();
  await expect(page.locator(locators['P in Form_1']))
    .toBeVisible({ timeout: 20000 });
  
  // Edit variant
  await page.locator(locators['Span with text  Edit  1st']).click();

  // Work with iframe content
  const frameLocator = page.frameLocator('.body-content > iframe');
  await frameLocator.locator('nav > h1').dblclick();
  await frameLocator.locator('nav > h1').fill('Test Cpnnetn');

  // Exit edit mode
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500); // Reduced wait time

  // Click element in iframe
  await frameLocator.locator('.hero-content > h2').click({ force: true });

  // Publish changes
  await page.locator(`//p[normalize-space()='Publish']`).click();

  // Verify success
  await expect(page.locator(locators['P with text  Variant created successfully']))
    .toHaveText(`Variant updated successfully`);
});