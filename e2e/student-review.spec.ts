import { test, expect } from "@playwright/test";
import { lessons } from "../src/content";
const nav = async (page: any, name: string) =>
  page
    .locator(".sidebar nav")
    .getByRole("button", { name, exact: true })
    .click();
test("unfinished exams and interview answers survive reload, mode changes, and question changes", async ({
  page,
}) => {
  await page.goto("/#/interview-academy");
  const response = page.getByRole("textbox", {
    name: "Your response",
    exact: true,
  });
  await response.fill(
    "I checked the service logs because I needed to narrow down the fault.",
  );
  await page
    .getByRole("button", { name: "Ask a follow-up", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Follow-up response", exact: true })
    .fill(
      "I verified that the service was restored and wrote down what I learned.",
    );
  await page
    .getByRole("button", { name: "Get practice feedback", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await response.fill("My second answer is a different experience.");
  await page.getByRole("button", { name: "Technical", exact: true }).click();
  await response.fill(
    "I would start with the interface state and route before changing anything.",
  );
  await page.reload();
  await expect(response).toHaveValue(
    "I would start with the interface state and route before changing anything.",
  );
  await page.getByRole("button", { name: "Behavioral", exact: true }).click();
  await expect(response).toHaveValue(
    "My second answer is a different experience.",
  );
  await page
    .getByRole("button", { name: "Previous question", exact: true })
    .click();
  await expect(response).toHaveValue(
    "I checked the service logs because I needed to narrow down the fault.",
  );
  await expect(
    page.getByRole("heading", { name: "Feedback on your answer", exact: true }),
  ).toBeVisible();
  await nav(page, "Practice Exams");
  await page.getByRole("button", { name: /Diagnostic.*12 questions/ }).click();
  await page.locator(".exam-panel .answer-options button").first().click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.locator(".exam-panel .answer-options button").nth(1).click();
  await page.reload();
  await expect(page.locator(".exam-panel .pill")).toContainText("2 / 12");
  await expect(
    page.locator(".exam-panel .answer-options button").nth(1),
  ).toHaveClass(/selected/);
  await page
    .getByRole("button", { name: "Save and finish later", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue practice test", exact: true })
    .click();
  await expect(page.locator(".exam-panel .pill")).toContainText("2 / 12");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Next question", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toHaveCount(0);
});
test("every lesson opens, quiz feedback resumes, hardware can retry, and checklists survive a backup round trip", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const l of lessons) {
    await page.goto("/#/learning-path?lesson=" + l.id);
    await expect(page.locator("main h1")).toHaveText(l.title);
    await expect(page.locator(".lesson-body > .tabs")).toHaveCount(1);
    await expect(page.locator(".lesson-body")).toContainText(l.concept);
    await page.locator("a.skip").focus();
    await page.locator("a.skip").press("Enter");
    await expect(page.locator("main h1")).toHaveText(l.title);
    await page
      .locator(".lesson-body > .tabs")
      .getByRole("button", { name: "Foundation", exact: true })
      .click();
    await page
      .locator(".lesson-body > .tabs")
      .getByRole("button", { name: "Deep Dive", exact: true })
      .click();
    await expect(
      page.getByText("Check your reasoning", { exact: true }),
    ).toBeVisible();
  }
  const l = lessons[0];
  await page.goto("/#/learning-path?lesson=" + l.id);
  await page
    .getByRole("textbox", { name: "Lesson practice notes", exact: true })
    .fill("Compare the asset identity and the original symptom before repair.");
  await page
    .locator(".knowledge-check .answer-options button")
    .nth(l.answer)
    .click();
  await page
    .getByRole("button", { name: "Check understanding", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Check understanding", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("textbox", { name: "Lesson practice notes", exact: true }),
  ).toHaveValue(
    "Compare the asset identity and the original symptom before repair.",
  );
  await nav(page, "Hardware Lab");
  await page
    .getByRole("button", { name: "Test component identification", exact: true })
    .click();
  await page
    .getByRole("button", { name: "1 CPU & heatsink", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try this question again", exact: true })
    .click();
  await page
    .getByRole("button", { name: "2 Memory (DIMMs)", exact: true })
    .click();
  await expect(page.locator(".identify-question")).toContainText(
    "That’s right.",
  );
  await page.reload();
  await expect(page.locator(".identify-question")).toContainText(
    "That’s right.",
  );
  await nav(page, "Career Readiness");
  await page.getByRole("checkbox").nth(2).check();
  await nav(page, "Study Planner");
  await page.getByRole("checkbox").first().check();
  await page
    .getByRole("button", { name: "Data & preferences", exact: true })
    .click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const file = await pending;
  await file.saveAs("test-results/student-backup.json");
  await page
    .locator("input[type=file]")
    .setInputFiles("test-results/student-backup.json");
  await expect(
    page.getByText("Backup imported", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close preferences", exact: true })
    .click();
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await nav(page, "Career Readiness");
  await expect(page.getByRole("checkbox").nth(2)).toBeChecked();
  expect(errors).toEqual([]);
});
test("searches explain empty results and a glossary deep link reveals the selected list item", async ({
  page,
}) => {
  await page.goto("/#/learning-path");
  await page
    .getByRole("textbox", { name: "Search lessons and concepts", exact: true })
    .fill("zz-no-results");
  await expect(
    page.getByRole("heading", { name: "No lessons found", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show all lessons", exact: true })
    .click();
  await expect(page.locator(".curriculum-card")).toHaveCount(16);
  await nav(page, "Resource Library");
  await page
    .getByRole("combobox", { name: "Resource filter", exact: true })
    .selectOption("Lessons");
  await page.getByRole("textbox", { name: /Search ECC/ }).fill("zz-no-results");
  await expect(
    page.getByRole("heading", { name: "No lessons found", exact: true }),
  ).toBeVisible();
  await page.goto("/#/glossary?term=ecc");
  await expect(page.locator(".glossary-list button.selected")).toBeInViewport();
});
