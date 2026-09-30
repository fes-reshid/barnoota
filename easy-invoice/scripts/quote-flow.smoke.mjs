import { chromium } from "playwright";

const BASE = "http://localhost:5183/invoice/";
const email = `quoteflow+${Date.now()}@example.com`;
const password = "Password123!";
const SCRATCH = "./scratch";

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

const shot = (name) => page.screenshot({ path: `${SCRATCH}/${name}.png`, fullPage: true });

try {
  console.log("Sign up + add a customer...");
  await page.goto(BASE + "#/signup");
  await page.fill("#businessName", "Quote Flow Test Co");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type=submit]');
  await page.waitForURL(/#\/$/, { timeout: 15000 });
  await page.waitForSelector("text=Welcome");
  await page.waitForTimeout(800);

  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await page.waitForSelector('h1:has-text("Customers")');
  await page.getByRole("button", { name: "Add customer" }).first().click();
  await page.locator('label:text-is("Business name")').locator("xpath=following-sibling::*[1]").fill("Blue Gum Landscaping");
  await page.getByRole("button", { name: "Add customer" }).last().click();
  await page.waitForTimeout(600);

  console.log("Create a quote...");
  await page.getByRole("link", { name: "Quotes", exact: true }).click();
  await page.waitForSelector('h1:has-text("Quotes")');
  await page.getByRole("link", { name: "New quote" }).first().click();
  await page.waitForSelector("h1:has-text('New quote')");
  await page.locator("select").first().selectOption({ label: "Blue Gum Landscaping" });
  await page.locator("textarea").first().fill("Garden redesign consultation");
  await page.locator('input[type=number]').first().fill("3");
  const price = page.locator('input[inputmode=decimal]').first();
  await price.fill("150.00");
  await price.blur();
  await page.waitForTimeout(300);
  await shot("quote-01-editor");

  await page.getByRole("button", { name: "Send quote" }).click();
  await page.waitForTimeout(1200);
  await shot("quote-02-sent");
  console.log("   URL after send:", page.url());
  const sentText = await page.locator("body").innerText();
  console.log("   Shows QUO-0001 number?", sentText.includes("QUO-0001"));
  console.log("   Shows 'Sent' status?", sentText.includes("Sent"));

  console.log("Mark quote accepted...");
  await page.getByRole("button", { name: "Mark accepted" }).click();
  await page.waitForTimeout(800);
  await shot("quote-03-accepted");

  console.log("Convert to invoice...");
  await page.getByRole("button", { name: "Convert to invoice" }).click();
  await page.waitForTimeout(1200);
  await shot("quote-04-converted");
  console.log("   URL after convert:", page.url());
  const convertedUrlOk = /#\/invoices\/[^/]+\/edit$/.test(page.url());
  console.log("   Landed on a draft invoice editor?", convertedUrlOk);

  const invoiceEditorText = await page.locator("body").innerText();
  console.log("   Invoice pre-filled with customer 'Blue Gum Landscaping'?", invoiceEditorText.includes("Blue Gum Landscaping"));
  console.log("   Invoice pre-filled with the quote's line item?", invoiceEditorText.includes("Garden redesign consultation"));

  console.log("Issue the converted invoice...");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Issue invoice" }).click();
  await page.waitForTimeout(1200);
  await shot("quote-05-invoice-issued");
  const issuedText = await page.locator("body").innerText();
  console.log("   Invoice issued with a real number?", /INV-\d{4}/.test(issuedText));

  console.log("Back to the quote — should show it's linked/converted...");
  await page.getByRole("link", { name: "Quotes", exact: true }).click();
  await page.waitForSelector('h1:has-text("Quotes")');
  const quotesListText = await page.locator("body").innerText();
  console.log("   Quotes list shows 'Converted' status?", quotesListText.includes("Converted"));

  console.log("\nDONE - quote-to-invoice conversion exercised successfully");
} catch (e) {
  console.error("FAILED:", e);
  await shot("quote-ERROR").catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
