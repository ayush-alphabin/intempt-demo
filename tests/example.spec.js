const { locators } = require('../globalLocators.js');
const { test, expect } = require('@playwright/test');
const playwright = require('playwright');
const abPlaywright = require("alphabin-pw");
const config = require('../playwright.config.js');
let browser, page;

test.beforeEach(async () => {
	browser = await playwright[config.projects[0].name].launch(config.use);
	page = await browser.newPage();
	await page.goto('https://app.intempt.com/');
	await abPlaywright.setupLogging(page);
	await expect(page.locator(`//p[normalize-space()='Login to your account']`)).toHaveText(`Login to your account`);
	await expect(page).toHaveTitle(`Welcome to Intempt!`);
	await page.locator(`(//input[@placeholder='Enter your email'])[1]`).click();
	await page.locator(`(//input[@placeholder='Enter your email'])[1]`).fill(`ayushm@aienger.com`);
	await page.locator(`(//input[@placeholder='Enter your email'])[1]`).press(`Tab`);
	await page.locator(`input[name="password"]`).fill(`12qw!@QWIT`);
	await page.locator(`//button[normalize-space()='Login']`).click();
	await page.locator(`//div[normalize-space()='Hello, Ayush Alphabin']`).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(`//div[normalize-space()='Hello, Ayush Alphabin']`)).toHaveText(`Hello, Ayush Alphabin`);
});

test.afterEach(async () => {
	await browser.close();
});


// Auto generated test case
test('Verify that an experiment creation is successful', async () => {
	await abPlaywright.setupLogging(page);

	await page.locator(locators['Div with text  Experiments  2nd']).click();
	await page.locator(locators['Div in Div']).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(locators['Div in Div'])).toHaveText(`ExperimentsCreate experiment`);
	await page.locator(locators['Span with text  Create experiment']).click();
	await page.locator(locators['Menu in Div']).click();
	await page.locator(locators['P in Form']).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(locators['P in Form'])).toHaveText(`Create client-side experiment`);
	await page.locator(locators['Input with text  Target page']).click();
	await page.locator(locators['Input with text  Target page']).fill(`https://example.com`);
	await page.locator(locators['P with text  Create']).click();
	await page.locator(locators['P with text  Variant created successfully']).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(locators['P with text  Variant created successfully'])).toHaveText(`Variant created successfully`);
	await page.locator(locators['Span with text  Variant 1']).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(locators['Span with text  Variant 1'])).toHaveText(`Variant 1`);
	await expect(page).toHaveTitle(`Web Editor | Intempt`);
	await page.locator(locators['Div with text  elements']).click();
	await page.locator(locators['Div with text  styles']).click();
	await page.locator(locators['Span with text  Back']).click();
	await page.locator(locators['P with text  Web editor is closed']).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(locators['P with text  Web editor is closed'])).toHaveText(`Web editor is closed`);
	await expect(page).toHaveTitle(`Experiment | Intempt`);
	await page.locator(locators['Span with text  A A']).click();
	await page.locator(locators['P with text  Logout']).click();
	await page.locator(locators['P with text  Login to your account']).waitFor({ state: "visible", timeout: 20000 });
	await expect(page.locator(locators['P with text  Login to your account'])).toHaveText(`Login to your account`); await page.close();
	await expect(page).toHaveTitle(`Welcome to Intempt!`);
});