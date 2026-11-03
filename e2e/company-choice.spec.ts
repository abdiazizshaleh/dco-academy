import { test, expect } from "@playwright/test";
const nav = async (page: any, name: string) =>
  page
    .locator(".sidebar nav")
    .getByRole("button", { name, exact: true })
    .click();
test("saved company choice tailors the plan and interview without mixing drafts or completion", async ({
  page,
}) => {
  await page.goto("/#/study-planner");
  const choice = page.getByRole("combobox", {
    name: "Applying to",
    exact: true,
  });
  await expect(choice).toHaveValue("aws");
  await page.getByRole("checkbox").first().check();
  await nav(page, "Interview Academy");
  const answer = page.getByRole("textbox", {
    name: "Your response",
    exact: true,
  });
  await answer.fill("My saved AWS example is about Customer Obsession.");
  await choice.selectOption("google");
  await expect(
    page.getByRole("button", { name: "Principles", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".interview-panel h2")).toContainText(
    "repaired a hardware problem",
  );
  await expect(answer).toHaveValue("");
  await answer.fill("My saved Google example is about a hardware repair.");
  await page.getByRole("button", { name: "Technical", exact: true }).click();
  await answer.fill(
    "My Google technical answer uses memory inventory evidence.",
  );
  await page.reload();
  await expect(choice).toHaveValue("google");
  await expect(answer).toHaveValue(
    "My Google technical answer uses memory inventory evidence.",
  );
  await nav(page, "Study Planner");
  await expect(
    page.getByRole("heading", { name: "Google study plan", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".module-grid")).not.toContainText(
    "Amazon Leadership Principles",
  );
  await expect(page.locator(".module-grid")).not.toContainText(
    "Learn: DCO, DCEO",
  );
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await page.getByRole("checkbox").first().check();
  await choice.selectOption("aws");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(page.locator(".module-grid")).toContainText(
    "Amazon Leadership Principles",
  );
  await choice.selectOption("google");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page
    .getByRole("button", {
      name: "Rehearse a Google behavioral example",
      exact: true,
    })
    .first()
    .click();
  await expect(answer).toHaveValue(
    "My saved Google example is about a hardware repair.",
  );
  await choice.selectOption("aws");
  await expect(answer).toHaveValue(
    "My saved AWS example is about Customer Obsession.",
  );
  await expect(
    page.getByRole("button", { name: "Principles", exact: true }),
  ).toBeVisible();
  await choice.selectOption("google");
  await page
    .getByRole("button", { name: "Data & preferences", exact: true })
    .click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const file = await pending;
  await file.saveAs("test-results/company-choice-backup.json");
  await page
    .locator("input[type=file]")
    .setInputFiles("test-results/company-choice-backup.json");
  await expect(
    page.getByText("Backup imported", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close preferences", exact: true })
    .click();
  await page.reload();
  await expect(choice).toHaveValue("google");
  await expect(answer).toHaveValue(
    "My saved Google example is about a hardware repair.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/company-choice-mobile.png",
    fullPage: true,
  });
});
