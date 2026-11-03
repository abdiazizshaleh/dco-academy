import { test, expect } from "@playwright/test";
test("company context is clear and the Google checklist saves independently", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Compare the roles", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "AWS and Google: where the preparation overlaps",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Read the Google example posting",
      exact: true,
    }),
  ).toHaveAttribute("href", /118500840158700230/);
  const google = page.getByRole("checkbox", {
    name: "Compare the minimum and preferred qualifications in your chosen Google posting.",
    exact: true,
  });
  await google.check();
  await page.reload();
  await expect(google).toBeChecked();
  await expect(
    page.getByRole("checkbox", {
      name: "Read the specific current job posting and location requirements",
      exact: true,
    }),
  ).not.toBeChecked();
  await page
    .getByRole("button", { name: "Practice a technical answer", exact: true })
    .click();
  await expect(page.locator(".company-note")).toContainText("AWS / Amazon");
  await page.getByRole("button", { name: "Behavioral", exact: true }).click();
  await expect(page.locator(".company-note")).toContainText("AWS / Amazon");
  await page
    .getByRole("button", { name: "Compare AWS and Google", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Study Amazon’s principles", exact: true })
    .click();
  await expect(page.locator(".company-note")).toContainText(
    "They are not Google’s interview framework.",
  );
  await page.goto("/#/learning-path?lesson=3-1");
  await expect(page.locator(".company-note")).toContainText(
    "Shared · AWS & Google",
  );
  await page.goto("/#/career-readiness");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/company-context-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/company-context-desktop.png",
    fullPage: true,
  });
});
