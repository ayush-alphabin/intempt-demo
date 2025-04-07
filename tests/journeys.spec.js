const abPlaywright = require('alphabin-pw');
const { test, expect } = require('@playwright/test');
const { Canvas } = require('../components/canvas');

// Configure viewport and test timeout
test.use({
  actionTimeout: 30000,
  navigationTimeout: 30000,
  viewport: {
    width: 1440,
    height: 900
  }
});

test.beforeEach(async ({ page }) => {
  console.log('Starting test and navigating to Intempt app...');

  // Navigate to the application URL
  await page.goto('https://app.intempt.com/');
  await abPlaywright.setupLogging(page);
  // Verify login page is loaded correctly
  await expect(page.locator(`//p[normalize-space()='Login to your account']`)).toBeVisible();
  await expect(page).toHaveTitle(`Welcome to Intempt!`);

  await page.locator(`(//input[@placeholder='Enter your email'])[1]`).fill(`ayushm@aienger.com`);
  await page.locator(`input[name="password"]`).fill(`12qw!@QWIT`);

  await page.locator(`//button[normalize-space()='Login']`).click();

  console.log('Successfully logged in');

  // Navigate to Journeys
  const journeysButton = page.locator(`(//div[normalize-space()='Journeys'])[2]`);
  await journeysButton.waitFor({ state: 'visible', timeout: 30000 });
  await journeysButton.click();

  await page.waitForLoadState('domcontentloaded');
  await page.locator(`//p[normalize-space()='Create journey']`).waitFor({ state: 'visible', timeout: 30000 });
  await page.locator(`//p[normalize-space()='Create journey']`).click();

  await expect(page.locator(`//p[contains(text(),'We have two options for building your journey: ')]`)).toBeVisible({ timeout: 30000 });
  await page.locator(`//*[@src="/icons/actions/edit_Type=Fill.svg"]`).click();

  await expect(page.locator(`//p[normalize-space()='Edit name']`)).toBeVisible({ timeout: 30000 });
  await page.locator(`input[placeholder="Enter journey name"]`).fill(`Demo`);
  await page.waitForLoadState('domcontentloaded');

  await page.locator(`//p[normalize-space()='Save']`).click();

  await page.locator(`//p[normalize-space()="Create Journey"]`).waitFor({ state: 'visible', timeout: 30000 });
  await page.locator(`//p[normalize-space()="Create Journey"]`).click();
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator(`(//header//p)[1]`)).toHaveText(`Demo`);
});

