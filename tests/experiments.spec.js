const { test, expect } = require('@playwright/test');
const abPlaywright = require("alphabin-pw");

// Define selectors
const selectors = {
  // Login related selectors
  loginAccountText: `//p[normalize-space()='Login to your account']`,
  emailInput: `(//input[@placeholder='Enter your email'])[1]`,
  passwordInput: `input[name="password"]`,
  loginButton: `//button[normalize-space()='Login']`,
  welcomeMessage: `//div[normalize-space()='Hello, Ayush Alphabin']`,

  // Navigation and common elements
  experimentsLink: `//div//p[text()="Experiments"]`,
  firstTableCell: `tbody tr:first-child td:first-child`,
  demoExperimentTitle: `//p[contains(text(), 'Demo Experiment')]`,
  variantsTab: `[value="variants"]`,
  formTitle: `form > div:nth-of-type(2) > p:nth-of-type(1)`,
  editButton: `(//span[normalize-space()='Edit'])[1]`,

  // iFrame related selectors
  variantIframe: 'iframe[src*="api.intempt.com"]',
  navH1: 'nav > h1.logo',
  heroH2: '.hero-content h2',
  idInput: `//div[contains(text(),' id')]/..//input`,

  // Variant controls
  variantB: `//span[contains(text(), 'Variant B')]`,
  variantA: `//span[contains(text(), 'Variant A')]`,
  divInDiv3rd: `//div[contains(@class, 'v-list-item')][3]`,

  // Action buttons
  publishButton: `//p[normalize-space()='Publish']`,
  successMessage: `//p[contains(text(), ' Variant updated successfully ')]`
};

// Setup test environment before each test
test.beforeEach(async ({ browser, page }) => {
  // Navigate to the application URL
  await page.goto('https://app.intempt.com/');
  await abPlaywright.setupLogging(page);

  // Verify login page is loaded correctly
  await expect(page.locator(selectors.loginAccountText)).toBeVisible();
  await expect(page).toHaveTitle(`Welcome to Intempt!`);

  // Perform login with credentials
  await page.locator(selectors.emailInput).fill(`ayushm@aienger.com`);
  await page.locator(selectors.passwordInput).fill(`12qw!@QWIT`);
  await page.locator(selectors.loginButton).click();

  // Verify successful login by checking welcome message
  await expect(page.locator(selectors.welcomeMessage))
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
  await page.locator(selectors.experimentsLink).click();
  await page.locator(selectors.firstTableCell).click();

  // Step 2: Verify experiment page loaded
  await expect(page.locator(selectors.demoExperimentTitle))
    .toBeVisible({ timeout: 20000 });

  // Step 3: Access variants section
  await page.locator(selectors.variantsTab).click();
  await expect(page.locator(selectors.formTitle))
    .toBeVisible({ timeout: 20000 });

  // Step 4: Edit Variant B content
  await page.locator(selectors.editButton).click();

  // Handle iframe content editing
  const frameLocator = page.frameLocator(selectors.variantIframe);

  // Edit navigation header with shadow DOM handling
  const navH1 = frameLocator.locator(selectors.navH1);
  await navH1.waitFor({ state: 'visible' });
  await navH1.hover();
  await page.waitForTimeout(100);
  await navH1.click({ clickCount: 1 });
  await page.waitForTimeout(100);
  await navH1.click({ clickCount: 2 });
  await page.waitForTimeout(100);
  await navH1.click({ clickCount: 3 });
  await page.waitForTimeout(100);
  await navH1.pressSequentially('Test Var A', { delay: 100 });

  // Step 7: Publish changes
  const publishBtn = page.locator(selectors.publishButton);
  await page.waitForTimeout(500);
  await publishBtn.click({force: true});
  await page.waitForTimeout(1000);

  // Step 8: Verify successful update
  await expect(page.locator(selectors.successMessage))
    .toBeVisible();
});
