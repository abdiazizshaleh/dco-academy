import { test, expect } from "@playwright/test";
import { terminalLabs } from "../src/terminal";
const nav = async (page: any, name: string) =>
  page
    .locator(".sidebar nav")
    .getByRole("button", { name, exact: true })
    .click();
test("glossary lookup, bookmarks, notes, deep links, and related lessons", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Glossary");
  await expect(
    page.getByRole("heading", { name: "Glossary", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search glossary", exact: true })
    .fill("baseboard management");
  await expect(page.locator("#term-detail-heading")).toHaveText("BMC");
  await page
    .getByRole("textbox", { name: "Search glossary", exact: true })
    .fill("ECC");
  await expect(page.locator("#term-detail-heading")).toHaveText("ECC");
  await page.getByRole("button", { name: "Bookmark ECC", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Notes for ECC", exact: true })
    .fill("Compare installed inventory with firmware and OS capacity.");
  await expect(page).toHaveURL(/term=ecc/);
  await page.waitForTimeout(300);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Notes for ECC", exact: true }),
  ).toHaveValue("Compare installed inventory with firmware and OS capacity.");
  await page.getByRole("button", { name: "Saved terms", exact: true }).click();
  await expect(page.locator(".glossary-list>button")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Read the related lesson", exact: true })
    .click();
  await expect(page.locator("main h1")).toHaveText(
    "ECC memory and missing DIMMs",
  );
  await page
    .locator(".lesson-key-terms")
    .getByRole("button", { name: "ECC", exact: true })
    .click();
  await expect(page.locator("#term-detail-heading")).toHaveText("ECC");
  await page
    .getByRole("textbox", { name: "Search glossary", exact: true })
    .fill("zzzz-no-match");
  await expect(
    page.getByRole("heading", { name: "No terms found", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show all terms", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Glossary topic", exact: true })
    .selectOption("Fiber");
  await expect(page.locator(".glossary-list>button")).not.toHaveCount(0);
  await page.screenshot({
    path: "test-results/glossary-desktop.png",
    fullPage: true,
  });
});
test("all four Linux labs work through the UI and keep separate saved hosts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/linux-terminal");
  for (const lab of terminalLabs) {
    await page
      .locator(".terminal-lab-picker")
      .getByRole("button", { name: new RegExp(lab.title) })
      .click();
    for (const command of lab.solution) {
      await page
        .getByRole("textbox", { name: "Terminal command", exact: true })
        .fill(command);
      await page
        .getByRole("textbox", { name: "Terminal command", exact: true })
        .press("Enter");
    }
    await page
      .getByRole("button", { name: "Verify the challenge", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Lab completed", exact: true }),
    ).toBeDisabled();
  }
  await page
    .locator(".terminal-lab-picker")
    .getByRole("button", { name: /Fix name resolution/ })
    .click();
  await page
    .getByRole("textbox", { name: "Terminal command", exact: true })
    .fill("cat /etc/resolv.conf");
  await page
    .getByRole("textbox", { name: "Terminal command", exact: true })
    .press("Enter");
  await expect(page.locator(".terminal-entry").last()).toContainText(
    "nameserver 10.120.0.53",
  );
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator(".terminal-mission h2")).toHaveText(
    "Fix name resolution",
  );
  await expect(
    page.getByRole("button", { name: "Lab completed", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Terminal command", exact: true })
    .fill("cd /etc; ls; cat resolv.conf | grep nameserver | wc -l");
  await page
    .getByRole("textbox", { name: "Terminal command", exact: true })
    .press("Enter");
  await expect(page.locator(".terminal-entry").last()).toContainText("1");
  await page.screenshot({
    path: "test-results/terminal-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("glossary and terminal fit phone screens in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/glossary?term=ecc");
  await expect(page.locator("#term-detail-heading")).toHaveText("ECC");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/glossary-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Toggle color theme", exact: true })
    .click();
  await page.goto("/#/linux-terminal");
  await expect(page.locator(".terminal-mission h2")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("textbox", { name: "Terminal command", exact: true })
    .fill("ls /etc");
  await page
    .getByRole("textbox", { name: "Terminal command", exact: true })
    .press("Enter");
  await expect(page.locator(".terminal-entry").last()).toContainText(
    "resolv.conf",
  );
  await page.screenshot({
    path: "test-results/terminal-mobile-light.png",
    fullPage: true,
  });
});
