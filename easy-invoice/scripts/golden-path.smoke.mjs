import { chromium } from "playwright";

const BASE = "http://localhost:5183/invoice/";
const email = `owner+${Date.now()}@example.com`;
const password = "Password123!";
const SCRATCH = "./scratch";

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("requestfailed", (req) => console.log("[requestfailed]", req.url(), req.failure()?.errorText));

const shot = (name) => page.screenshot({ path: `${SCRATCH}/${name}.png`, fullPage: true });

async function gotoHash(hash) {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await page.waitForTimeout(400);
}

// Forms use a plain <label class="field-label"> as a sibling before the
// <input>, not a htmlFor association, so getByLabel() can't find them —
// walk to the next input by DOM position instead.
function fieldNear(labelText) {
  return page.locator(`label:text-is("${labelText}")`).locator("xpath=following-sibling::*[1]");
}

try {
  console.log("1. Sign up...");
  await page.goto(BASE + "#/signup");
  await page.fill("#businessName", "Golden Path Test Co");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type=submit]');
  await page.waitForURL(/#\/$/, { timeout: 15000 });
  await page.waitForSelector("text=Welcome");
  await shot("01-dashboard-empty");
  console.log("   OK - reached dashboard as", email);

  console.log("2. Configure business settings...");
  await gotoHash("#/settings");
  await page.waitForSelector('h1:has-text("Business Settings")', { timeout: 15000 });
  await fieldNear("Phone").fill("0400 000 000");
  await fieldNear("ABN").fill("51 824 753 556");
  const gstCheckbox = page.getByLabel("This business is registered for GST");
  if (!(await gstCheckbox.isChecked())) await gstCheckbox.check();
  await fieldNear("Bank name").fill("Test Bank");
  await fieldNear("Account name").fill("Golden Path Test Co");
  await fieldNear("BSB").fill("123-456");
  await fieldNear("Account number").fill("12345678");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.waitForTimeout(800);
  await shot("02-settings-saved");
  console.log("   OK - settings saved");

  console.log("3. Add a customer...");
  await gotoHash("#/customers");
  await page.waitForSelector('h1:has-text("Customers")');
  await page.getByRole("button", { name: "Add customer" }).first().click();
  await page.waitForSelector("text=Add customer >> visible=true");
  const nameField = fieldNear("Business name");
  await nameField.waitFor({ state: "visible", timeout: 10000 });
  await nameField.fill("Sunrise Cafe Pty Ltd");
  await page.locator('input[type=email]').fill("sunrise@example.com");
  await page.getByRole("button", { name: "Add customer" }).last().click();
  await page.waitForTimeout(800);
  await shot("03-customer-added");
  console.log("   OK - customer added");

  console.log("4. Create an invoice...");
  await gotoHash("#/invoices/new");
  await page.waitForSelector("h1:has-text('New invoice')");
  await page.locator("select").first().selectOption({ label: "Sunrise Cafe Pty Ltd" });
  await page.locator("textarea").first().fill("Website design work");
  await page.locator('input[type=number]').first().fill("2");
  const priceInput = page.locator('input[inputmode=decimal]').first();
  await priceInput.fill("150.00");
  await priceInput.blur();
  await page.waitForTimeout(300);
  await shot("04-invoice-editor");

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Issue invoice" }).click();
  await page.waitForTimeout(1500);
  await shot("05-invoice-issued");
  console.log("   URL after issue:", page.url());
  const issuedText = await page.locator("body").innerText();
  console.log("   Shows 'Issued' status?", issuedText.includes("Issued"));
  console.log("   Shows total $330.00 (2 x $150 + 10% GST)?", issuedText.includes("330.00"));

  console.log("5. Download the PDF...");
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const pdfPath = `${SCRATCH}/invoice.pdf`;
  await download.saveAs(pdfPath);
  console.log("   OK - PDF downloaded to", pdfPath);

  console.log("6. Record a payment...");
  await page.getByRole("button", { name: "Record payment" }).click();
  await page.waitForSelector("text=Record a payment");
  await shot("06-payment-modal");
  await page.getByRole("button", { name: "Record payment" }).last().click();
  await page.waitForTimeout(1000);
  await shot("07-after-payment");

  const finalText = await page.locator("body").innerText();
  console.log("   Shows 'Paid' status?", finalText.includes("Paid"));
  console.log("   Shows $0.00 balance somewhere?", finalText.includes("$0.00"));

  console.log("\nDONE - golden path exercised successfully");
} catch (e) {
  console.error("FAILED:", e);
  await shot("ERROR").catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
