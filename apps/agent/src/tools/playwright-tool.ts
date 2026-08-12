import { chromium } from "@playwright/test";
import { tool } from "langchain";
import * as z from "zod";

export const fetchTextWithPlaywright = tool(
  async ({ url, selector = "body" }: { url: string; selector?: string }): Promise<string> => {
    const browser = await chromium.launch();

    try {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await page.waitForSelector(selector, {
        timeout: 30_000,
      });

      const text = await page.locator(selector).evaluateAll((elements) =>
        elements
          .map((element) => element.textContent?.trim())
          .filter((value): value is string => Boolean(value))
          .join("\n"),
      );

      return text || "No text content found for the selector.";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `Playwright fetch failed: ${message}`;
    } finally {
      await browser.close();
    }
  },
  {
    name: "fetch_text_with_playwright",
    description:
      "Use Playwright to open a webpage and extract text from elements matching a CSS selector.",
    schema: z.object({
      url: z.string().url().describe("The page URL to open in the browser"),
      selector: z.string().default("body").describe("The CSS selector used to extract page text"),
    }),
  },
);
