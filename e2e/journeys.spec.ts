import { test, expect } from "@playwright/test";
const nav = async (page: any, name: string) =>
  page
    .locator(".sidebar nav")
    .getByRole("button", { name, exact: true })
    .click();
test("learning, incident, terminal, story, planning and backup journeys", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ready when you are." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await nav(page, "Learning Path");
  await page
    .getByRole("button", { name: "ECC memory and missing DIMMs" })
    .click();
  await page
    .getByRole("button", {
      name: "Installed, firmware, and OS inventories",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Check understanding" }).click();
  await expect(
    page.getByText("Correct. Your progress is saved."),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await page.reload();
  await nav(page, "Dashboard");
  await expect(page.getByText("1 / 35", { exact: true })).toBeVisible();
  await nav(page, "Incident Simulator");
  await page
    .getByRole("button", { name: "Apply approved action", exact: true })
    .click();
  await expect(
    page.getByText(
      "Change blocked: collect evidence and support the diagnosis first.",
    ),
  ).toBeVisible();
  for (const name of ["Identity & scope", "Host evidence", "Switch evidence"])
    await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Wrong access VLAN", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply approved action", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Verify recovery", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Incident handoff" })
    .fill(
      "R07-U14 isolated by incorrect VLAN 130. Network owner approved correction to VLAN 120. Gateway and application now reachable, counters stable; shift lead owns observation.",
    );
  await page
    .getByRole("button", { name: "Close ticket with evidence" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Debrief: why the diagnosis fits" }),
  ).toBeVisible();
  await nav(page, "Linux Terminal");
  for (const c of [
    "ip link",
    "ip addr",
    "ip route",
    "sudo ip link set eno1 up",
    "ping 10.120.0.1",
  ]) {
    await page.getByRole("textbox", { name: "Terminal command" }).fill(c);
    await page
      .getByRole("textbox", { name: "Terminal command" })
      .press("Enter");
  }
  await page.getByRole("button", { name: "Verify the challenge" }).click();
  await expect(
    page.getByText("The gateway is reachable. Lab completed."),
  ).toBeVisible();
  await nav(page, "Interview Academy");
  await page.getByRole("button", { name: "Principles", exact: true }).click();
  await page
    .getByRole("button", { name: "Develop a real story" })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Story title", exact: true })
    .fill("Diagnosing a recurring access issue");
  await page
    .getByRole("textbox", { name: "Situation", exact: true })
    .fill(
      "A recurring login issue was affecting an internal support workflow.",
    );
  await page.waitForTimeout(300);
  await page.reload();
  await nav(page, "STAR Story Vault");
  await expect(
    page.getByRole("textbox", { name: "Story title", exact: true }),
  ).toHaveValue("Diagnosing a recurring access issue");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-stories h2")).toHaveText(
    "Diagnosing a recurring access issue",
  );
  await expect(page.locator(".print-stories")).toContainText(
    "A recurring login issue was affecting an internal support workflow.",
  );
  await page.emulateMedia({ media: "screen" });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-stories h2")).toHaveText(
    "Diagnosing a recurring access issue",
  );
  await expect(page.locator(".story-layout")).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  await nav(page, "Practice Exams");
  await page.getByRole("button", { name: /Diagnostic.*12 questions/ }).click();
  for (let i = 0; i < 12; i++) {
    await page.locator(".exam-panel .answer-options button").first().click();
    await page
      .getByRole("button", { name: "Check answer", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: i === 11 ? "View results" : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByText("ASSESSMENT SAVED", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Build your study plan" }).click();
  await page.getByRole("checkbox").first().check();
  await page.waitForTimeout(300);
  await page.reload();
  await nav(page, "Study Planner");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await nav(page, "Resource Library");
  await page.getByRole("textbox", { name: /Search ECC/ }).fill("optical");
  await expect(
    page.getByRole("heading", { name: "Optical loss and diagnostic tools" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Data & preferences" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("dco-academy-backup.json");
  await download.saveAs("test-results/backup.json");
  await page
    .locator("input[type=file]")
    .setInputFiles("test-results/backup.json");
  await expect(page.getByText("Backup imported")).toBeVisible();
  await page.getByRole("button", { name: "Close preferences" }).click();
  for (const name of [
    "Data Center Explorer",
    "Hardware Lab",
    "Network & Fiber Lab",
    "Career Readiness",
  ]) {
    await nav(page, name);
    await expect(page.locator("main h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("mobile navigation and no horizontal overflow in dark and light", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await nav(page, "Hardware Lab");
  await expect(
    page.getByRole("heading", { name: "Server hardware" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "test-results/hardware-mobile-light.png",
    fullPage: true,
  });
});

test("community context is attributed, protocol lessons work, and prep tasks persist", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Resource Library");
  await page
    .getByRole("textbox", { name: /Search ECC/ })
    .fill("community study repository");
  await expect(
    page.getByRole("link", {
      name: "AWS DCO Interview Prep - community study repository",
    }),
  ).toHaveAttribute(
    "href",
    "https://github.com/dco-study-guide/aws-dco-interview-prep",
  );
  await nav(page, "Learning Path");
  await page
    .getByRole("button", {
      name: "DNS answers, timeouts, and transport",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "RFC 7766 - DNS Transport over TCP" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "The TCP DNS path and resolver behavior",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Check understanding", exact: true })
    .click();
  await expect(
    page.getByText("Correct. Your progress is saved."),
  ).toBeVisible();
  await nav(page, "Career Readiness");
  const task = page.getByRole("checkbox", {
    name: "Test microphone, webcam, connection, and backup communication plan",
  });
  await task.check();
  await page.waitForTimeout(300);
  await page.reload();
  await nav(page, "Career Readiness");
  await expect(
    page.getByRole("checkbox", {
      name: "Test microphone, webcam, connection, and backup communication plan",
    }),
  ).toBeChecked();
});

test("redesigned labs support identification, links, history, and filtering", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Hardware Lab");
  await page
    .getByRole("button", { name: "Test component identification", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Inspect Memory (DIMMs)", exact: true })
    .click();
  await expect(page.getByText("That’s right.", { exact: true })).toBeVisible();
  await nav(page, "Learning Path");
  await page
    .getByRole("button", { name: "ECC memory and missing DIMMs", exact: true })
    .click();
  await expect(page).toHaveURL(/lesson=3-1/);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("ECC memory and missing DIMMs");
  await page.getByRole("button", { name: "Next lesson", exact: true }).click();
  await expect(page).toHaveURL(/lesson=3-2/);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("ECC memory and missing DIMMs");
  await nav(page, "Linux Terminal");
  await page.getByRole("button", { name: "ip route", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Terminal command" });
  await expect(input).toHaveValue("ip route");
  await input.press("Enter");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("ip route");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("");
  await input.fill("etht");
  await input.press("Tab");
  await expect(input).toHaveValue("ethtool eno1");
  await nav(page, "Incident Simulator");
  await page
    .getByRole("textbox", { name: "Search incidents", exact: true })
    .fill("optical");
  await expect(page.locator(".queue-item")).toHaveCount(1);
  await page.locator(".queue-item").click();
  await expect(
    page.locator("main h2").filter({ hasText: "Optical receive power low" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/incident=inc-11/);
  for (const img of await page.locator("img").all())
    expect(
      await img.evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      ),
    ).toBe(true);
});

test("all workspace sections fit a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const section of [
    "Learning Path",
    "Data Center Explorer",
    "Network & Fiber Lab",
    "Linux Terminal",
    "Incident Simulator",
    "Interview Academy",
    "STAR Story Vault",
    "Practice Exams",
    "Study Planner",
    "Resource Library",
    "Career Readiness",
  ]) {
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await nav(page, section);
    await expect(page.locator("main h1")).toBeVisible();
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
      section,
    ).toBe(true);
  }
});
