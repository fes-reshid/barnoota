import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

const BASE = "http://localhost:5183/invoice/";
const email = `multipage+${Date.now()}@example.com`;
const password = "Password123!";
const SCRATCH = "./scratch";

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

async function gotoHash(hash) {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  await page.waitForTimeout(400);
}

const LONG_DESCRIPTION =
  "Comprehensive end-to-end website redesign engagement covering discovery workshops, competitor analysis, information architecture, wireframing across all breakpoints, high-fidelity visual design in three rounds of revisions, a full design system with reusable components, accessibility auditing against WCAG 2.1 AA, front-end implementation with semantic HTML and responsive CSS, cross-browser QA on Chrome/Firefox/Safari/Edge, performance tuning to hit sub-2-second load times, and a two-week hypercare period post-launch with same-day bug triage. " .repeat(3);

try {
  console.log("Sign up...");
  await page.goto(BASE + "#/signup");
  await page.fill("#businessName", "Multi Page Test Co");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type=submit]');
  await page.waitForURL(/#\/$/, { timeout: 15000 });
  await page.waitForSelector("text=Welcome");
  await page.waitForTimeout(1000);

  console.log("Add a customer...");
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await page.waitForSelector('h1:has-text("Customers")');
  await page.getByRole("button", { name: "Add customer" }).first().click();
  const nameField = page.locator('label:text-is("Business name")').locator("xpath=following-sibling::*[1]");
  await nameField.fill("Big Client Pty Ltd");
  await page.getByRole("button", { name: "Add customer" }).last().click();
  await page.waitForTimeout(600);

  console.log("Build a large invoice (25 lines + one very long description)...");
  await page.getByRole("link", { name: "Invoices", exact: true }).click();
  await page.waitForSelector('h1:has-text("Invoices")');
  await page.getByRole("link", { name: "New invoice" }).first().click();
  await page.waitForSelector("h1:has-text('New invoice')");
  await page.locator("select").first().selectOption({ label: "Big Client Pty Ltd" });

  // First line gets the very long description.
  await page.locator("textarea").first().fill(LONG_DESCRIPTION);
  await page.locator('input[type=number]').first().fill("1");
  await page.locator('input[inputmode=decimal]').first().fill("500.00");
  await page.locator('input[inputmode=decimal]').first().blur();

  const addLineBtn = page.getByRole("button", { name: "Add line" });
  for (let i = 0; i < 24; i++) {
    await addLineBtn.click();
  }
  await page.waitForTimeout(300);

  const textareas = page.locator("textarea");
  const count = await textareas.count();
  console.log(`   ${count} line items on the invoice`);
  for (let i = 1; i < count; i++) {
    await textareas.nth(i).fill(`Line item #${i + 1} — additional consulting hours and misc project costs`);
  }
  const priceInputs = page.locator('input[inputmode=decimal]');
  const priceCount = await priceInputs.count();
  for (let i = 1; i < priceCount; i++) {
    await priceInputs.nth(i).fill("120.00");
    await priceInputs.nth(i).blur();
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCRATCH}/multipage-editor.png`, fullPage: true });

  await page.getByRole("button", { name: "Issue invoice" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCRATCH}/multipage-issued.png`, fullPage: true });
  console.log("   URL after issue:", page.url());

  console.log("Download PDF and check page count...");
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const pdfPath = `${SCRATCH}/multipage-invoice.pdf`;
  await download.saveAs(pdfPath);

  const bytes = await (await import("node:fs/promises")).readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(bytes);
  const pageCount = pdfDoc.getPageCount();
  console.log(`   PDF has ${pageCount} page(s)`);
  console.log(pageCount > 1 ? "   PASS - multi-page PDF confirmed" : "   FAIL - expected more than 1 page");

  process.exitCode = pageCount > 1 ? 0 : 1;
} catch (e) {
  console.error("FAILED:", e);
  await page.screenshot({ path: `${SCRATCH}/multipage-ERROR.png`, fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
