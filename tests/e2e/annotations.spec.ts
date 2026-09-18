import { test, expect } from "@playwright/test";

test.describe("PDF Annotations", () => {
  test("creates and persists annotation via keyboard shortcut on /test", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/test");

    // Require the PDF text layer to be visible and rendered
    const textLayer = page.locator(".pdf-text-layer").first();
    await expect(textLayer).toBeVisible({ timeout: 30000 });

    const spans = textLayer.locator("span");
    await expect(spans.first()).toBeVisible({ timeout: 15000 });

    // Find a span with readable text to drag across
    const targetSpan = spans.nth(2);
    const box = (await targetSpan.boundingBox()) || (await spans.first().boundingBox());
    expect(box).not.toBeNull();

    if (box) {
      await page.mouse.move(box.x + 4, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    // Small pause to allow selectionchange event to propagate
    await page.waitForTimeout(300);

    // Press 'h' shortcut to create highlight annotation
    await page.keyboard.press("h");

    // Assert a visible .pdf-annotation element is rendered
    const annotation = page.locator(".pdf-annotation").first();
    await expect(annotation).toBeVisible({ timeout: 10000 });

    // Assert persistence under 'reeda-annotations:test-fixture-document'
    const persisted = await page.evaluate(() => {
      return localStorage.getItem("reeda-annotations:test-fixture-document");
    });
    expect(persisted).not.toBeNull();
    const parsed = JSON.parse(persisted!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed[0].type).toBe("highlight");

    // Fail on any "page render failed" console errors
    const hasRenderError = consoleErrors.some((err) =>
      err.toLowerCase().includes("page render failed"),
    );
    expect(hasRenderError).toBe(false);
  });
});
