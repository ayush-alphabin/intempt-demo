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

    // Get the canvas area
    const canvas = this.page.locator('section .x6-graph-scroller');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    // Get element and canvas positions
    const elementBox = await element.boundingBox();
    const canvasBox = await canvas.boundingBox();
    
    if (!elementBox || !canvasBox) {
      throw new Error(`Could not find element with text "${elementText}" or canvas`);
    }

    // Calculate source and target coordinates
    const sourceX = elementBox.x + elementBox.width / 2;
    const sourceY = elementBox.y + elementBox.height / 2;
    const targetXPos = canvasBox.x + targetX;
    const targetYPos = canvasBox.y + targetY;

    try {
      // Trigger dragstart event via JavaScript
      await element.evaluate((el) => {
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0
        });
        el.dispatchEvent(dragStartEvent);
      });

      // Perform the drag operation with force options
      await this.page.mouse.move(sourceX, sourceY);
      await element.hover({ force: true, timeout: 5000 });
      await this.page.mouse.down();
      await this.page.waitForTimeout(1000); // Increased wait time

      // Move to target position in small steps for better stability
      const steps = 15; // Increased number of steps
      const deltaX = (targetXPos - sourceX) / steps;
      const deltaY = (targetYPos - sourceY) / steps;

      for (let i = 1; i <= steps; i++) {
        await this.page.mouse.move(
          sourceX + deltaX * i,
          sourceY + deltaY * i,
          { steps: 1 }
        );
        await this.page.waitForTimeout(100); // Increased step delay
      }

      // Ensure we're at the final position
      await this.page.mouse.move(targetXPos, targetYPos);
      await this.page.waitForTimeout(1000);
      await this.page.mouse.up();

      // Trigger drop event via JavaScript
      await canvas.evaluate((el, { x, y }) => {
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        el.dispatchEvent(dropEvent);
      }, { x: targetX, y: targetY });

      // Wait for any animations or state updates to complete
      await this.page.waitForTimeout(2000);

    } catch (error) {
      console.error('Error during drag and drop:', error);
      throw error;
    }

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
    const maxAttempts = 3;
    let attempt = 0;
    let found = false;

    while (attempt < maxAttempts && !found) {
      try {
        // Find all elements with this prefix
        const elements = this.page.locator(`g[data-cell-id^="${prefix}-"]`);
        
        // Wait for elements to be present with increased timeout
        await elements.first().waitFor({ 
          state: 'visible', 
          timeout: 10000 
        });

        // Get all matching elements
        const count = await elements.count();
        console.log(`Found ${count} elements with prefix ${prefix}`);

        // Find the element with matching content
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          await element.waitFor({ state: 'visible', timeout: 5000 });
          
          try {
            const content = await element.locator('div[class*="verticalSpacer"] + p').textContent();
            if (content.trim() === expectedContent.trim()) {
              found = true;
              console.log(`Found matching element at index ${i}`);
              break;
            }
          } catch (error) {
            console.log(`Error getting content for element ${i}:`, error);
          }
        }

        if (found) break;
        
      } catch (error) {
        console.log(`Attempt ${attempt + 1} failed:`, error);
      }

      attempt++;
      if (!found && attempt < maxAttempts) {
        console.log(`Retrying verification... Attempt ${attempt + 1}`);
        await this.page.waitForTimeout(2000);
      }
    }

    expect(found).toBe(true, `Element "${elementType}" with content "${expectedContent}" not found on canvas after ${maxAttempts} attempts`);
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