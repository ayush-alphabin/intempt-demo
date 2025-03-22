const abPlaywright = require('alphabin-pw');
const { test, expect } = require('@playwright/test');

// Configure viewport and test timeout
test.use({ 
  viewport: { width: 1920, height: 1080 },
  actionTimeout: 30000,
  navigationTimeout: 30000
});

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

    // Get the draggable element and ensure it's visible
    const element = this.page.locator(`//div[@draggable='true']//p[normalize-space()="${elementText}"]`);
    await element.waitFor({ state: 'visible', timeout: 15000 });
    
    // Get the canvas area and ensure it's ready
    const canvas = this.page.locator('section .x6-graph-scroller');
    await canvas.waitFor({ state: 'visible', timeout: 15000 });

    // Ensure the page is stable
    await this.page.waitForTimeout(1000);

    try {
      // Get element and canvas positions
      const elementBox = await element.boundingBox();
      const canvasBox = await canvas.boundingBox();
      
      if (!elementBox || !canvasBox) {
        throw new Error(`Could not find element with text "${elementText}" or canvas`);
      }

      // Calculate positions
      const sourceX = elementBox.x + elementBox.width / 2;
      const sourceY = elementBox.y + elementBox.height / 2;
      const targetXPos = canvasBox.x + targetX;
      const targetYPos = canvasBox.y + targetY;

      // First attempt: Using JavaScript drag and drop simulation
      const jsSelector = await element.evaluate(el => {
        // Create a unique data attribute to find the element
        const uniqueId = 'drag-' + Date.now();
        el.setAttribute('data-test-id', uniqueId);
        return `[data-test-id="${uniqueId}"]`;
      });

      await this.page.evaluate(
        async ([selector, canvasSelector, targetX, targetY]) => {
          const element = document.querySelector(selector);
          const canvas = document.querySelector(canvasSelector);
          
          if (!element || !canvas) return false;

          const rect = element.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();

          // Create and dispatch dragstart
          const dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
          });
          element.dispatchEvent(dragStartEvent);

          // Create and dispatch dragover
          const dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            clientX: canvasRect.left + targetX,
            clientY: canvasRect.top + targetY
          });
          canvas.dispatchEvent(dragOverEvent);

          // Create and dispatch drop
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: canvasRect.left + targetX,
            clientY: canvasRect.top + targetY,
            dataTransfer: dragStartEvent.dataTransfer
          });
          canvas.dispatchEvent(dropEvent);

          // Create and dispatch dragend
          const dragEndEvent = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            clientX: canvasRect.left + targetX,
            clientY: canvasRect.top + targetY
          });
          element.dispatchEvent(dragEndEvent);

          return true;
        },
        [jsSelector, 'section .x6-graph-scroller', targetX, targetY]
      );

      // Second attempt: Using mouse movements if JavaScript events didn't work
      await element.hover({ force: true });
      await this.page.mouse.down();
      await this.page.waitForTimeout(500);

      // Move in smaller steps
      const steps = 20;
      const deltaX = (targetXPos - sourceX) / steps;
      const deltaY = (targetYPos - sourceY) / steps;

      for (let i = 1; i <= steps; i++) {
        await this.page.mouse.move(
          sourceX + deltaX * i,
          sourceY + deltaY * i,
          { steps: 2 }
        );
        await this.page.waitForTimeout(50);
      }

      await this.page.mouse.move(targetXPos, targetYPos);
      await this.page.waitForTimeout(500);
      await this.page.mouse.up();

      // Wait for any animations and network activity to complete
      await this.page.waitForLoadState('networkidle');
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
    const maxAttempts = 3; // Increased retry attempts
    let attempt = 0;
    let found = false;

    while (attempt < maxAttempts && !found) {
      try {
        // Find all elements with this prefix
        const elements = this.page.locator(`g[data-cell-id^="${prefix}-"]`);
        
        // Wait for elements with increased timeout
        await elements.first().waitFor({ 
          state: 'visible', 
          timeout: 15000 
        });

        // Get all matching elements
        const count = await elements.count();
        console.log(`Found ${count} elements with prefix ${prefix}`);

        // Find the element with matching content
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          
          try {
            // Wait for the specific element to be visible
            await element.waitFor({ state: 'visible', timeout: 5000 });
            
            // Try different selectors for content
            const selectors = [
              'div[class*="verticalSpacer"] + p',
              'p',
              'div > p',
              'text'
            ];

            for (const selector of selectors) {
              try {
                const content = await element.locator(selector).textContent();
                if (content && content.trim() === expectedContent.trim()) {
                  found = true;
                  console.log(`Found matching element at index ${i} using selector ${selector}`);
                  break;
                }
              } catch (e) {
                continue;
              }
            }

            if (found) break;
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
        await this.page.waitForTimeout(3000); // Increased wait between retries
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