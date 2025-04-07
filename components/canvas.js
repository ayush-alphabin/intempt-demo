const { expect } = require('@playwright/test');

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

const elementConnectorType = {
  Triggers: 'trigger',
  Actions: 'action',
  Controls: 'control'
};

export class Canvas {
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

  getConnectorCategory(elementType) {
    const category = Object.entries(prefixDataCellIdsOfDropped).find(
      ([_, elements]) => elementType in elements
    )?.[0];
    return elementConnectorType[category] || category;
  };

  async connectElements(sourceElement, targetElement) {
    console.log(`Connecting ${sourceElement.type} and ${targetElement.type}...`);

    // Get categories for source and target elements
    const sourceConnectorCategory = this.getConnectorCategory(sourceElement.type);
    const targetConnectorCategory = this.getConnectorCategory(targetElement.type);

    if (!sourceConnectorCategory || !targetConnectorCategory) {
      throw new Error('Could not determine element categories');
    }

    const sourcePrefix = this.getElementPrefix(sourceElement.type);
    const targetPrefix = this.getElementPrefix(targetElement.type);

    if (!sourcePrefix || !targetPrefix) {
      throw new Error(`Could not find prefix IDs for elements: ${sourceElement.type}, ${targetElement.type}`);
    }

    // Locate the connectors using the same selectors as in the original implementation
    const sourceConnector = this.page.locator(`//*[contains(@data-cell-id,"${sourcePrefix}")]//*[contains(text(),"${sourceElement.text}")]//ancestor::div[contains(@class, "flowDiagram")]//*[contains(@port, "${sourceConnectorCategory}_output_horizontal")]`);
    const targetConnector = this.page.locator(`//*[contains(@data-cell-id,"${targetPrefix}")]//*[contains(text(),"${targetElement.text}")]//ancestor::div[contains(@class, "flowDiagram")]//*[contains(@port, "${targetConnectorCategory}_input_horizontal")]`);

    const sourceElementLocator = this.page.locator(`//*[contains(@data-cell-id,"${sourcePrefix}")]//*[contains(text(),"${sourceElement.text}")]`);
    const targetElementLocator = this.page.locator(`//*[contains(@data-cell-id,"${targetPrefix}")]//*[contains(text(),"${targetElement.text}")]`);

    await sourceElementLocator.waitFor({ state: 'visible', timeout: 15000 });
    await targetElementLocator.waitFor({ state: 'visible', timeout: 15000 });

    await sourceElementLocator.hover();

    const sourceConnectorBox = await sourceConnector.boundingBox();
    const targetConnectorBox = await targetConnector.boundingBox();

    if (!sourceConnectorBox || !targetConnectorBox) {
      throw new Error('Could not get element positions');
    }

    // Calculate connection points
    const sourceX = sourceConnectorBox.x + sourceConnectorBox.width;
    const sourceY = sourceConnectorBox.y + sourceConnectorBox.height / 2;
    const targetX = targetConnectorBox.x;
    const targetY = targetConnectorBox.y + targetConnectorBox.height / 2;

    // Perform the connection action
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, targetY, { steps: 30 }); // Smooth movement
    await this.page.waitForTimeout(500); // Add pause at target position before releasing
    await this.page.mouse.up();

    // Wait for connection to be established
    await this.page.waitForTimeout(2500);

