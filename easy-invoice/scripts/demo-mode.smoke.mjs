import { chromium } from "playwright";

/**
 * Exercises Demo Mode (src/lib/demo/) — the localStorage-backed experience
 * that runs automatically when no Firebase project is configured. Run with
 * NO .env/.env.local present (so `isFirebaseConfigured` is false):
 *   npm run dev -- --port 5183 --strictPort
 *   node scripts/demo-mode.smoke.mjs
 */
const BASE = "http://localhost:5183/invoice/";
const SCRATCH = "./scratch";

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "warning") console.log(`[console.${msg.type()}]`, msg.text()); });

const shot = (name) => page.screenshot({ path: `${SCRATCH}/${name}.png`, fullPage: true });

try {
  console.log("1. Visit the live-site root with NO Firebase configured...");
  await page.goto(BASE);
  await page.waitForSelector("text=Welcome", { timeout: 15000 });
  await page.waitForTimeout(1500); // let auto-seed finish
  await shot("demo-01-dashboard");
  const bodyText1 = await page.locator("body").innerText();
  console.log("   Landed straight on dashboard (no login)?", bodyText1.includes("Welcome"));
  console.log("   Shows demo banner?", bodyText1.includes("You're viewing a live demo"));
  console.log("   Auto-seeded with a real invoice number?", /INV-\d{4}/.test(bodyText1));
  console.log("   Shows Sunrise Cafe (seeded customer)?", bodyText1.includes("Sunrise Cafe"));

  console.log("2. Check Customers page has the 3 seeded customers...");
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await page.waitForSelector('h1:has-text("Customers")');
  await shot("demo-02-customers");
  const customersText = await page.locator("body").innerText();
  console.log("   Has Sunrise Cafe?", customersText.includes("Sunrise Cafe"));
  console.log("   Has Marcus Webb?", customersText.includes("Marcus Webb"));
  console.log("   Has Blue Gum Landscaping?", customersText.includes("Blue Gum Landscaping"));

  console.log("3. Reload the page — data should persist (it's in localStorage)...");
  await page.reload();
  await page.waitForSelector('h1:has-text("Customers")');
  const afterReload = await page.locator("body").innerText();
  console.log("   Still has all 3 customers after reload?", ["Sunrise Cafe", "Marcus Webb", "Blue Gum"].every((n) => afterReload.includes(n)));

  console.log("4. Check the seeded invoice + quote...");
  await page.getByRole("link", { name: "Invoices", exact: true }).click();
  await page.waitForSelector('h1:has-text("Invoices")');
  const invoicesText = await page.locator("body").innerText();
  console.log("   Shows an issued/partially-paid invoice?", invoicesText.includes("Partially Paid") || invoicesText.includes("Paid"));

  await page.getByRole("link", { name: "Quotes", exact: true }).click();
  await page.waitForSelector('h1:has-text("Quotes")');
  const quotesText = await page.locator("body").innerText();
  console.log("   Shows a sent quote (QUO-0001)?", quotesText.includes("QUO-0001"));

  console.log("5. Try creating a brand-new invoice in demo mode...");
  await page.getByRole("link", { name: "Invoices", exact: true }).click();
  await page.getByRole("link", { name: "New invoice" }).first().click();
  await page.waitForSelector("h1:has-text('New invoice')");
  await page.locator("select").first().selectOption({ label: "Marcus Webb" });
  await page.locator("textarea").first().fill("Demo-mode test line");
  await page.locator('input[type=number]').first().fill("1");
  const price = page.locator('input[inputmode=decimal]').first();
  await price.fill("99.00");
  await price.blur();
  await page.getByRole("button", { name: "Issue invoice" }).click();
  await page.waitForTimeout(1000);
  await shot("demo-03-new-invoice-issued");
  const newInvoiceText = await page.locator("body").innerText();
  console.log("   New invoice got its own sequential number?", /INV-000[2-9]/.test(newInvoiceText));

  console.log("6. Reset demo data...");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.waitForSelector("text=Welcome");
  await page.waitForTimeout(2500); // let the re-seed finish before checking
  await shot("demo-04-after-reset");
  const afterResetDashboard = await page.locator("body").innerText();
  console.log("   Dashboard shows Sunrise Cafe right after reset?", afterResetDashboard.includes("Sunrise Cafe"));

  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await page.waitForSelector('h1:has-text("Customers")');
  await page.waitForTimeout(500);
  await shot("demo-05-customers-after-reset");
  const customersAfterReset = await page.locator("body").innerText();
  console.log("   Customers page shows Sunrise Cafe after reset?", customersAfterReset.includes("Sunrise Cafe"));
  console.log("   localStorage state:", await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("easy-invoice-demo"))));

  console.log("\nDONE - demo mode exercised successfully");
} catch (e) {
  console.error("FAILED:", e);
  await shot("demo-ERROR").catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
