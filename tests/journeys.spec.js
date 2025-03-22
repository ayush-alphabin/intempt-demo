const abPlaywright = require('alphabin-pw');
const { test, expect } = require('@playwright/test');

const prefixDataCellIdsOfDropped = {
  "Triggers": {
    OnCondition: 'onCondition-trigger',
    SpecificUsers: 'users-trigger'
  },
  "Actions": {
    SendEmail: 'sendEmail-action',
    SendSMS: 'sendSMS-action',
    SendWebhook: 'sendWebhook-action',
    SendSlackNotification: 'sendSlackNotification-action',
    UpdateAttribute: 'updateAttribute-action',
    SendEmailNotification: 'sendEmailNotification-action',
    CreateHubspotTask: 'createHubspotTask-action',
    AddToHubspotList: 'addToHubSpotList-action',
    UpdateHubspotProperty: 'updateHubSpotProperty-action',
  },
  "Controls": {
    Condition: 'condition-condition',
    Delay: 'delay-control',
    WaitUntil: 'waitUntil-control'
  }
};

class Canvas {
  constructor(page) {
    this.page = page;
    this.prefixDataCellIdsOfDropped = prefixDataCellIdsOfDropped;
  }

  async dragAndDrop(elementText, targetX, targetY) {
    console.log(`Starting drag and drop operation for "${elementText}"...`);

    // Get the draggable element using the exact structure from the Journeys module
    const element = this.page.locator(`//div[@draggable='true']//p[normalize-space()="${elementText}"]`);
    await element.waitFor({ state: 'visible', timeout: 10000 });

    // Get the canvas area (x6-graph-scroller is the canvas container in Journeys)
    const canvas = this.page.locator('.x6-graph-scroller');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    // Get element position
    const elementBox = await element.boundingBox();
    if (!elementBox) {
      throw new Error(`Could not find element with text "${elementText}"`);
    }

    // Perform the drag operation
    await element.hover();
    await this.page.mouse.down();
    await this.page.waitForTimeout(500); // Wait to ensure drag is initiated

    // Move to target position on canvas
    await canvas.hover({ position: { x: targetX, y: targetY } });
    await this.page.waitForTimeout(500); // Wait before release

    await this.page.mouse.up();
    await this.page.waitForTimeout(1000); // Wait for drop to complete

    console.log(`Completed drag and drop for "${elementText}"`);
  }

  getElementPrefix(elementType) {
    for (const category of Object.values(this.prefixDataCellIdsOfDropped)) {
      if (category[elementType]) {
        return category[elementType];
      }
    }
    throw new Error(`Unknown element type: ${elementType}`);
  }

  async assertElementOnCanvas(elementType, expectedContent, position = null) {
    console.log(`Verifying element "${elementType}" with content "${expectedContent}"`);

    const prefix = this.getElementPrefix(elementType);

    // Find all elements with this prefix
    const elements = this.page.locator(`g[data-cell-id^="${prefix}-"]`);

    // Wait for at least one element to be present
    await elements.first().waitFor({ state: 'visible', timeout: 5000 });

    // Get all matching elements
    const count = await elements.count();
    console.log(`Found ${count} elements with prefix ${prefix}`);

    // Find the element with matching content
    let found = false;
    for (let i = 0; i < count; i++) {
      const element = elements.nth(i);
      const content = await element.locator('div[class*="verticalSpacer"] + p').textContent();

      if (content.trim() === expectedContent.trim()) {
        found = true;
        console.log(`Found matching element at index ${i}`);
        break;
      }
    }

    expect(found).toBe(true, `Element "${elementType}" with content "${expectedContent}" not found on canvas`);
  }
}

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

test('Verify element drops on the canvas', async ({ page }) => {
  // Navigate to Journeys
  const journeysButton = page.locator(`(//div[normalize-space()='Journeys'])[2]`);
  await journeysButton.waitFor({ state: 'visible', timeout: 30000 });
  await journeysButton.click();

  const demoJourneyCell = page.locator('td.text-start:has-text("Demo Journey")');
  await demoJourneyCell.waitFor({ state: 'visible', timeout: 30000 });
  await demoJourneyCell.click();

  // Wait for canvas to load
  await page.waitForSelector('.x6-graph-scroller-content', { state: 'visible', timeout: 30000 });
  await page.waitForSelector('.x6-graph-svg', { state: 'visible', timeout: 30000 });

  const canvas = new Canvas(page);

  // Test data for different elements to drag
  const elements = [
    { type: 'OnCondition', text: 'On condition', x: 200, y: 200 },
    { type: 'SendSMS', text: 'Send SMS', x: 400, y: 200 }
  ];

  // Try dragging each element
  for (const element of elements) {
    await test.step(`Dragging element "${element.text}"`, async () => {
      await canvas.dragAndDrop(element.text, element.x, element.y);

      // Wait a moment to ensure the element is properly placed
      await page.waitForTimeout(1000);

      await canvas.assertElementOnCanvas(element.type, element.text);
    });
  }

  // Debug pause
  await page.waitForTimeout(5000);
});