    // Click at 0,0 position on the canvas
    const canvas = this.page.locator('section .x6-graph-scroller');
    await canvas.waitFor({ state: 'visible', timeout: 15000 });
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) {
      throw new Error('Could not get canvas position');
    }

    await this.page.mouse.click(canvasBox.x, canvasBox.y);
  }

  async assertEdgeExists(sourceElement, targetElement, maxAttempts = 3) {
    console.log(`Verifying edge between ${sourceElement.type} (${sourceElement.text}) and ${targetElement.type} (${targetElement.text})...`);

    // Get prefixes for source and target elements
    const getPrefix = (elementType) => {
      for (const category of Object.values(prefixDataCellIdsOfDropped)) {
        if (elementType in category) {
          return category[elementType];
        }
      }
      return null;
    };

    const sourcePrefix = getPrefix(sourceElement.type);
    const targetPrefix = getPrefix(targetElement.type);

    if (!sourcePrefix || !targetPrefix) {
      throw new Error(`Could not find prefix IDs for elements: ${sourceElement.type}, ${targetElement.type}`);
    }

    // Find the source and target elements
    const sourceElementLocator = this.page.locator(`g[data-cell-id^="${sourcePrefix}-"]`)
      .filter({ has: this.page.locator(`text=${sourceElement.text}`) });

    const targetElementLocator = this.page.locator(`g[data-cell-id^="${targetPrefix}-"]`)
      .filter({ has: this.page.locator(`text=${targetElement.text}`) });

    // Get the transforms (positions) of the elements
    let sourceTransform, targetTransform;

    try {
      sourceTransform = await sourceElementLocator.getAttribute('transform');
      targetTransform = await targetElementLocator.getAttribute('transform');

      if (!sourceTransform || !targetTransform) {
        throw new Error('Could not get element transforms');
      }

      console.log(`Source transform: ${sourceTransform}`);
      console.log(`Target transform: ${targetTransform}`);
    } catch (error) {
      console.error('Error getting element transforms:', error);
      return false;
    }

    // Parse the transforms to get the positions
    const parseTransform = (transform) => {
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (!match) return null;

      return {
        x: parseFloat(match[1]),
        y: parseFloat(match[2])
      };
    };

    const sourcePos = parseTransform(sourceTransform);
    const targetPos = parseTransform(targetTransform);

    if (!sourcePos || !targetPos) {
      console.error('Failed to parse element positions');
      return false;
    }

    console.log(`Source position: x=${sourcePos.x}, y=${sourcePos.y}`);
    console.log(`Target position: x=${targetPos.x}, y=${targetPos.y}`);

    // Get the size of the elements (assuming standard size from your DOM example)
    const elementWidth = 300;

    // Calculate expected connection points
    const expectedSourceX = sourcePos.x + elementWidth; // Right edge of source
    const expectedTargetX = targetPos.x; // Left edge of target

    console.log(`Expected connection points: from x=${expectedSourceX} to x=${expectedTargetX}`);

    // Now look for edges that connect these points
    let attempt = 0;
    let found = false;

    while (attempt < maxAttempts && !found) {
      try {
        // Look for all edges
        const edges = this.page.locator('g[data-shape="edge"]');
        const edgeCount = await edges.count();
        console.log(`Found ${edgeCount} edges on the canvas`);

        if (edgeCount === 0) {
          console.log('No edges found, waiting and retrying...');
          await this.page.waitForTimeout(1000);
          attempt++;
          continue;
        }

        // Check each edge
        for (let i = 0; i < edgeCount; i++) {
          const edge = edges.nth(i);
          const paths = await edge.locator('path').all();

          for (const path of paths) {
            const d = await path.getAttribute('d');
            if (!d) continue;

            console.log(`Checking path data: ${d}`);

            // Parse the path data to extract points
            // Path data format is typically: M x1 y1 L x2 y2 ... etc.
            const points = d.match(/[ML]\s*([0-9.]+)\s+([0-9.]+)/g);
            if (!points || points.length < 2) continue;

            // Extract first and last point coordinates
            const parsePoint = (pointStr) => {
              const match = pointStr.match(/[ML]\s*([0-9.]+)\s+([0-9.]+)/);
              if (!match) return null;
              return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
            };

            const firstPoint = parsePoint(points[0]);
            const lastPoint = parsePoint(points[points.length - 1]);

            if (!firstPoint || !lastPoint) continue;

            console.log(`Path points: start(${firstPoint.x}, ${firstPoint.y}), end(${lastPoint.x}, ${lastPoint.y})`);

            // Check if this path connects our elements with some tolerance
            const tolerance = 20; // Pixels of tolerance for connections

            // Check if the path starts near the source element's right edge
            const isSourceConnected = Math.abs(firstPoint.x - expectedSourceX) <= tolerance;

            // Check if the path ends near the target element's left edge
            const isTargetConnected = Math.abs(lastPoint.x - expectedTargetX) <= tolerance;

            if (isSourceConnected && isTargetConnected) {
              console.log('Found matching edge connecting the elements!');
              found = true;
              break;
            }
          }

          if (found) break;
        }

      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }

      attempt++;
      if (!found && attempt < maxAttempts) {
        console.log(`Retrying edge verification... Attempt ${attempt + 1}`);
        await this.page.waitForTimeout(1000);
      }
    }

    expect(found).toBe(true, `Edge between "${sourceElement.type}" and "${targetElement.type}" not found after ${maxAttempts} attempts`);
    return found;
  }
}