test('Verify element drops on the canvas', async ({ page }) => {
  // Wait for canvas to load
  await page.waitForSelector('.x6-graph-scroller-content', { state: 'visible', timeout: 30000 });
  await page.waitForSelector('.x6-graph-svg', { state: 'visible', timeout: 30000 });

  const canvas = new Canvas(page);

  // Test data for different elements to drag
  const elements = [
    { type: 'OnCondition', text: 'On condition', x: 200, y: 200 },
    { type: 'SendEmail', text: 'Send email', x: 800, y: 200 }
  ];

  await test.step(`Drag and drop "${elements[0].text}" and configuring it`, async () => {
    console.log(`Configuring ${elements[0].text} element...`);

    await canvas.dragAndDrop(elements[0].text, elements[0].x, elements[0].y);
    await page.waitForLoadState();
    await canvas.assertElementOnCanvas(elements[0].type, elements[0].text);

    // Double-click element to open configuration
    const elementLocator = page.locator(`//*[contains(@data-cell-id,"${canvas.getElementPrefix(elements[0].type)}")]//*[contains(text(),"${elements[0].text}")]`);
    await elementLocator.click({ clickCount: 2 });

    await expect(page.locator(`//p[contains(text(), "Trigger - ")]`)).toBeVisible({ timeout: 20000 });

    // Configure the element - use Promise.all where it makes sense
    await page.locator(`input[placeholder="Select"]`).click();

    await page.locator(`//div[@role="menu"]//input[@placeholder="Search"]`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`//div[@role="menu"]//input[@placeholder="Search"]`).fill(`identify user`);

    await page.locator(`//p[contains(text(), "Identify user")]`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`//p[contains(text(), "Identify user")]`).click({ force: true });

    await page.locator(`//button//p[contains(text(), "Add condition group")]`).click({ force: true });

    await page.locator(`(//input[@placeholder="Select"])[2]`).click();
    await page.locator(`(//div[@role="menu"]//input[@placeholder="Search"])[2]`).fill(`source`);

    await page.locator(`(//div[@role="menuitem"]//p[normalize-space()="source"])[2]`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`(//div[@role="menuitem"]//p[normalize-space()="source"])[2]`).click({ force: true });

    await page.locator(`//div[@role="menuitem"]//p[normalize-space()="is"]`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`//div[@role="menuitem"]//p[normalize-space()="is"]`).click({ force: true });

    await page.locator(`input[placeholder="Select value(s)"]`).click();
    await page.locator(`//p[contains(text(),'newsletter_subscription')]/ancestor::label`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`//p[contains(text(),'newsletter_subscription')]/ancestor::label`).check();

    await page.waitForLoadState();
    await page.locator(`//p[normalize-space()="Add"]`).click({ force: true });

    await page.locator(`//p[contains(text(),'Include users that matched and will match the conditions')]`).click({ force: true });
    await page.locator(`//p[normalize-space()='Multiple']`).click({ force: true });

    await page.waitForLoadState();

    await page.locator(`//button[@type="button"]//p[contains(text(), "Save")]/../..`).click({ force: true });

    // Verify configuration modal is closed
    await expect(page.locator(`//p[contains(text(), "Trigger - ")]`)).not.toBeVisible({ timeout: 20000 });
    console.log(`${elements[0].text} element configured successfully`);
  });

  await test.step(`Drag and drop "${elements[1].text}" and configuring it`, async () => {
    console.log(`Configuring ${elements[1].text} element...`);

    await canvas.dragAndDrop(elements[1].text, elements[1].x, elements[1].y);
    await page.waitForLoadState();
    await canvas.assertElementOnCanvas(elements[1].type, elements[1].text);

    // Double-click element to open configuration
    const elementLocator = page.locator(`//*[contains(@data-cell-id,"${canvas.getElementPrefix(elements[1].type)}")]//*[contains(text(),"${elements[1].text}")]`);
    await elementLocator.click({ clickCount: 2 });

    await expect(page.locator(`//p[contains(text(), "Actions - ")]`)).toBeVisible({ timeout: 20000 });

    // Configure the element
    await page.locator(`//p[normalize-space()='Gmail Alphabin']`).click({ force: true });
    await page.locator(`input[placeholder="Select email"]`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`input[placeholder="Select email"]`).click();
    await page.waitForLoadState();
    await page.locator(`div[role="listbox"]`).waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.locator(`//p[normalize-space()='Demo Email']`).click({ force: true });
    await page.locator(`//p[normalize-space()='New thread']`).waitFor({ state: 'visible', timeout: 20000 });
    await page.locator(`//p[normalize-space()='New thread']`).click({ force: true });
    await page.locator(`//p[normalize-space()='General consent']`).click({ force: true });
    await expect(page.locator(`//p[contains(text(), "newsletter")]/../..`)).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState();
    await page.locator(`//p[contains(text(), "newsletter")]`).click({ force: true });
    await page.waitForLoadState();
    await page.locator(`//button[@type="button"]//p[contains(text(), "Save")]`).click();

    // Verify configuration modal is closed
    await expect(page.locator(`//p[contains(text(), "Actions - ")]`)).not.toBeVisible({ timeout: 20000 });
    console.log(`${elements[1].text} element configured successfully`);
  });

  await test.step('Connecting elements', async () => {
    console.log('Connecting elements...');
    await page.waitForTimeout(1000);
    await canvas.connectElements(elements[0], elements[1]);
    await canvas.assertEdgeExists(elements[0], elements[1]);
  });

  await test.step('Starting the journey', async () => {
    console.log('Starting journey...');
    await page.waitForTimeout(3000);
    await page.locator(`//button//p[contains(text(), "Start journey")]`).click();
    await expect(page.locator(`//div[@role='dialog']//div//div//p[contains(text(),'Start journey')]`)).toBeVisible({ timeout: 20000 });
    await page.locator(`//div[@role='dialog']/div/div[3]/button//p[contains(text(), "Start")]`).click();
    await expect(page.locator(`//p[normalize-space()='Demo']`)).not.toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(3000);
    await expect(page.locator(`//p[contains(text(), "Active")]/../..//span`)).toBeVisible({ timeout: 20000 });
    console.log('Journey started successfully');
  });

  await test.step('Verify the trigger', async () => {
    console.log('Verifying trigger...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.locator(`//p[normalize-space()="Delivered"]/following-sibling::p`).waitFor({ state: 'visible', timeout: 20000 });
    const deliveredCount = parseFloat(await page.locator(`//p[normalize-space()="Delivered"]/following-sibling::p`).textContent());
    console.log('Delivered count:', deliveredCount);
    expect(deliveredCount).toBeGreaterThan(0);
  });
});

test.afterEach(async ({ page }) => {
  const backButton = page.locator(`//*[contains(@src, "data:image/svg+xml,%3csvg%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M15.2178%205.46967C15.5107%205.76256%2015.5107%206.23744%2015.2178%206.53033L10.2784%2011.4697C9.98799%2011.7602%209.98799%2012.2398%2010.2784%2012.5303L15.2178%2017.4697C15.5107%2017.7626%2015.5107%2018.2374%2015.2178%2018.5303C14.9249%2018.8232%2014.4501%2018.8232%2014.1572%2018.5303L9.21777%2013.5909C8.34155%2012.7147%208.34155%2011.2853%209.21778%2010.4091L14.1572%205.46967C14.4501%205.17678%2014.9249%205.17678%2015.2178%205.46967Z'%20fill='%23030A19'/%3e%3c/svg%3e")]`);
  await backButton.waitFor({ state: 'visible', timeout: 20000 });
  await backButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.locator(`//td[normalize-space()="Demo"]/following-sibling::td[@class="text-center"]//button`).waitFor({ state: 'visible', timeout: 20000 });
  await page.locator(`//td[normalize-space()="Demo"]/following-sibling::td[@class="text-center"]//button`).click();
  await page.waitForLoadState('domcontentloaded');
  await page.locator(`//p[normalize-space()='Delete']`).waitFor({ state: 'visible', timeout: 20000 });
  await page.locator(`//p[normalize-space()='Delete']`).click();
  await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 20000 });
  await page.locator(`input[placeholder="Enter journey name here"]`).fill(`Demo`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator(`//p[contains(text(),'Delete journey')]//ancestor::span`).waitFor({ state: 'visible', timeout: 20000 });
  await page.locator(`//p[contains(text(),'Delete journey')]//ancestor::span`).click();
  await expect(page.locator(`//p[contains(text(),'Journey deleted successfully')]`)).toBeVisible({ timeout: 20000 });
  await page.close();
});
